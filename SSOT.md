

# Rawi App System Specification (Global Doc, Consolidated — Full)

This document is the **single reference** for schemas, constraints, contracts, and triggers across the AI Scenes system. Each section has four parts:

1. Purpose
2. Simplified prose
3. Top-level contract
4. SQL definition

---
# Section 0: Core Enums & Helpers (Locked)

### Purpose

Canonical enums and tiny helpers shared across validators and tables. Idempotent, safe to re-run.

### Simplified Prose

* Enums:

  * `field_datatype`: `string|number|boolean|array|object|uuid|url|date|datetime`
  * `field_widget`: `text|textarea|select|radio|checkbox|tags|group|date|datetime|url|color|file`
  * `options_source`: `static|endpoint|table`
  * `http_method`: `GET|POST|PUT|PATCH|DELETE`
  * `order_dir`: `asc|desc`
  * `table_where_op`: `eq|neq|gt|gte|lt|lte|like|ilike|in`
  * `string_format`: `none|email|phone|color|slug|uri|url`
  * `array_item_type`: `string|number|boolean|uuid|url|date|datetime|object`
  * `importance_level`: `low|normal|high`
  * `group_layout`: `section|accordion|tab|inline`
* Helpers:

  * `in_enum(val text, etype anyenum)` → boolean (generic membership)
  * Overloads so checks can pass enums directly to existing validators:

    * `is_valid_rules(p jsonb, p_datatype field_datatype)`
    * `is_valid_field_rules_strict(p jsonb, p_datatype field_datatype)`
    * `is_valid_field_default_strict(p_default jsonb, p_datatype field_datatype, p_widget text, p_options jsonb)`
    * `is_valid_field_default_strict(p_default jsonb, p_datatype field_datatype, p_widget field_widget, p_options jsonb)`

### SQL Definition

```sql
-- =========================
-- Enums (idempotent guards)
-- =========================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='field_datatype' and n.nspname='public')
  then create type public.field_datatype as enum
    ('string','number','boolean','array','object','uuid','url','date','datetime'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='field_widget' and n.nspname='public')
  then create type public.field_widget as enum
    ('text','textarea','select','radio','checkbox','tags','group','date','datetime','url','color','file'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='options_source' and n.nspname='public')
  then create type public.options_source as enum
    ('static','endpoint','table'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='http_method' and n.nspname='public')
  then create type public.http_method as enum
    ('GET','POST','PUT','PATCH','DELETE'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='order_dir' and n.nspname='public')
  then create type public.order_dir as enum
    ('asc','desc'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='table_where_op' and n.nspname='public')
  then create type public.table_where_op as enum
    ('eq','neq','gt','gte','lt','lte','like','ilike','in'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='string_format' and n.nspname='public')
  then create type public.string_format as enum
    ('none','email','phone','color','slug','uri','url'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='array_item_type' and n.nspname='public')
  then create type public.array_item_type as enum
    ('string','number','boolean','uuid','url','date','datetime','object'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='importance_level' and n.nspname='public')
  then create type public.importance_level as enum
    ('low','normal','high'); end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='group_layout' and n.nspname='public')
  then create type public.group_layout as enum
    ('section','accordion','tab','inline'); end if;
end $$;

-- (Optional) Ensure members exist if enums predate these values
do $$
declare
  v text;
begin
  -- string_format
  foreach v in array array['none','email','phone','color','slug','uri','url'] loop
    begin execute format('alter type public.string_format add value %L', v);
    exception when duplicate_object then null; end;
  end loop;

  -- array_item_type
  foreach v in array array['string','number','boolean','uuid','url','date','datetime','object'] loop
    begin execute format('alter type public.array_item_type add value %L', v);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- =========================
-- Helpers & overloads
-- =========================

-- Generic enum membership test
create or replace function public.in_enum(val text, etype anyenum)
returns boolean
language sql
immutable
as $$
  select case when val is null then false
              else val = any (enum_range(etype)::text[]) end;
$$;

-- Overloads so table CHECKs can pass enums directly to existing validators

-- rules(jsonb, field_datatype)
create or replace function public.is_valid_rules(p jsonb, p_datatype public.field_datatype)
returns boolean
language sql
immutable
as $$
  select public.is_valid_rules(p, p_datatype::text);
$$;

-- field_rules_strict(jsonb, field_datatype)
create or replace function public.is_valid_field_rules_strict(p jsonb, p_datatype public.field_datatype)
returns boolean
language sql
immutable
as $$
  select public.is_valid_rules(p, p_datatype::text);
$$;

-- default_strict(jsonb, field_datatype, TEXT widget, options)
create or replace function public.is_valid_field_default_strict(
  p_default jsonb, p_datatype public.field_datatype, p_widget text, p_options jsonb)
returns boolean
language sql
immutable
as $$
  select public.is_valid_field_default_strict(p_default, p_datatype::text, p_widget, p_options);
$$;

-- default_strict(jsonb, field_datatype, field_widget widget, options)
create or replace function public.is_valid_field_default_strict(
  p_default jsonb, p_datatype public.field_datatype, p_widget public.field_widget, p_options jsonb)
returns boolean
language sql
immutable
as $$
  select public.is_valid_field_default_strict(p_default, p_datatype::text, p_widget::text, p_options);
$$;
```

---

## Section 1: Field Registry

### Purpose

- Central registry for reusable fields.
- Enforces strict typing, defaulting, and selection options.

### Simplified Prose

- **id**: UUID PK.
- **field_id**: unique string identifier.
- **datatype**: enum `field_datatype` = `string|number|boolean|array|object|uuid|url|date|datetime`.
- **widget**: enum `field_widget` = `text|textarea|select|radio|checkbox|tags|group|date|datetime|url|color|file`.
- **options**: JSON describing choices (see 1.A).
- **rules**: datatype-aware constraints (see 1.B).
- **ui**: `{label?, placeholder?, help?}` i18n-ready.
- **default_value**: must match `datatype` and (when relevant) be allowed by `options`.
- **version**: integer ≥ 1.
- **timestamps**: `created_at`, `updated_at`.

### Top-Level Contract

```json
{
  "field_id": "string",
  "datatype": "string|number|boolean|array|object|uuid|url|date|datetime",
  "widget": "text|textarea|select|radio|checkbox|tags|group|date|datetime|url|color|file",
  "options": {},
  "rules": {},
  "ui": { "label": "...", "placeholder": "...", "help": "..." },
  "default_value": "valid instance",
  "version": 1
}

```

### SQL Definition

```sql
-- Core enums (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='field_datatype' and n.nspname='public'
  ) then
    create type public.field_datatype as enum
      ('string','number','boolean','array','object','uuid','url','date','datetime');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='field_widget' and n.nspname='public'
  ) then
    create type public.field_widget as enum
      ('text','textarea','select','radio','checkbox','tags','group','date','datetime','url','color','file');
  end if;
end $$;

-- Wrapper overloads so CHECKs work with enums or text
create or replace function public.is_valid_rules(p jsonb, p_datatype public.field_datatype)
returns boolean language sql immutable as $$
  select public.is_valid_rules(p, p_datatype::text);
$$;

create or replace function public.is_valid_field_rules_strict(p jsonb, p_datatype public.field_datatype)
returns boolean language sql immutable as $$
  select public.is_valid_rules(p, p_datatype::text);
$$;

create or replace function public.is_valid_field_default_strict(
  p_default  jsonb,
  p_datatype public.field_datatype,
  p_widget   text,
  p_options  jsonb
) returns boolean language sql immutable as $$
  select public.is_valid_field_default_strict(p_default, p_datatype::text, p_widget, p_options);
$$;

create or replace function public.is_valid_field_default_strict(
  p_default  jsonb,
  p_datatype public.field_datatype,
  p_widget   public.field_widget,
  p_options  jsonb
) returns boolean language sql immutable as $$
  select public.is_valid_field_default_strict(p_default, p_datatype::text, p_widget::text, p_options);
$$;

-- Convenience aliases used by table CHECKs (pass-through to validators)
create or replace function public.is_valid_field_ui_strict(p jsonb)
returns boolean language sql immutable as $$
  select public.is_valid_ui(p);
$$;

create or replace function public.is_valid_field_options_strict(p jsonb)
returns boolean language sql immutable as $$
  select public.is_valid_field_options(p);
$$;

-- Note: table DDL + CHECKs/triggers are defined in migrations.
```

---

## Section 1.A: Field Options Schema (Detailed)

