with orders as (
    select * from {{ ref('fct_orders') }}
    where status = 'completed'
)

select
    date_trunc('month', order_date) as month,
    count(*) as order_count,
    sum(amount) as total_revenue,
    avg(amount) as avg_order_value
from orders
group by 1
order by 1
