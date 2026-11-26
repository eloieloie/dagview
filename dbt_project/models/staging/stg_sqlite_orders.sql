-- Staging model over the Airbyte-synced "orders" table.
-- Lineage: db2_orders.sqlite -> CSV export -> Airbyte (File source
-- -> Postgres destination) -> dagview_raw.public.orders -> here.
select
    order_id,
    customer_id,
    cast(order_date as date) as order_date,
    status,
    amount
from airbyte_raw.public.orders