### Purpose
- Standardize `options` JSON used by widgets (selects, lookups, etc.).
- Support three sources: **static**, **endpoint**, **table**.
- Keep closed sets strict via Postgres enums while preserving JSON flexibility.

### Simplified Prose
- `source`: one of `static | endpoint | table`.
- **static**:
  - `values`: array of normalized items.
  - Each item: `{ value: string, label: { fallback: string, key?: string }, extras?: object, disabled?: boolean }`.
  - Optional `dependsOn`: array of `{ field: string, allow: string[] }`.
- **endpoint**:
  - `url` (string, required), `method?` (GET|POST|PUT|PATCH|DELETE), `query?` (object).
  - Mapping keys: `valueKey?`, `labelKey?`, `extraKeys?` (string[]), `cacheTtlSec?` (number > 0).
- **table**:
  - `table` (string), `valueColumn` (string), `labelColumn` (string) required.
  - `extraColumns?` (string[]).
  - `where?`: array of `{ column: string, op: (eq|neq|gt|gte|lt|lte|like|ilike|in), value: any }`.
  - `orderBy?`: array of `{ column: string, dir: asc|desc }`.
  - `limit?` (number > 0).

### Top-Level Contract
```json
{
  "options": {
    "source": "static | endpoint | table",

    "values": [
      {
        "value": "string",
        "label": { "fallback": "string", "key": "string?" },
        "extras": {},
        "disabled": false
      }
    ],
    "dependsOn": [
      { "field": "string", "allow": ["string"] }
    ],

    "url": "string",
    "method": "GET|POST|PUT|PATCH|DELETE",
    "query": {},
    "valueKey": "string",
    "labelKey": "string",
    "extraKeys": ["string"],
    "cacheTtlSec": 300,

    "table": "string",
    "valueColumn": "string",
    "labelColumn": "string",
    "extraColumns": ["string"],
    "where": [
      { "column": "string", "op": "eq|neq|gt|gte|lt|lte|like|ilike|in", "value": {} }
    ],
    "orderBy": [
      { "column": "string", "dir": "asc|desc" }
    ],
    "limit": 25
  }
}
```

### SQL Definition
```sql
-- Enums for options JSON (idempotent guards)
do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='options_source' and n.nspname='public'
  ) then create type public.options_source as enum ('static','endpoint','table'); end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='http_method' and n.nspname='public'
  ) then create type public.http_method as enum ('GET','POST','PUT','PATCH','DELETE'); end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='order_dir' and n.nspname='public'
  ) then create type public.order_dir as enum ('asc','desc'); end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='table_where_op' and n.nspname='public'
  ) then create type public.table_where_op as enum ('eq','neq','gt','gte','lt','lte','like','ilike','in'); end if;
end $$;

-- Shared helper (safe to define multiple times)
create or replace function public.in_enum(val text, etype anyenum)
returns boolean language sql immutable as $$
  select case when val is null then false else val = any (enum_range(etype)::text[]) end;
$$;

-- OPTIONS validator
create or replace function public.is_valid_field_options(p jsonb)
returns boolean language sql immutable as $$
  select
    p is null
    or (
      jsonb_typeof(p) = 'object'
      and (p ? 'source') and jsonb_typeof(p->'source') = 'string'
      and public.in_enum(p->>'source', null::public.options_source)
      and (
        -- STATIC
        (p->>'source' = 'static'
          and (p ? 'values') and jsonb_typeof(p->'values') = 'array'
          and not exists (
            select 1
            from jsonb_array_elements(p->'values') v
            where not (
              jsonb_typeof(v) = 'object'
              and (v ? 'value') and jsonb_typeof(v->'value') = 'string'
              and (v ? 'label') and jsonb_typeof(v->'label') = 'object'
              and ((v->'label') ? 'fallback') and jsonb_typeof((v->'label')->'fallback') = 'string'
              and (not ((v->'label') ? 'key') or jsonb_typeof((v->'label')->'key') = 'string')
              and (not (v ? 'extras') or jsonb_typeof(v->'extras') = 'object')
              and (not (v ? 'disabled') or jsonb_typeof(v->'disabled') = 'boolean')
            )
          )
          and (
            not (p ? 'dependsOn') or (
              jsonb_typeof(p->'dependsOn') = 'array'
              and not exists (
                select 1
                from jsonb_array_elements(p->'dependsOn') d
                where not (
                  jsonb_typeof(d) = 'object'
                  and (d ? 'field') and jsonb_typeof(d->'field') = 'string'
                  and (d ? 'allow') and jsonb_typeof(d->'allow') = 'array'
                  and not exists (
                    select 1 from jsonb_array_elements_text(d->'allow') a
                    where a is null or a = ''
                  )
                )
              )
            )
          )
        )
        or
        -- ENDPOINT
        (p->>'source' = 'endpoint'
          and (p ? 'url') and jsonb_typeof(p->'url') = 'string'
          and (
            not (p ? 'method')
            or (jsonb_typeof(p->'method') = 'string'
                and public.in_enum(p->>'method', null::public.http_method))
          )
          and (not (p ? 'query')    or jsonb_typeof(p->'query')    = 'object')
          and (not (p ? 'valueKey') or jsonb_typeof(p->'valueKey') = 'string')
          and (not (p ? 'labelKey') or jsonb_typeof(p->'labelKey') = 'string')
          and (
            not (p ? 'extraKeys') or (
              jsonb_typeof(p->'extraKeys') = 'array'
              and not exists (
                select 1 from jsonb_array_elements(p->'extraKeys') ek
                where jsonb_typeof(ek) <> 'string'
              )
            )
          )
          and (not (p ? 'cacheTtlSec') or jsonb_typeof(p->'cacheTtlSec') = 'number')
        )
        or
        -- TABLE
        (p->>'source' = 'table'
          and (p ? 'table')       and jsonb_typeof(p->'table')       = 'string'
          and (p ? 'valueColumn') and jsonb_typeof(p->'valueColumn') = 'string'
          and (p ? 'labelColumn') and jsonb_typeof(p->'labelColumn') = 'string'
          and (
            not (p ? 'extraColumns') or (
              jsonb_typeof(p->'extraColumns') = 'array'
              and not exists (
                select 1 from jsonb_array_elements(p->'extraColumns') ec
                where jsonb_typeof(ec) <> 'string'
              )
            )
          )
          and (
            not (p ? 'where') or (
              jsonb_typeof(p->'where') = 'array'
              and not exists (
                select 1
                from jsonb_array_elements(p->'where') w
                where not (
                  jsonb_typeof(w) = 'object'
                  and (w ? 'column') and jsonb_typeof(w->'column') = 'string'
                  and (w ? 'op')     and jsonb_typeof(w->'op')     = 'string'
                  and public.in_enum(w->>'op', null::public.table_where_op)
                  and (w ? 'value')
                )
              )
            )
          )
          and (
            not (p ? 'orderBy') or (
              jsonb_typeof(p->'orderBy') = 'array'
              and not exists (
                select 1
                from jsonb_array_elements(p->'orderBy') ob
                where not (
                  jsonb_typeof(ob) = 'object'
                  and (ob ? 'column') and jsonb_typeof(ob->'column') = 'string'
                  and (ob ? 'dir')    and jsonb_typeof(ob->'dir')    = 'string'
                  and public.in_enum(ob->>'dir', null::public.order_dir)
                )
              )
            )
          )
          and (not (p ? 'limit') or (jsonb_typeof(p->'limit') = 'number' and (p->>'limit')::numeric > 0))
        )
      )
    );
$$;
```

---

## Section 1.B: Field Rules Schema (Detailed)

### Purpose
- Standardize `rules` JSON per `datatype` for validation and UI hints.
- Use enums for closed sets (e.g., `format`, `itemType`) while keeping JSON flexible.
- Enforced centrally via a Postgres function + CHECK.

### Simplified Prose
- `rules` is a JSON object; allowed keys depend on `datatype`:
  - **string | uuid | url | date | datetime**:
    - Keys: `minLength?` (number ≥ 0), `maxLength?` (number ≥ 0), `pattern?` (string regex), `format?` (enum).
    - `format` ∈ `string_format`: `none|email|phone|color|slug|uri|url`.
  - **number**:
    - Keys: `minimum?` (number), `maximum?` (number).
  - **boolean**:
    - Must be `{}` (no keys).
  - **array**:
    - Keys: `minItems?` (number ≥ 0), `maxItems?` (number ≥ 0), `uniqueItems?` (boolean), `itemType?` (enum).
    - `itemType` ∈ `array_item_type`: `string|number|boolean|uuid|url|date|datetime|object`.
  - **object**:
    - Any object allowed (pass-through).
