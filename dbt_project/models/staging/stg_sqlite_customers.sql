-- Staging model over the Airbyte-synced "customers" table.
-- Lineage: db1_customers.sqlite -> CSV export -> Airbyte (File source
-- -> Postgres destination) -> dagview_raw.public.customers -> here.
select
    customer_id,
    name as customer_name,
    email,
    region,
    cast(signup_date as date) as signup_date
from airbyte_raw.public.customers
