{% macro generate_schema_name(custom_schema_name, node) -%}
    {#- Default dbt behavior for the duckdb/sqlite-attached warehouse. The
        two sqlite_* models below override schema='main' directly in their
        config() so writes into the attached sqlite catalogs stay valid
        (SQLite requires schema == 'main'); everything else keeps dbt's
        normal "<target_schema>_<custom_schema>" naming. -#}
    {%- if custom_schema_name is none -%}
        {{ target.schema }}
    {%- elif custom_schema_name == 'main' -%}
        main
    {%- else -%}
        {{ target.schema }}_{{ custom_schema_name | trim }}
    {%- endif -%}
{%- endmacro %}