- Ranges: when both min/max exist, min ≤ max.

### Top-Level Contract
```json
{
  "rules": {
    "minLength": 0,
    "maxLength": 120,
    "pattern": "^[A-Za-z].*$",
    "format": "none|email|phone|color|slug|uri|url",
    "minimum": 0,
    "maximum": 100,
    "minItems": 1,
    "maxItems": 3,
    "uniqueItems": true,
    "itemType": "string|number|boolean|uuid|url|date|datetime|object"
  }
}
```

### SQL Definition
```sql
-- Enums for rules JSON (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='string_format' and n.nspname='public'
  ) then
    create type public.string_format as enum ('none','email','phone','color','slug','uri','url');
  end if;
end $$;

do $$ declare v text;
begin
  foreach v in array array['none','email','phone','color','slug','uri','url'] loop
    begin execute format('alter type public.string_format add value %L', v);
    exception when duplicate_object then null; end;
  end loop;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='array_item_type' and n.nspname='public'
  ) then
    create type public.array_item_type as enum ('string','number','boolean','uuid','url','date','datetime','object');
  end if;
end $$;

do $$ declare v text;
begin
  foreach v in array array['string','number','boolean','uuid','url','date','datetime','object'] loop
    begin execute format('alter type public.array_item_type add value %L', v);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- Shared helper (safe if already created)
create or replace function public.in_enum(val text, etype anyenum)
returns boolean language sql immutable as $$
  select case when val is null then false else val = any (enum_range(etype)::text[]) end;
$$;

-- RULES validator
create or replace function public.is_valid_rules(p jsonb, p_datatype text)
returns boolean language sql immutable
as $$
  with base as (select coalesce(p, '{}'::jsonb) as j),
  is_obj as (select jsonb_typeof(j) = 'object' as ok from base),
  t as (
    select
      (p_datatype::text in ('string','uuid','url','date','datetime')) as is_str,
      (p_datatype::text = 'number')  as is_num,
      (p_datatype::text = 'boolean') as is_bool,
      (p_datatype::text = 'array')   as is_arr,
      (p_datatype::text = 'object')  as is_objtype
  ),
  keys_ok as (
    select not exists (
      select 1 from base b, jsonb_object_keys(b.j) k, t
      where case
        when t.is_str     then k not in ('minLength','maxLength','pattern','format')
        when t.is_num     then k not in ('minimum','maximum')
        when t.is_bool    then true
        when t.is_arr     then k not in ('minItems','maxItems','uniqueItems','itemType')
        when t.is_objtype then false
        else false
      end
    ) as ok
  ),
  types_ok as (
    select (
      select case
        when t.is_str then
          (not (b.j ? 'minLength') or jsonb_typeof(b.j->'minLength') = 'number')
          and (not (b.j ? 'maxLength') or jsonb_typeof(b.j->'maxLength') = 'number')
          and (not (b.j ? 'pattern')   or jsonb_typeof(b.j->'pattern')   = 'string')
          and (
            not (b.j ? 'format')
            or (
              jsonb_typeof(b.j->'format') = 'string'
              and public.in_enum(b.j->>'format', null::public.string_format)
            )
          )
        when t.is_num then
          (not (b.j ? 'minimum') or jsonb_typeof(b.j->'minimum') = 'number')
          and (not (b.j ? 'maximum') or jsonb_typeof(b.j->'maximum') = 'number')
        when t.is_bool then
          jsonb_typeof(b.j) = 'object'
          and (select count(*) from jsonb_object_keys(b.j)) = 0
        when t.is_arr then
          (not (b.j ? 'minItems') or jsonb_typeof(b.j->'minItems') = 'number')
          and (not (b.j ? 'maxItems') or jsonb_typeof(b.j->'maxItems') = 'number')
          and (not (b.j ? 'uniqueItems') or jsonb_typeof(b.j->'uniqueItems') = 'boolean')
          and (
            not (b.j ? 'itemType')
            or (
              jsonb_typeof(b.j->'itemType') = 'string'
              and public.in_enum(b.j->>'itemType', null::public.array_item_type)
            )
          )
        when t.is_objtype then jsonb_typeof(b.j) = 'object'
        else jsonb_typeof(b.j) = 'object'
      end
      from base b, t
    ) as ok
  ),
  ranges_ok as (
    select (
      select case
        when t.is_str then
          (not (b.j ? 'minLength') or not (b.j ? 'maxLength')
           or ((b.j->>'minLength')::numeric <= (b.j->>'maxLength')::numeric))
        when t.is_num then
          (not (b.j ? 'minimum') or not (b.j ? 'maximum')
           or ((b.j->>'minimum')::numeric <= (b.j->>'maximum')::numeric))
        when t.is_arr then
          (not (b.j ? 'minItems') or not (b.j ? 'maxItems')
           or ((b.j->>'minItems')::numeric <= (b.j->>'maxItems')::numeric))
        else true
      end
      from base b, t
    ) as ok
  ),
  nonneg_ok as (
    select (
      select case
        when t.is_str then
          (not (b.j ? 'minLength') or (b.j->>'minLength')::numeric >= 0)
          and (not (b.j ? 'maxLength') or (b.j->>'maxLength')::numeric >= 0)
        when t.is_arr then
          (not (b.j ? 'minItems') or (b.j->>'minItems')::numeric >= 0)
          and (not (b.j ? 'maxItems') or (b.j->>'maxItems')::numeric >= 0)
        else true
      end
      from base b, t
    ) as ok
  )
  select (select ok from is_obj)
      and (select ok from keys_ok)
      and (select ok from types_ok)
      and (select ok from ranges_ok)
      and (select ok from nonneg_ok);
$$;
```

---

## Section 1.C: Field UI Schema (Detailed)

### Purpose
- I18n-ready labels with optional translation keys.
- Enforce a minimal, consistent shape for display strings.

### Simplified Prose
- `ui` is an object with optional keys: `label`, `placeholder`, `help`.
- Each of those, if present, must be an object:
  - Required: `fallback` → non-empty string.
  - Optional: `key` → slug-safe string matching `^[a-z0-9_.:-]+$`.
  - No extra keys allowed inside (`fallback`, `key` only).
- No other top-level keys allowed in `ui`.

### Top-Level Contract
```json
{
  "ui": {
    "label":        { "fallback": "Character Name", "key": "fields.character_name.label" },
    "placeholder":  { "fallback": "Enter a name…" },
    "help":         { "fallback": "Shown in trailer credits.", "key": "fields.character_name.help" }
  }
}
```

### SQL Definition
```sql
create or replace function public.is_valid_ui(p jsonb)
returns boolean
language sql immutable
as $$
  select
    -- must be an object (NULL treated as {})
    jsonb_typeof(coalesce(p, '{}'::jsonb)) = 'object'

    -- top-level whitelist
    and not exists (
      select 1
      from jsonb_object_keys(coalesce(p, '{}'::jsonb)) k
      where k not in ('label','placeholder','help')
    )

    -- label
    and (
      not (p ? 'label') or (
        jsonb_typeof(p->'label') = 'object'
        and ((p->'label') ? 'fallback')
        and jsonb_typeof((p->'label')->'fallback') = 'string'
        and ((p->'label')->>'fallback') !~ '^\s*$'
        and (
          not ((p->'label') ? 'key')
          or (
            jsonb_typeof((p->'label')->'key') = 'string'
            and ((p->'label')->>'key') ~ '^[a-z0-9_.:-]+$'
          )
        )
        and not exists (
          select 1 from jsonb_object_keys(p->'label') kk
          where kk not in ('fallback','key')
        )
      )
    )

    -- placeholder
    and (
      not (p ? 'placeholder') or (
        jsonb_typeof(p->'placeholder') = 'object'
        and ((p->'placeholder') ? 'fallback')
        and jsonb_typeof((p->'placeholder')->'fallback') = 'string'
        and ((p->'placeholder')->>'fallback') !~ '^\s*$'
        and (
          not ((p->'placeholder') ? 'key')
          or (
            jsonb_typeof((p->'placeholder')->'key') = 'string'
            and ((p->'placeholder')->>'key') ~ '^[a-z0-9_.:-]+$'
          )
        )
        and not exists (
          select 1 from jsonb_object_keys(p->'placeholder') kk
          where kk not in ('fallback','key')
        )
      )
    )

    -- help
    and (
      not (p ? 'help') or (
        jsonb_typeof(p->'help') = 'object'
        and ((p->'help') ? 'fallback')
        and jsonb_typeof((p->'help')->'fallback') = 'string'
        and ((p->'help')->>'fallback') !~ '^\s*$'
        and (
          not ((p->'help') ? 'key')
          or (
            jsonb_typeof((p->'help')->'key') = 'string'
            and ((p->'help')->>'key') ~ '^[a-z0-9_.:-]+$'
          )
        )
        and not exists (
          select 1 from jsonb_object_keys(p->'help') kk
          where kk not in ('fallback','key')
        )
      )
    );
$$;
```

