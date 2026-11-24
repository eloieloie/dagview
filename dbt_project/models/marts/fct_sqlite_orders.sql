{{
    config(
        materialized='table'
    )
}}

-- Fact table built from the two attached SQLite source DBs
-- (db1_customers.sqlite, db2_orders.sqlite): one row per order,
-- enriched with customer attributes and item-level rollups.
-- Materialized into dagview's main duckdb warehouse so it shows up
-- in the normal Models / Lineage / Tables / SQL-preview views.

with items_agg as (
    select
        order_id,
        count(*) as item_count,
        sum(quantity) as total_quantity,
        sum(line_amount) as items_total_amount
    from {{ ref('stg_sqlite_order_items') }}
    group by order_id
)

select
    o.order_id,
    o.customer_id,
    c.customer_name,
    c.region,
    o.order_date,
    o.status,
    o.amount as order_amount,
    coalesce(i.item_count, 0) as item_count,
    coalesce(i.total_quantity, 0) as total_quantity,
    coalesce(i.items_total_amount, 0.0) as items_total_amount
from {{ ref('stg_sqlite_orders') }} o
left join {{ ref('stg_sqlite_customers') }} c
    on o.customer_id = c.customer_id
left join items_agg i
    on o.order_id = i.order_id
