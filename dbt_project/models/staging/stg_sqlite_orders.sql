-- Staging model over the attached SQLite source DB2 (db2_orders.sqlite)
select
    order_id,
    customer_id,
    cast(order_date as date) as order_date,
    status,
    amount
from db2.main.orders
