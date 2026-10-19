---
layout: site
title: Paginating Across Multiple Models in Active Record
date: 2026-10-19 00:00:00 -0500
permalink: /rails-multi-model-pagination/
---
<br/>Pagination in Rails is usually a solved problem: pick a gem like Kaminari, chain `.page(params[:page])` onto a relation, and move on. But pagination gems assume every record on the page comes from a single table. What happens when a page needs to mix records from several models?

Consider a community application where users submit both posts and events. A user's "My Submissions" page should list everything they've submitted, newest first, twenty per page:

```ruby
class Post < ApplicationRecord
  belongs_to :user
end

class Event < ApplicationRecord
  belongs_to :user

  # Recurring events spawn child events; only list the parent.
  scope :top_level, -> { where(parent_id: nil) }
end
```

The naive approach loads both collections into memory, then sorts and slices them in Ruby:

```ruby
records = (user.posts.to_a + user.events.top_level.to_a)
  .sort_by(&:created_at)
  .reverse
  .slice((page - 1) * 20, 20)
```

This works for a handful of records, but every page load fetches a user's entire history. It also gives up everything that makes Active Record relations pleasant to work with. The result is an array, so pagination helpers, `count`, and further chaining no longer apply.

What's needed is a relation whose rows point to records in *either* table. Pagination can then happen in the database. Rails already has a construct for "a pointer to a record in one of several tables": the polymorphic `belongs_to`.

## A table-less model

Start with a model that has no backing table. Each row will have a `record_type` and `record_id`, just like any polymorphic association:

```ruby
class Submission < ApplicationRecord

  # Allow queries without a submissions table.
  def self.columns_hash = {}
  def self.define_attribute_methods = false

  belongs_to :record, polymorphic: true

end

class User < ApplicationRecord
  has_many :posts
  has_many :events
  has_many :submissions
end
```

Overriding `columns_hash` and `define_attribute_methods` stops Active Record from querying the database schema for a table that doesn't exist. Attributes are instead read from whatever columns the query happens to select.

Note the `has_many :submissions` association. Calling `user.submissions` builds a relation with the condition `WHERE submissions.user_id = 1`. Running that query as-is would fail, but the condition can still be useful. Posts and events both have a `user_id` column, so it applies equally well to either table, provided that table is aliased as `submissions`.

## Building the union

That aliasing trick is the core of the approach. Take any `Post` or `Event` scope, self-join its table under the alias `submissions`, and merge in the `Submission` relation. The where conditions written against `submissions` now filter posts (or events). Repeat for each model, `UNION ALL` the results together, and wrap the whole thing as a subquery the `Submission` relation selects from.

In SQL, the goal is something like:

```sql
SELECT submissions.* FROM (
  SELECT 'Post' AS record_type, posts.id AS record_id, submissions.created_at
  FROM posts
  JOIN posts AS submissions ON submissions.id = posts.id
  WHERE submissions.user_id = 1

  UNION ALL

  SELECT 'Event' AS record_type, events.id AS record_id, submissions.created_at
  FROM events
  JOIN events AS submissions ON submissions.id = events.id
  WHERE events.parent_id IS NULL AND submissions.user_id = 1
) AS submissions
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

Generalized as a scope:

```ruby
class Submission < ApplicationRecord

  # ...

  # Combines the given scopes into a single relation of polymorphic
  # record pointers. Where and order conditions on the current relation
  # are applied to each scope; they must reference columns common to
  # every table.
  scope :union_of,
    lambda { |*scopes|
      order_values = self.order_values
      order_columns = order_values.map(&:expr)

      queries = scopes.map { |scope|
        table = scope.quoted_table_name

        scope
          .merge(self.unscope(:order))
          .joins("JOIN #{table} AS submissions ON submissions.id = #{table}.id")
          .select("'#{scope.klass.name}' AS record_type", "#{table}.id AS record_id")
          .select(*order_columns.map { |column| "submissions.#{column}" })
          .to_sql
      }

      unscoped
        .from("(#{queries.join(' UNION ALL ')}) AS submissions")
        .order(order_values)
    }

end
```

A few details are worth calling out:

- **Ordering.** Each subquery selects whichever columns the outer relation orders by, so the outer `ORDER BY` has something to sort on. Ordering is stripped from the inner queries, where it would be meaningless.
- **Model-specific scopes still work.** `Event.top_level` contributes its own `WHERE events.parent_id IS NULL` alongside the shared conditions, so each model keeps its own filtering logic.
- **`UNION ALL`, not `UNION`.** The `record_type` column guarantees rows from different models can never be duplicates. A plain `UNION` would make the database deduplicate for nothing.

## Usage

Shared conditions and ordering go on the `Submission` relation; model-specific logic goes in the scopes passed to `union_of`. The result is an ordinary relation, so pagination, eager loading, and counting all work as usual:

```ruby
submissions = user.submissions
  .where(hidden: false)
  .order(created_at: :desc)
  .union_of(Post.all, Event.top_level)
  .includes(:record)
  .page(params[:page])

submissions.map { |submission| submission.record }
# => [#<Event id: 3 ...>, #<Post id: 3 ...>, ...]

submissions.total_count
# => 4
```

Only one page of pointers comes back from the database. `includes(:record)` then issues one query per model to load the actual posts and events, no matter how many records the page holds.

## Limitations

- Conditions and order columns on the `Submission` relation must exist on every table in the union. Model-specific conditions belong in the scopes passed to `union_of`.
- Because `Submission` has no schema, Active Record can't type-cast its attributes. The pointers are fine; anything beyond that should be read from `submission.record`.
- On large tables, each branch of the union needs a suitable index (e.g. on `user_id, created_at`). Otherwise, the database must collect and sort every matching row before it can apply `LIMIT`. The same is true of any `OFFSET` pagination, but here the cost is paid once per model.
