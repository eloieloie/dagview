-- Staging model over the attached SQLite source DB2 (db2_orders.sqlite)
select
    order_item_id,
    order_id,
    product_name,
    quantity,
    unit_price,
    quantity * unit_price as line_amount
from db2.main.order_items
