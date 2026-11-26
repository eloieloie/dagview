-- Staging model over the Airbyte-synced "order_items" table.
-- Lineage: db2_orders.sqlite -> CSV export -> Airbyte (File source
-- -> Postgres destination) -> dagview_raw.public.order_items -> here.
select
    order_item_id,
    order_id,
    product_name,
    quantity,
    unit_price,
    quantity * unit_price as line_amount
from airbyte_raw.public.order_items