---

# Section 2: Form Schema — FieldGroup & FieldItem (Locked)

### Purpose

Normalized, strictly-validated form model kept as:

* `FormContent = { groups: FieldGroup[], items: FieldItem[] }`
* Groups define **hierarchy & layout**; Items bind to **Field Registry** and hold values.

### Simplified Prose

* **FieldGroup** (tree node)

  * `name` (slug; ltree-safe; **unique among siblings**)
  * `parent` (slug|null); `children: string[]` (must reference existing groups whose `parent` = this `name`)
  * `label` (i18n `{fallback, key?}`); `description?` (i18n)
  * Flags: `hidden?`, `advanced?`, `collapsed?`
  * `importance?: importance_level` (`low|normal|high`)
  * `layout?: group_layout` (`section|accordion|tab|inline`)
  * `required?` (if true → at least one **FieldItem** exists under this group **or any descendant**)
  * `repeatable?: { min?, max?, labelSingular?, labelPlural? }` (min/max instance bounds)
  * **Order**: index in parent’s `children[]`
* **FieldItem** (leaf bound to registry)

  * `ref` → `field_registry.field_id` (FK by contract)
  * `parent: { group_name, group_instance_id? }` (instance id **required** iff parent group is repeatable)
  * `value?` (must satisfy registry datatype/widget/options on save)
  * Flags: `editable?` (def true), `removable?` (def true), `required?` (def false)
  * Overrides: `hierarchy?: { hidden?, advanced?, importance? }` (overrides group flags)
  * `ui_override?: { label?, placeholder?, help? }` (same shape as registry UI)
  * Per-field repeat: `repeatable?: { min?, max?, labelSingular?, labelPlural? }`; requires `item_instance_id?` if present
  * **Uniqueness**

    * Non-repeatable: max **1** item per `(group_name, group_instance_id?, ref)`
    * Repeatable: `(group_name, group_instance_id?, ref, item_instance_id)` must be unique

### Top-Level Contracts

```json
{
  "FieldGroup": {
    "name": "string",
    "parent": "string|null",
    "children": ["string"],
    "label": { "fallback": "string", "key": "string?" },
    "description": { "fallback": "string", "key": "string?" },
    "hidden": false,
    "advanced": false,
    "collapsed": false,
    "importance": "low|normal|high",
    "required": false,
    "repeatable": { "min": 0, "max": 5, "labelSingular": "Item", "labelPlural": "Items" },
    "layout": "section|accordion|tab|inline"
  },
  "FieldItem": {
    "ref": "field_registry.field_id",
    "parent": { "group_name": "string", "group_instance_id": "string?" },
    "value": {},
    "editable": true,
    "removable": true,
    "required": false,
    "hierarchy": { "hidden": false, "advanced": false, "importance": "normal" },
    "ui_override": {
      "label": { "fallback": "..." },
      "placeholder": { "fallback": "..." },
      "help": { "fallback": "..." }
    },
    "repeatable": { "min": 0, "max": 3, "labelSingular": "Entry", "labelPlural": "Entries" },
    "item_instance_id": "string?"
  },
  "FormContent": {
    "groups": ["FieldGroup"],
    "items": ["FieldItem"]
  }
}
```

### SQL Definition

