-- Staging model over the attached SQLite source DB1 (db1_customers.sqlite)
select
    customer_id,
    name as customer_name,
    email,
    region,
    cast(signup_date as date) as signup_date
from db1.main.customers
