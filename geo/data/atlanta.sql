set @c := 0;

select
  @c := @c + 1 as id,
  l.latitude,
  l.longitude
from core_user u, core_location l
where
  u.id = l.user_id and
  u.subscription_status = 'subscribed' and
  u.state = 'ga' and u.city = 'atlanta'
;