```sql
-- =========================
-- Single group validator
-- =========================
create or replace function public.is_valid_field_group(g jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(g) = 'object'
    and (g ? 'name') and jsonb_typeof(g->'name')='string' and (g->>'name') ~ '^[a-z0-9_]+$'
    and (not (g ? 'parent') or jsonb_typeof(g->'parent')='string')
    and (not (g ? 'children') or (
      jsonb_typeof(g->'children')='array'
      and not exists (select 1 from jsonb_array_elements(g->'children') c where jsonb_typeof(c) <> 'string')
    ))
    and (g ? 'label') and jsonb_typeof(g->'label')='object'
    and ((g->'label') ? 'fallback') and jsonb_typeof((g->'label')->'fallback')='string'
    and (not ((g->'label') ? 'key') or jsonb_typeof((g->'label')->'key')='string')
    and (not (g ? 'description') or (
      jsonb_typeof(g->'description')='object'
      and ((g->'description') ? 'fallback') and jsonb_typeof((g->'description')->'fallback')='string'
      and (not ((g->'description') ? 'key') or jsonb_typeof((g->'description')->'key')='string')
    ))
    and (not (g ? 'hidden')    or jsonb_typeof(g->'hidden')='boolean')
    and (not (g ? 'advanced')  or jsonb_typeof(g->'advanced')='boolean')
    and (not (g ? 'collapsed') or jsonb_typeof(g->'collapsed')='boolean')
    and (not (g ? 'importance') or (
      jsonb_typeof(g->'importance')='string'
      and public.in_enum(g->>'importance', null::public.importance_level)
    ))
    and (not (g ? 'required') or jsonb_typeof(g->'required')='boolean')
    and (not (g ? 'repeatable') or (
      jsonb_typeof(g->'repeatable')='object'
      and (not (g->'repeatable' ? 'min') or jsonb_typeof(g->'repeatable'->'min')='number')
      and (not (g->'repeatable' ? 'max') or jsonb_typeof(g->'repeatable'->'max')='number')
      and (not (g->'repeatable' ? 'labelSingular') or jsonb_typeof(g->'repeatable'->'labelSingular')='string')
      and (not (g->'repeatable' ? 'labelPlural')   or jsonb_typeof(g->'repeatable'->'labelPlural')='string')
    ))
    and (not (g ? 'layout') or (
      jsonb_typeof(g->'layout')='string'
      and public.in_enum(g->>'layout', null::public.group_layout)
    ));
$$;

-- =========================
-- Groups array/tree validator
-- - sibling-unique names
-- - children exist & point back to parent
-- - DAG, depth <= 6
-- =========================
create or replace function public.is_valid_field_groups(arr jsonb)
returns boolean
language sql
stable
as $$
  with a as (select coalesce(arr,'[]'::jsonb) j),
  is_arr as (select jsonb_typeof(j)='array' ok from a),
  elems as (select jsonb_array_elements((select j from a)) g),
  all_ok as (select not exists (select 1 from elems where not public.is_valid_field_group(g)) ok),

  gt as (
    select
      g->>'name' name,
      case when (g ? 'parent') then g->>'parent' else null end as parent,
      case when (g ? 'children') then (g->'children') else '[]'::jsonb end as children
    from elems
  ),
  names_ok as (
    select count(*) = count(distinct name) as ok from gt
  ),
  children_exist_ok as (
    select not exists (
      select 1
      from gt, jsonb_array_elements_text(children) c(child)
      left join gt cgt on cgt.name = child
      where cgt.name is null
    ) as ok
  ),
  parent_links_ok as (
    select not exists (
      select 1
      from gt p
      join jsonb_array_elements_text(p.children) c(child) on true
      join gt ch on ch.name = child
      where coalesce(ch.parent,'') <> p.name
    ) as ok
  ),
  roots as (select name from gt where parent is null),
  walk as (
    select r.name as root, r.name as cur, 1 as depth from roots r
    union all
    select w.root, gt2.name as cur, w.depth+1
    from walk w
    join gt gt1 on gt1.name = w.cur
    join jsonb_array_elements_text(gt1.children) c(child) on true
    join gt gt2 on gt2.name = child
    where w.depth < 6
  ),
  depth_ok as (
    select not exists (
      select 1 from (select cur, max(depth) d from walk group by cur) mx where mx.d > 6
    ) as ok
  ),
  no_cycles as (
    select case when (select count(*) from roots) = 0 then false
                else (select count(distinct cur) from walk) = (select count(*) from gt)
           end as ok
  )

  select (select ok from is_arr)
     and (select ok from all_ok)
     and (select ok from names_ok)
     and (select ok from children_exist_ok)
     and (select ok from parent_links_ok)
     and (select ok from depth_ok)
     and (select ok from no_cycles);
$$;

-- =========================
-- Single field item validator
-- =========================
create or replace function public.is_valid_field_item(e jsonb)
returns boolean
language sql
stable
as $$
  select
    jsonb_typeof(e)='object'
    and (e ? 'ref') and jsonb_typeof(e->'ref')='string'
    and (e ? 'parent') and jsonb_typeof(e->'parent')='object'
    and ((e->'parent') ? 'group_name') and jsonb_typeof((e->'parent')->'group_name')='string'
    and (not ((e->'parent') ? 'group_instance_id') or jsonb_typeof((e->'parent')->'group_instance_id')='string')
    and (not (e ? 'value') or true) -- datatype/options correctness enforced at save with registry-aware checks
    and (not (e ? 'editable')  or jsonb_typeof(e->'editable')='boolean')
    and (not (e ? 'removable') or jsonb_typeof(e->'removable')='boolean')
    and (not (e ? 'required')  or jsonb_typeof(e->'required')='boolean')
    and (not (e ? 'hierarchy') or (
      jsonb_typeof(e->'hierarchy')='object'
      and (not ((e->'hierarchy') ? 'hidden')    or jsonb_typeof((e->'hierarchy')->'hidden')='boolean')
      and (not ((e->'hierarchy') ? 'advanced')  or jsonb_typeof((e->'hierarchy')->'advanced')='boolean')
      and (not ((e->'hierarchy') ? 'importance') or (
        jsonb_typeof((e->'hierarchy')->'importance')='string'
        and public.in_enum((e->'hierarchy')->>'importance', null::public.importance_level)
      ))
    ))
    and (not (e ? 'ui_override') or public.is_valid_ui(e->'ui_override'))
    and (not (e ? 'repeatable') or (
      jsonb_typeof(e->'repeatable')='object'
      and (not (e->'repeatable' ? 'min') or jsonb_typeof(e->'repeatable'->'min')='number')
      and (not (e->'repeatable' ? 'max') or jsonb_typeof(e->'repeatable'->'max')='number')
      and (not (e->'repeatable' ? 'labelSingular') or jsonb_typeof(e->'repeatable'->'labelSingular')='string')
      and (not (e->'repeatable' ? 'labelPlural')   or jsonb_typeof(e->'repeatable'->'labelPlural')='string')
    ))
    and (not (e ? 'item_instance_id') or jsonb_typeof(e->'item_instance_id')='string');
$$;

-- =========================
-- Items + Groups coherence check
-- (parent existence, group/item repeatability & bounds, requireds, uniqueness)
-- =========================
create or replace function public.is_valid_items_with_groups(items jsonb, groups jsonb)
returns boolean
language sql
stable
as $$
  with a_items  as (select coalesce(items,  '[]'::jsonb) j),
  a_groups as (select coalesce(groups, '[]'::jsonb) j),

  items_is_arr  as (select jsonb_typeof(j) = 'array' as ok from a_items),
  groups_is_arr as (select jsonb_typeof(j) = 'array' as ok from a_groups),
  groups_ok     as (select public.is_valid_field_groups((select j from a_groups)) as ok),

  g_elems as (select jsonb_array_elements((select j from a_groups)) g),
  i_elems as (select jsonb_array_elements((select j from a_items))  e),

  all_items_valid as (
    select not exists (select 1 from i_elems where not public.is_valid_field_item(e)) as ok
  ),

  g_table as (
    select
      g->>'name' as name,
      case when (g ? 'parent') and jsonb_typeof(g->'parent')='string' then g->>'parent' else null end as parent,
      (g ? 'repeatable') as is_repeatable,
      case when (g ? 'repeatable') and (g->'repeatable' ? 'min') then (g->'repeatable'->>'min')::numeric else null end as rep_min,
      case when (g ? 'repeatable') and (g->'repeatable' ? 'max') then (g->'repeatable'->>'max')::numeric else null end as rep_max,
      case when (g ? 'required') and jsonb_typeof(g->'required')='boolean' then (g->>'required')::boolean else false end as required
    from g_elems
  ),

  -- transitive closure root→desc for "required group" satisfaction
  closure as (
    select name as root, name as desc from g_table
    union all
    select c.root, g2.name
    from closure c
    join g_table g2 on g2.parent = c.desc
  ),

  i_table as (
    select
      e,
      e->>'ref' as ref,
      (e->'parent'->>'group_name') as gname,
      case when (e->'parent' ? 'group_instance_id') then (e->'parent'->>'group_instance_id') else null end as ginst,
      case when (e ? 'item_instance_id') then (e->>'item_instance_id') else null end as iinst,
      (e ? 'repeatable') as field_repeatable,
      case when (e ? 'required') and (e->>'required')::boolean = true then true else false end as required_item
    from i_elems
  ),

  parent_exists_ok as (
    select not exists (
      select 1 from i_table i
      left join g_table g on g.name = i.gname
      where g.name is null
    ) as ok
  ),

  group_instance_presence_ok as (
    select not exists (
      select 1
      from i_table i
      join g_table g on g.name = i.gname
      where (g.is_repeatable and i.ginst is null)
         or ((not g.is_repeatable) and i.ginst is not null)
    ) as ok
  ),

  nonrepeat_uniqueness_ok as (
    select not exists (
      select 1
      from i_table
      where field_repeatable = false
      group by gname, ginst, ref
      having count(*) > 1
    ) as ok
  ),
  nonrepeat_no_item_instance_ok as (
    select not exists (
      select 1 from i_table
      where field_repeatable = false and iinst is not null
    ) as ok
  ),

  repeatable_item_instance_present_ok as (
    select not exists (
      select 1 from i_table
      where field_repeatable = true and iinst is null
    ) as ok
  ),
  repeatable_item_instance_unique_ok as (
    select not exists (
      select 1
      from i_table
      where field_repeatable = true
      group by gname, ginst, ref, iinst
      having count(*) > 1
    ) as ok
  ),

  required_groups_ok as (
    select not exists (
      select 1
      from g_table rg
      where rg.required
        and not exists (
          select 1
          from closure c
          join i_table i on i.gname = c.desc
          where c.root = rg.name
        )
    ) as ok
  ),

  group_instance_counts as (
    select gname as name, count(distinct ginst)::numeric as n
    from i_table
    group by gname
  ),
  group_repeatable_bounds_ok as (
    select not exists (
      select 1
      from g_table g
      left join group_instance_counts c on c.name = g.name
      where g.is_repeatable
        and (
          (g.rep_min is not null and coalesce(c.n,0) < g.rep_min) or
          (g.rep_max is not null and coalesce(c.n,0) > g.rep_max)
        )
    ) as ok
  ),

  field_groups as (
    select
      i.gname, i.ginst, i.ref,
      array_agg( case when (i.e ? 'repeatable') and (i.e->'repeatable' ? 'min')
                      then (i.e->'repeatable'->>'min')::numeric end ) filter (where i.field_repeatable) as mins,
      array_agg( case when (i.e ? 'repeatable') and (i.e->'repeatable' ? 'max')
                      then (i.e->'repeatable'->>'max')::numeric end ) filter (where i.field_repeatable) as maxs,
      sum( case when i.field_repeatable then 1 else 0 end )::numeric as n_repeat_items
    from i_table i
    group by i.gname, i.ginst, i.ref
  ),

  field_repeatable_bounds_consistent_ok as (
    select not exists (
      select 1
      from field_groups fg
      where n_repeat_items > 0 and (
        ( exists (select 1 from unnest(fg.mins) as u(x) where x is not null)
          and (select min(x) from unnest(fg.mins) as u(x)) <> (select max(x) from unnest(fg.mins) as u(x))
        )
        or
        ( exists (select 1 from unnest(fg.maxs) as v(y) where y is not null)
          and (select min(y) from unnest(fg.maxs) as v(y)) <> (select max(y) from unnest(fg.maxs) as v(y))
        )
      )
    ) as ok
  ),

  field_repeatable_bounds_ok as (
    select not exists (
      select 1
      from field_groups fg
      cross join lateral (
        select
          (select min(x) from unnest(fg.mins) as u(x)) as min_lo,
          (select max(y) from unnest(fg.maxs) as v(y)) as max_hi
      ) b
      where n_repeat_items > 0 and (
        (b.min_lo is not null and fg.n_repeat_items < b.min_lo) or
        (b.max_hi is not null and fg.n_repeat_items > b.max_hi)
      )
    ) as ok
  ),

  required_items_have_value_ok as (
    select not exists (
      select 1 from i_table i
      where i.required_item and not (i.e ? 'value')
    ) as ok
  )

  select (select ok from items_is_arr)
     and (select ok from groups_is_arr)
     and (select ok from groups_ok)
     and (select ok from all_items_valid)
     and (select ok from parent_exists_ok)
     and (select ok from group_instance_presence_ok)
     and (select ok from nonrepeat_uniqueness_ok)
     and (select ok from nonrepeat_no_item_instance_ok)
     and (select ok from repeatable_item_instance_present_ok)
     and (select ok from repeatable_item_instance_unique_ok)
     and (select ok from required_groups_ok)
     and (select ok from group_repeatable_bounds_ok)
     and (select ok from field_repeatable_bounds_consistent_ok)
     and (select ok from field_repeatable_bounds_ok)
     and (select ok from required_items_have_value_ok);
$$;

-- =========================
-- Top-level glue for a form
-- =========================
create or replace function public.is_valid_form_content(p jsonb)
returns boolean
language sql
immutable
as $$
  with b as (select coalesce(p, '{}'::jsonb) j),
  is_obj as (select jsonb_typeof(j) = 'object' as ok from b),
  keys_ok as (select not exists (
    select 1 from b, jsonb_object_keys(j) k where k not in ('groups','items')
  ) as ok),
  groups_ok as (select public.is_valid_field_groups(coalesce(j->'groups','[]'::jsonb)) from b),
  items_ok  as (select public.is_valid_items_with_groups(
                  coalesce(j->'items','[]'::jsonb),
                  coalesce(j->'groups','[]'::jsonb)
                ) from b)
  select (select ok from is_obj)
     and (select ok from keys_ok)
     and (select * from groups_ok)
     and (select * from items_ok);
$$;
```

