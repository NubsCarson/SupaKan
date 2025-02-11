-- Create a view that joins messages with user information
create or replace view messages_with_users as
select 
    m.*,
    auth.email as user_email,
    auth.created_at as user_created_at,
    auth.updated_at as user_updated_at
from messages m
left join auth.users auth on m.user_id = auth.id
order by m.created_at asc; 