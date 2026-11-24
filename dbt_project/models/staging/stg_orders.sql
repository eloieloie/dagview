with source as (
    select * from {{ ref('raw_orders') }}
)

select
    id as order_id,
    customer_id,
    order_date,
    status,
    amount
from source
