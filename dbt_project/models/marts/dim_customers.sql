with customers as (
    select * from {{ ref('stg_customers') }}
),

orders as (
    select * from {{ ref('stg_orders') }}
    where status = 'completed'
),

customer_orders as (
    select
        customer_id,
        count(*) as completed_order_count,
        sum(amount) as lifetime_value,
        min(order_date) as first_order_date,
        max(order_date) as most_recent_order_date
    from orders
    group by customer_id
)

select
    c.customer_id,
    c.first_name,
    c.last_name,
    c.email,
    c.signup_date,
    coalesce(co.completed_order_count, 0) as completed_order_count,
    coalesce(co.lifetime_value, 0) as lifetime_value,
    co.first_order_date,
    co.most_recent_order_date
from customers c
left join customer_orders co
    on c.customer_id = co.customer_id