---

# Section 3: Media Items (Planned)

### Purpose

`node_type="media"` content that lists assets (images, audio, video, files) with light metadata and optional per-item UI overrides. Lean now, extensible later.

### Simplified Prose

* **MediaItem** (array element)

  * `asset_type` *(req)*: enum `asset_type` = `image|audio|video|file`.
  * `url` *(req)*: string; must look like `http(s)://…`.
  * `meta?` *(obj)*: optional hints; if present, keys (when present) must be typed:

    * `width?` (number), `height?` (number), `duration_sec?` (number), `fps?` (number),
      `codec?` (string), `size_bytes?` (number), `mime?` (string).
    * Extra keys allowed (forward-compatible), but value types must be JSON primitives/objects/arrays.
  * `editable?` *(bool, def true)*, `removable?` *(bool, def true)*.
  * `ui_override?` *(obj)*: i18n like fields `{ label?, placeholder?, help? }`.
  * `parent_group?` *(obj, optional)*: `{ group_name: string, group_instance_id?: string }` (for colocating media with form groups; not cross-validated yet).
  * **Order**: array order.
* **MediaContent** (node content)

  * JSON array of `MediaItem`.
  * Will be validated by `is_valid_media_items(arr)` and (later) routed from `is_valid_content_shape('media', content)`.

### Top-Level Contract

```json
{
  "MediaItem": {
    "asset_type": "image|audio|video|file",
    "url": "https://…",
    "meta": {
      "width": 1920,
      "height": 1080,
      "duration_sec": 12.5,
      "fps": 24,
      "codec": "h264",
      "size_bytes": 12345678,
      "mime": "video/mp4"
    },
    "editable": true,
    "removable": true,
    "ui_override": { "label": { "fallback": "…" }, "help": { "fallback": "…" } },
    "parent_group": { "group_name": "characters", "group_instance_id": "ex1" }
  },
  "MediaContent": [
    { "asset_type": "image", "url": "https://…/frame01.jpg" }
  ]
}
```

### SQL Definition

```sql
-- =========================================
-- Enums (idempotent) — add once
-- =========================================
do $$ begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='asset_type' and n.nspname='public'
  ) then
    create type public.asset_type as enum ('image','audio','video','file');
  end if;
end $$;

-- =========================================
-- Media item validator (single)
-- =========================================
create or replace function public.is_valid_media_item(m jsonb)
returns boolean
language sql
stable
as $$
  select
    jsonb_typeof(m) = 'object'

    -- required: asset_type, url
    and (m ? 'asset_type')
    and jsonb_typeof(m->'asset_type') = 'string'
    and public.in_enum(m->>'asset_type', null::public.asset_type)

    and (m ? 'url')
    and jsonb_typeof(m->'url') = 'string'
    and (m->>'url') ~* '^https?://'

    -- optional flags
    and (not (m ? 'editable')  or jsonb_typeof(m->'editable')  = 'boolean')
    and (not (m ? 'removable') or jsonb_typeof(m->'removable') = 'boolean')

    -- optional ui override (same shape as field ui)
    and (not (m ? 'ui_override') or public.is_valid_ui(m->'ui_override'))

    -- optional parent_group shape
    and (not (m ? 'parent_group') or (
      jsonb_typeof(m->'parent_group') = 'object'
      and ((m->'parent_group') ? 'group_name')
      and jsonb_typeof((m->'parent_group')->'group_name') = 'string'
      and (not ((m->'parent_group') ? 'group_instance_id')
           or jsonb_typeof((m->'parent_group')->'group_instance_id') = 'string')
    ))

    -- optional meta with typed known keys; extra keys allowed
    and (not (m ? 'meta') or (
      jsonb_typeof(m->'meta') = 'object'
      and not exists (
        select 1
        from jsonb_each(m->'meta') kv(k, v)
        where (k in ('width','height','duration_sec','fps','size_bytes') and jsonb_typeof(v) <> 'number')
           or (k in ('codec','mime') and jsonb_typeof(v) <> 'string')
      )
    ));
$$;

-- =========================================
-- Media items validator (array)
-- =========================================
create or replace function public.is_valid_media_items(arr jsonb)
returns boolean
language sql
stable
as $$
  with a as (select coalesce(arr, '[]'::jsonb) j),
  is_arr as (select jsonb_typeof(j) = 'array' as ok from a),
  elems as (select jsonb_array_elements((select j from a)) e),
  all_ok as (select not exists (select 1 from elems where not public.is_valid_media_item(e)) as ok)
  select (select ok from is_arr) and (select ok from all_ok);
$$;

-- =========================================
-- (Planned) Route 'media' through the strict validator
-- When you’re ready, update the content-shape router:
-- =========================================
-- create or replace function public.is_valid_content_shape(node_type text, content jsonb)
-- returns boolean language sql stable as $$
--   select case
--     when node_type = 'form'  then public.is_valid_form_content(content)
--     when node_type = 'group' then jsonb_typeof(coalesce(content,'[]'::jsonb))='array' -- tighten later
--     when node_type = 'media' then public.is_valid_media_items(content)
--     else false
--   end;
-- $$;
```

---

# Section 4: Storyboard Nodes (Strucure Locked needs full recheck)

### Purpose

Capture the storyboard tree per job. Each node is a `form`, `group`, or `media` container; paths are ltree-based; content is strictly validated by node type.

### Simplified Prose

* **id**: UUID PK.
* **job\_id**: FK → `storyboard_jobs.id`.
* **node\_type**: one of `form|group|media` (validated).
* **path**: `ltree` unique per job (e.g., `root.user_input`, `root.characters.extras`).
* **parent\_id**: optional FK → self; must be same `job_id`; `parent.path @> path` and **immediate child** (`nlevel(path)=nlevel(parent.path)+1`).
* **is\_section**: auto-set by trigger to `true` when `nlevel(path)=2` (e.g., `root.basic`).
* **content**: by type

  * `form` → `FormContent` (see §2: FieldGroup/FieldItem)
  * `group` → array (TBD tighter validator later)
  * `media` → `MediaContent` (see §3)
* **edit**: `{ has_editables: boolean, validate? { n8n_function_id: uuid|string } }`.
* **actions**: `{ generate? { n8n_function_id: uuid|string } }`.
* **dependencies**: array of ltree paths or `{ path, optional? }`.
* **version**: ≥1; **active**: boolean; timestamps.

### Top-Level Contract

```json
{
  "id": "uuid",
  "job_id": "uuid",
  "node_type": "form|group|media",
  "path": "ltree",
  "parent_id": "uuid|null",
  "is_section": true,
  "content": {},
  "edit": { "has_editables": true, "validate": { "n8n_function_id": "uuid-or-name" } },
  "actions": { "generate": { "n8n_function_id": "uuid-or-name" } },
  "dependencies": [ "root.characters.lead", { "path": "root.props", "optional": true } ],
  "version": 1,
  "active": true
}
```

### SQL Definition

