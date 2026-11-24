{{
    config(
        materialized='table'
    )
}}

-- Per-customer rollup built on top of fct_sqlite_orders (model stacked
-- on another model, demonstrating a multi-hop pipeline, not just
-- staging -> mart).

select
    customer_id,
    customer_name,
    region,
    count(*) as order_count,
    sum(order_amount) as lifetime_order_amount,
    sum(items_total_amount) as lifetime_items_amount,
    min(order_date) as first_order_date,
    max(order_date) as last_order_date
from {{ ref('fct_sqlite_orders') }}
group by customer_id, customer_name, region
