---
layout: site
title: Subqueries in Active Record
date: 2022-06-09 00:00:00 -0500
permalink: /rails-subqueries/
---
<br/>Associations are a core feature of object-relational mapping systems like Active Record. For instance, a social media application may have users and posts - each post belongs to a user, and each user may have multiple posts.

Including an aggregate (e.g. count, average, minimum, maximum, sum, etc.) of associated records is a common Active Record pattern. Say a developer wishes to return a list of users with their total posts count - they might write the following query:

```ruby
users = User.select('users.*, COUNT(*) AS posts_count').left_joins(:posts)
# SELECT users.*, COUNT(*) FROM users LEFT JOINS posts ON users.id = posts.user_id

users.first.posts_count
# => 5
```

Imagine an application with the following associations, and consider a more complicated use case: how can a developer select the total dollar amounts of users' pending and shipped orders in a single query?

```ruby
class Order < ApplicationRecord
  belongs_to :user

  scope :pending, -> { where(shipped_at: nil) }
  scope :shipped, -> { where.not(shipped_at: nil) }
end

class User < ApplicationRecord
  has_many :orders

  has_many :pending_orders,
    -> { merge(Order.pending) }
    source: :order

  has_many :shipped_orders,
    -> { merge(Order.shipped) }
    source: :order
end
```

If using a left join as in the first example, the developer must duplicate Active Record scopes as raw SQL. This is not ideal from a maintenance perspective - should the scope logic change, the SQL must be updated accordingly.

```ruby
users = User.select('users.*')
  .select('SUM(CASE WHEN shipped_at IS NULL THEN amount ELSE 0 END) AS pending_orders_total')
  .select('SUM(CASE WHEN shipped_at IS NULL THEN 0 ELSE amount END) AS shipped_orders_total')
  .left_joins(:orders)

# SELECT
#   users.*,
#   SUM(CASE WHEN shipped_at IS NULL THEN amount ELSE 0 END) AS pending_orders_total,
#   SUM(CASE WHEN shipped_at IS NULL THEN 0 ELSE amount END) AS shipped_orders_total
# FROM users
# LEFT JOIN orders ON orders.user_id = users.id
```

How can the above query be rewritten to make use of existing Active Record associations? One possibility is using subqueries. First, re-write the above generated SQL to make use of subqueries instead of a left join:

```sql
SELECT
  users.*,
  (SELECT SUM(amount) FROM users _users JOIN orders ON users.id = orders.users_id WHERE users.id = _users.id AND orders.shipped_at IS NULL)     AS pending_orders_total,
  (SELECT SUM(amount) FROM users _users JOIN orders ON users.id = orders.users_id WHERE users.id = _users.id AND orders.shipped_at IS NOT NULL) AS shipped_orders_total
FROM users
```

Next, re-write the raw SQL as an Active Record query:

```ruby
pending_orders_subquery = User.select('SUM(amount)')
  .from('users _users')
  .joins(:pending_orders)
  .where('users.id = _users.id')

shipped_orders_subquery = User.select('SUM(amount)')
  .from('users _users')
  .joins(:shipped_orders)
  .where('users.id = _users.id')

User
  .select('users.*')
  .select("(#{pending_orders_subquery.to_sql}) AS pending_orders_total")
  .select("(#{shipped_orders_subquery.to_sql}) AS shipped_orders_total")
```

Note the redundancy and verbosity of the above code. As a final step, abstract the above pattern into a generalized scope which may be added to ApplicationRecord (the parent class from which all models in a Rails application typically inherit).

```ruby
class ApplicationRecord < ActiveRecord::Base

  scope :subselect,
    lambda { |aggregate_fn, as:, from:, merge: nil|
      query = self.klass
        .select(aggregate_fn)
        .from("#{self.table_name} _#{self.table_name}")
        .joins(from)
        .where("#{self.table_name}.#{self.primary_key} = _#{self.table_name}.#{self.primary_key}")

      query = query.merge(merge) unless merge.nil?

      select("(#{query.to_sql}) AS #{as}")
    }

end
```

By adding the above scope to a Rails application's ApplicationRecord class, there now exists a straightforward means of querying association aggregates based upon already-defined logic:

```ruby
users = User.select('*')
  .subselect('SUM(amount)', as: :pending_orders_total, from: :pending_orders)
  .subselect('SUM(amount)', as: :shipped_orders_total, from: :shipped_orders)

users.first.pending_orders_total
# => 10

users.first.shipped_orders_total
# => 12
```

Note that the merge param may be used to pass additional filtering logic to the association, e.g.:

```ruby
User.select('*').subselect(
  'SUM(amount)',
  as: :usps_orders_total,
  from: :orders,
  merge: Order.where(service: :usps)
)
```