```sql
-- Required extension
create extension if not exists ltree;

-- Helper: node_type validator (idempotent)
create or replace function public.is_valid_node_type(t text)
returns boolean language sql immutable as $$
  select t in ('form','group','media');
$$;

-- Helper: path text validator (used by definitions; ltree column self-validates)
create or replace function public.is_valid_path_text(t text)
returns boolean language sql immutable as $$
  -- Accept ltree-compatible labels separated by dots
  select t ~ '^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$';
$$;

-- === TABLE ===
create table if not exists public.storyboard_nodes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.storyboard_jobs(id) on delete cascade,

  node_type text not null,
  path ltree not null,
  parent_id uuid null references public.storyboard_nodes(id) on delete cascade,

  is_section boolean not null default false,

  content jsonb not null default '{}'::jsonb,
  edit jsonb not null default '{}'::jsonb,
  actions jsonb not null default '{}'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,

  version int not null default 1,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Basic shape checks
  constraint chk_sn_node_type     check (public.is_valid_node_type(node_type)),
  constraint chk_sn_content_shape check (public.is_valid_content_shape(node_type, content)),
  constraint chk_sn_edit_shape    check (public.is_valid_node_edit_strict(edit)),
  constraint chk_sn_actions_shape check (public.is_valid_node_actions_strict(actions)),
  constraint chk_sn_deps_shape    check (public.is_valid_node_dependencies(dependencies)),
  constraint chk_sn_version       check (version >= 1)
);

-- Uniqueness and lookup
create unique index if not exists ux_storyboard_nodes_job_path on public.storyboard_nodes(job_id, path);
create index if not exists ix_storyboard_nodes_job on public.storyboard_nodes(job_id);
create index if not exists ix_storyboard_nodes_parent on public.storyboard_nodes(parent_id);
create index if not exists ix_storyboard_nodes_type on public.storyboard_nodes(node_type);
create index if not exists ix_storyboard_nodes_path_gist on public.storyboard_nodes using gist (path);

-- Touch trigger
create or replace function public.t_storyboard_nodes_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_storyboard_nodes_touch on public.storyboard_nodes;
create trigger trg_storyboard_nodes_touch
before update on public.storyboard_nodes
for each row execute function public.t_storyboard_nodes_touch();

-- Parent/Path guard (CHECKs cannot reference siblings; enforce via trigger)
create or replace function public.t_storyboard_nodes_guard()
returns trigger language plpgsql as $$
declare
  p_job uuid;
  p_path ltree;
begin
  -- is_section auto: true when depth == 2 (e.g., root.basic)
  new.is_section := (nlevel(new.path) = 2);

  if new.parent_id is null then
    -- must be a top-level or deeper node without an explicit parent (allowed), no extra rule here
    return new;
  end if;

  select job_id, path into p_job, p_path
  from public.storyboard_nodes
  where id = new.parent_id;

  if not found then
    raise exception 'Parent % not found', new.parent_id using errcode = '23503';
  end if;

  if p_job <> new.job_id then
    raise exception 'Parent job_id mismatch' using errcode = '23514';
  end if;

  -- parent must be an ancestor and immediate parent
  if not (p_path @> new.path) then
    raise exception 'Parent path % is not an ancestor of child path %', p_path::text, new.path::text using errcode = '23514';
  end if;

  if nlevel(new.path) <> nlevel(p_path) + 1 then
    raise exception 'Child path must be exactly one level below parent (got % vs %)', nlevel(new.path), nlevel(p_path) using errcode = '23514';
  end if;

  return new;
end $$;

drop trigger if exists trg_storyboard_nodes_guard on public.storyboard_nodes;
create trigger trg_storyboard_nodes_guard
before insert or update on public.storyboard_nodes
for each row execute function public.t_storyboard_nodes_guard();

-- Notes:
-- - content validation is routed by public.is_valid_content_shape(node_type, content):
--     * 'form'  -> public.is_valid_form_content(content)   (Locked in §2)
--     * 'media' -> public.is_valid_media_items(content)    (Planned in §3)
--     * 'group' -> (TBD tighter shape; currently array placeholder)
-- - edit/actions/dependencies are validated by your existing strict validators:
--     public.is_valid_node_edit_strict(jsonb),
--     public.is_valid_node_actions_strict(jsonb),
--     public.is_valid_node_dependencies(jsonb).
```


---

## Section 3: Storyboard Jobs

### Purpose

* Top-level container for storyboard sessions.
* Owns nodes and progressive sections.

### Simplified Prose

* **id**: UUID PK.
* **user\_id**: FK auth.users.
* **session\_id**: optional string.
* **user\_input**, **movie\_info**, **characters**, **props**, **timeline**, **music** as JSON sections.
* Each section has updated\_at for staleness checks.

### Top-Level Contract

```json
{
  "id": "uuid",
  "user_id": "uuid|null",
  "session_id": "string|null",
  "user_input": { },
  "movie_info": { },
  "characters": { },
  "props": { },
  "timeline": { },
  "music": { }
}
```

### SQL Definition

```sql
-- see storyboard_jobs schema with section columns and updated_at fields
```

---

## Section 4: n8n Functions

### Purpose

* Registry of orchestrator functions.
* Enforces contracts for requests, responses, and expected payload.

### Simplified Prose

* Each function defines name, type, price, webhooks, expected\_payload, success schema.
* `expected_payload` uses ltree selectors (strict except node\_path).
* Can be called by id or name.
* Auto-touch trigger for updated\_at.

### Top-Level Contract

```json
{
  "n8n_function_id": "uuid-or-name",
  "job_id": "uuid",
  "node_path": "string",
  "environment": "test|production",
  "payload": { },
  "meta": { "language":"…","accent":"…","user_id":"uuid|null","session_id":"string|null","trace": {"source":"…","step":"…"} }
}
```

### SQL Definition

```sql
-- see strict n8n_functions table with expected_payload validator functions
```

---

## Section 5: Asset Types

### Purpose

* Define allowed asset categories.
* Standardize metadata.

### Simplified Prose

* Types: image, audio, video, file.
* Common: url, meta.
* Meta holds type-specific properties.

### Top-Level Contract

```json
{
  "asset_type": "image|audio|video|file",
  "url": "string",
  "meta": { "width":123, "height":456 }
}
```

### SQL Definition

```sql
-- TBD: asset table if needed
```

---

## Section 6: Staleness & Validation

### Purpose

* Handle dependency freshness at runtime.
* Guide UI flags and validation.

### Simplified Prose

* Node marked stale if any dependency updated\_at > node.updated\_at.
* Validation payloads come from live UI + job\_id/node\_path.

### Top-Level Contract

```json
{
  "job_id": "uuid",
  "node_path": "ltree",
  "stale": true,
  "validated": true
}
```

### SQL Definition

```sql
-- Implement via queries comparing updated_at across dependencies
```

---

## Section 7: Node Definitions

### Purpose

* Central catalog of reusable node blueprints ("premade nodes").
* Keeps definitions versioned, validated, and decoupled from per-job instances.
* Instantiated into `storyboard_nodes` for a specific job via RPC.

### Simplified Prose

* **id**: UUID PK.
* **def\_key**: unique string identifier (e.g., `root.user_input.form`).
* **title**: human-readable name.
* **description**: optional summary.
* **node\_type**: `form | group | media`.
* **is\_section**: boolean (top-level section flag).
* **path\_template**: ltree-like text path for the instance (e.g., `root.user_input`).
* **parent\_path\_template**: optional parent path text.
* **content\_template**: JSONB array; shape depends on `node_type`

  * form → FieldItem\[] `{ ref, value, editable?, hierarchy?, removable? }`
  * group → NodeLink\[] `{ path, removable? }`
  * media → AssetItem\[] `{ asset_type, url, meta?, removable? }`
* **edit\_template**: JSON `{ has_editables, validate? { n8n_function_id } }`.
* **actions\_template**: JSON `{ generate? { n8n_function_id } }`.
* **dependencies\_template**: JSON array of paths or objects `{ path, optional? }`.
* **version**: integer ≥ 1.
* **active**: boolean.
* **timestamps**: created\_at, updated\_at (auto-touched).

### Top-Level Contract

```json
{
  "def_key": "string",
  "title": "string",
  "description": "string|null",
  "node_type": "form|group|media",
  "is_section": true,
  "path_template": "ltree-text",
  "parent_path_template": "ltree-text|null",
  "content_template": [],
  "edit_template": { "has_editables": true, "validate": { "n8n_function_id": "uuid-or-name" } },
  "actions_template": { "generate": { "n8n_function_id": "uuid-or-name" } },
  "dependencies_template": [ "root.section", { "path": "root.other", "optional": true } ],
  "version": 1,
  "active": true
}
```

### SQL Definition

```sql
create table if not exists public.node_definitions (
  id uuid primary key default gen_random_uuid(),
  def_key text not null unique,
  title text not null,
  description text null,

  node_type text not null,                   -- 'form' | 'group' | 'media'
  is_section boolean not null default false,
  path_template text not null,
  parent_path_template text null,

  content_template jsonb not null default '[]'::jsonb,
  edit_template jsonb not null default '{"has_editables": false}'::jsonb,
  actions_template jsonb not null default '{}'::jsonb,
  dependencies_template jsonb not null default '[]'::jsonb,

  version int not null default 1,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_nd_node_type       check (public.is_valid_node_type(node_type)),
  constraint chk_nd_content_shape   check (public.is_valid_content_shape(node_type, content_template)),
  constraint chk_nd_edit_shape      check (public.is_valid_node_edit_strict(edit_template)),
  constraint chk_nd_actions_shape   check (public.is_valid_node_actions_strict(actions_template)),
  constraint chk_nd_deps_shape      check (public.is_valid_node_dependencies(dependencies_template)),
  constraint chk_nd_path_template   check (public.is_valid_path_text(path_template)),
  constraint chk_nd_parent_path_tpl check (parent_path_template is null or public.is_valid_path_text(parent_path_template))
);

create index if not exists ix_node_definitions_active on public.node_definitions(active);
create index if not exists ix_node_definitions_key on public.node_definitions(def_key);

create or replace function public.t_node_definitions_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_node_definitions_touch on public.node_definitions;
create trigger trg_node_definitions_touch
before update on public.node_definitions
for each row execute function public.t_node_definitions_touch();
```

---

# Section X: Next Plans & Vision (Ltree Lookup, APIs, FE Adapters)

### Purpose

Define the **minimum clear targets** to finish the base and ship lookup/validation/edit flows across DB → Edge Functions → Frontend adapters, without getting lost in implementation details.

---

## 1) Ltree Lookup & Pull

### Goals

* Address any value/flag by a **stable path**.
* Read/write single values or batch edits safely.
* Keep **validation server-side** and **atomic**.

### Requirements

* **Path grammar** (no change):

  ```
  <node_path>.form.<group>[.g_<groupInst>]*.<ref>[.i_<itemInst>]
  ```

  * Examples:

    * `root.user_input.form.basic.lead_name`
    * `root.user_input.form.characters.g_ex1.char_name`
    * `root.user_input.form.scenes.g_s1.actors.g_ex2.role.i_r1`

### DB (RPC) — To finalize

* `form_get_value_by_ltree(content jsonb, path text) → jsonb`
* `form_set_value_by_ltree(content jsonb, path text, new_value jsonb) → jsonb`
* `form_apply_edits_by_ltree(content jsonb, edits jsonb) → jsonb`
* `node_validate_edits(node_id uuid, edits jsonb) → jsonb`

  * Returns:

    ```json
    { "valid": true, "content": { /* merged content */ } }
    ```

    or

    ```json
    { "valid": false, "reason": "content failed validation" }
    ```
* **Indexes**: already have `gist(path)`; consider GIN on `content` later if needed for analytics.

> Status: bodies drafted earlier; wire them as **stable** RPC functions (no schema changes required).

---

## 2) Edge Functions (HTTP API)

### Goals

* Thin, predictable endpoints FE/BE can call.
* All persistence behind **validate → apply → save**.

### Endpoints (minimal)

* `POST /api/nodes/:id/validate`

  * Body: `{ edits: { path: string, value: any }[] }`
  * Calls `node_validate_edits`.
  * Response:

    ```json
    { "valid": true, "content": { /* merged content */ } }
    ```

    or

    ```json
    { "valid": false, "errors": [{ "path": "...", "code": "RULE_FAIL", "message": "..." }] }
    ```

    > For now, return the simple `{valid, reason}` from RPC; enrich to `errors[]` later.
* `POST /api/nodes/:id/apply`

  * Body: `{ edits: { path: string, value: any }[] }`
  * Flow: validate → if ok: `update storyboard_nodes set content = merged, updated_at = now()` → return updated node.
* `POST /api/nodes/:id/generate`

  * Reads `actions.generate.n8n_function_id`, forwards payload to orchestrator (n8n), returns `{ run_id, status }`.

### Auth / Multi-tenant

* Enforce **RLS** or function-level guards: node belongs to requesting user/job.

---

## 3) Frontend Adapters (TS)

### Goals

* Ergonomic **get/set/batch** by path.
* No schema knowledge in components; rely on SSOT validators.

### Minimal API (client)

```ts
type Edit = { path: string; value: unknown };

interface NodeClient {
  get(nodeId: string): Promise<{ content: any }>;
  validate(nodeId: string, edits: Edit[]): Promise<{ valid: boolean; content?: any; reason?: string }>;
  apply(nodeId: string, edits: Edit[]): Promise<{ content: any }>;
  generate(nodeId: string, payload?: any): Promise<{ run_id: string; status: string }>;
}

// Optional in-memory helper for local UX
interface FormVM {
  getValue(path: string): unknown;
  setValue(path: string, value: unknown): void; // only local; real save goes via validate/apply
  toEdits(): Edit[]; // build batch
}
```

### Usage Guideline

* **Read** node → hydrate VM → UI bindings.
* On change: `vm.setValue(path, v)` → buffer.
* **Save**: `validate(edits)` → if `valid`, call `apply(edits)` → rehydrate.
* **Generate**: call `generate(nodeId, payload)`; show orchestration status.

---

## 4) Enums — Plans

### Already in DB (locked)

* `field_datatype`, `field_widget`, `options_source`, `http_method`, `order_dir`,
  `table_where_op`, `string_format`, `array_item_type`, `importance_level`, `group_layout`.

### Planned Soon

* `asset_type` (added in Media section plan: `image|audio|video|file`)
  *→ after we wire `is_valid_media_items` and route in `is_valid_content_shape`.*
* (Optional) `environment` for actions (`test|production`) if needed by orchestrator.
* (Optional) `validation_severity` (`info|warn|error`) if we expand detailed errors.

> FE should use **codegen** from DB schema (Supabase types) to avoid drift.

---

## 5) Triggers & Staleness

### Triggers (now)

* **Touch**: `t_storyboard_nodes_touch` (done).
* **Guard**: `t_storyboard_nodes_guard` (parent/path & `is_section`).

### Planned

* **Staleness** (view or RPC):

  * `node_is_stale(node_id uuid) → boolean`
  * Logic: compare `updated_at` for each `dependencies[]` path vs this node’s `updated_at`.
* (Optional) **Auto-stale** flag column (boolean) + trigger to recompute on dependency updates (defer; RPC is enough for MVP).

---

## 6) Validation UX (Now vs Later)

### Now (simple)

* RPC returns `{ valid: boolean, reason?: string }`.
* FE: show a generic banner on failure; block save.

### Later (granular)

* RPC returns:

  ```json
  {
    "valid": false,
    "errors": [
      { "path": "…lead_name", "code": "MIN_LENGTH", "message": "min 3", "suggestion": "Add more characters" }
    ]
  }
  ```
* Add `validation_severity` enum if needed.

---

## 7) Developer Guide (Quick)

* **Add fields** → `field_registry` (SSOT-enforced).
* **Design a form** → `node_definitions.content_template` with `groups[]` + `items[]`.
* **Instantiate** → create `storyboard_nodes` row for a job (copy template → live content).
* **Edit flow** → FE builds `edits[]` → `/validate` → `/apply`.
* **Generate** → `/generate` (reads `actions.generate`).

---

## 8) Acceptance Criteria (MVP)

* [ ] Can **read** any field value by path (DB RPC or FE VM).
* [ ] Can **validate** batch edits server-side (RPC).
* [ ] Can **apply** batch edits atomically (Edge Function).
* [ ] Node **content** passes `is_valid_content_shape` for `form`; rejects invalid shapes.
* [ ] **Paths** are consistent with ltree; parent/child guard enforced.
* [ ] **Enums** present; FE gets types via codegen.
* [ ] **Staleness** RPC returns correct boolean (optional for first ship).

---

## 9) What I Need From You (to pull from Supabase if desired)

If you want me to align the doc with live DB:

* Dump the current definitions of:

  * `is_valid_node_edit_strict`, `is_valid_node_actions_strict`, `is_valid_node_dependencies`.
  * Any existing Edge Functions you have (names + request/response shapes).
  * Current `storyboard_nodes` DDL (if it differs from the spec above).
* I’ll fold those verbatim into the SSOT and flag mismatches.

