

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

# Section 1: Field Registry (Locked)

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

# Section 2: Form Schema (Locked)

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


# Section 3: Media (Locked v1)

### Purpose

* Versioned assets per node, **one kind per node**: `image` or `video` or `audio`.
* **Node-level versions** for undo/redo; **items are immutable** inside a version.
* Stable storage paths generated server-side.

## Core Rules

* `node_type`: `"media"`
* `content.kind`: `"image" | "video" | "audio"` (single kind per node)
* `content.current_v`: integer pointing to an entry in `content.versions[*].v`
* `content.versions`: append-only; any change creates a new version
* Items (`images|videos|audios`) are **never edited in place**; array order is render order
* Item IDs must be **unique within the version**

## Data Contract

### `node.content` (when `node_type="media"`)

```json
{
  "kind": "image | video | audio",
  "current_v": 1,
  "versions": [
    {
      "v": 1,
      "images": [],                      // present only when kind="image"
      "videos": [],                      // present only when kind="video"
      "audios": [],                      // present only when kind="audio"
      "ai_models": [ { "provider": "fal", "model": "kling-2.1", "version": "2.1" } ],
      "credits_used": 0.0,
      "created_at": "2025-09-14T09:30:00Z",
      "source": { "actor": "user|system", "job_id": "uuid", "node_path": "ltree", "function_id": "uuid" }
    }
  ]
}
```

### Items

#### ImageItem

```json
{
  "id": "uuid-or-ulid",
  "asset_type": "image",
  "url": "https://…",
  "storage": { "bucket": "media", "path": "jobs/{job}/nodes/{node}/v{v}/images/{id}.jpg" },
  "meta": {
    "width": 1024, "height": 1536, "mime": "image/jpeg",
    "size_bytes": 2345678,
    "orientation": "portrait"          // portrait | landscape | square (optional)
  }
}
```

#### VideoItem

```json
{
  "id": "uuid-or-ulid",
  "asset_type": "video",
  "url": "https://…",
  "storage": { "bucket": "media", "path": "jobs/{job}/nodes/{node}/v{v}/videos/{id}.mp4" },
  "meta": {
    "width": 1920, "height": 1080, "duration_sec": 7.2, "fps": 24, "mime": "video/mp4",
    "video_codec": "h264", "audio_codec": "aac", "has_audio": true, "bitrate_kbps": 2400
  }
}
```

#### AudioItem

```json
{
  "id": "uuid-or-ulid",
  "asset_type": "audio",
  "url": "https://…",
  "storage": { "bucket": "media", "path": "jobs/{job}/nodes/{node}/v{v}/audios/{id}.wav" },
  "meta": {
    "duration_sec": 3.1, "sample_rate_hz": 44100, "channels": 2, "mime": "audio/wav", "bitrate_kbps": 1411
  }
}
```

## Storage & URL

* **Backend decides** `storage.path`; frontend never crafts it.
* Convention: `jobs/{job_id}/nodes/{node_id}/v{v}/{images|videos|audios}/{item_id}.{ext}`
* Stable key: `storage.bucket + storage.path`
* `url` is server-derived (public or signed)

## Frontend Contract

* Read:

  * `const ver = content.versions.find(x => x.v === content.current_v)`
  * Render `ver.images | ver.videos | ver.audios`
* Changes:

  * Any add/remove/reorder/replace ⇒ **create a new version**
  * Undo/redo ⇒ switch `current_v`

## Plans (Edge Functions)

* `POST /api/nodes/:nodeId/media/:kind/prepare-upload`
* `POST /api/nodes/:nodeId/media/:kind/finalize-version`
* `PATCH /api/nodes/:nodeId/media/:kind/current`

---

# SQL Bundle (copy-paste)

> Safe to run multiple times; guards against duplicates.

```sql
-- =========================
-- ENUM (optional, for future use)
-- =========================
do $$ begin
  create type public.media_kind as enum ('image','video','audio');
exception when duplicate_object then null; end $$;

-- =========================
-- HELPER: build versioned storage path (server-owned)
-- =========================
create or replace function public.make_media_path(
  p_kind text, p_job uuid, p_node uuid, p_v int, p_item_id text, p_ext text
) returns text
language sql
stable
as $$
  select 'jobs/'||p_job||'/nodes/'||p_node||'/v'||p_v||'/'||
         case when p_kind='image' then 'images/'
              when p_kind='video' then 'videos/'
              when p_kind='audio' then 'audios/'
              else 'files/' end
         || p_item_id || '.' || p_ext
$$;

-- =========================
-- VALIDATORS: items
-- =========================

-- Image
create or replace function public.is_valid_image_item(j jsonb)
returns boolean
language sql
stable
as $$
select
  jsonb_typeof(j)='object'
  and (j ? 'id') and jsonb_typeof(j->'id')='string'
  and (j ? 'asset_type') and (j->>'asset_type')='image'
  and (j ? 'url') and jsonb_typeof(j->'url')='string' and (j->>'url') ~* '^https?://'
  and (j ? 'storage') and jsonb_typeof(j->'storage')='object'
  and ((j->'storage') ? 'bucket') and jsonb_typeof(j->'storage'->'bucket')='string'
  and ((j->'storage') ? 'path') and jsonb_typeof(j->'storage'->'path')='string'
  and (j ? 'meta') and jsonb_typeof(j->'meta')='object'
  and ((j->'meta') ? 'width') and jsonb_typeof(j->'meta'->'width')='number' and (j->'meta'->>'width')::numeric > 0
  and ((j->'meta') ? 'height') and jsonb_typeof(j->'meta'->'height')='number' and (j->'meta'->>'height')::numeric > 0
  and ((j->'meta') ? 'mime') and jsonb_typeof(j->'meta'->'mime')='string'
  and (
       coalesce((j->'meta'->>'orientation') in ('portrait','landscape','square'), true)
      )
$$;

-- Video
create or replace function public.is_valid_video_item(j jsonb)
returns boolean
language sql
stable
as $$
select
  jsonb_typeof(j)='object'
  and (j ? 'id') and jsonb_typeof(j->'id')='string'
  and (j ? 'asset_type') and (j->>'asset_type')='video'
  and (j ? 'url') and jsonb_typeof(j->'url')='string' and (j->>'url') ~* '^https?://'
  and (j ? 'storage') and jsonb_typeof(j->'storage')='object'
  and ((j->'storage') ? 'bucket') and jsonb_typeof(j->'storage'->'bucket')='string'
  and ((j->'storage') ? 'path') and jsonb_typeof(j->'storage'->'path')='string'
  and (j ? 'meta') and jsonb_typeof(j->'meta')='object'
  and ((j->'meta') ? 'width') and jsonb_typeof(j->'meta'->'width')='number' and (j->'meta'->>'width')::numeric > 0
  and ((j->'meta') ? 'height') and jsonb_typeof(j->'meta'->'height')='number' and (j->'meta'->>'height')::numeric > 0
  and ((j->'meta') ? 'duration_sec') and jsonb_typeof(j->'meta'->'duration_sec')='number' and (j->'meta'->>'duration_sec')::numeric >= 0
  and ((j->'meta') ? 'fps') and jsonb_typeof(j->'meta'->'fps')='number' and (j->'meta'->>'fps')::numeric > 0
  and ((j->'meta') ? 'mime') and jsonb_typeof(j->'meta'->'mime')='string'
$$;

-- Audio
create or replace function public.is_valid_audio_item(j jsonb)
returns boolean
language sql
stable
as $$
select
  jsonb_typeof(j)='object'
  and (j ? 'id') and jsonb_typeof(j->'id')='string'
  and (j ? 'asset_type') and (j->>'asset_type')='audio'
  and (j ? 'url') and jsonb_typeof(j->'url')='string' and (j->>'url') ~* '^https?://'
  and (j ? 'storage') and jsonb_typeof(j->'storage')='object'
  and ((j->'storage') ? 'bucket') and jsonb_typeof(j->'storage'->'bucket')='string'
  and ((j->'storage') ? 'path') and jsonb_typeof(j->'storage'->'path')='string'
  and (j ? 'meta') and jsonb_typeof(j->'meta')='object'
  and ((j->'meta') ? 'duration_sec') and jsonb_typeof(j->'meta'->'duration_sec')='number' and (j->'meta'->>'duration_sec')::numeric >= 0
  and ((j->'meta') ? 'sample_rate_hz') and jsonb_typeof(j->'meta'->'sample_rate_hz')='number' and (j->'meta'->>'sample_rate_hz')::numeric > 0
  and ((j->'meta') ? 'channels') and jsonb_typeof(j->'meta'->'channels')='number' and (j->'meta'->>'channels')::numeric >= 1
  and ((j->'meta') ? 'mime') and jsonb_typeof(j->'meta'->'mime')='string'
$$;

-- =========================
-- VALIDATOR: node.content for media (router)
-- =========================
create or replace function public.is_valid_media_content(j jsonb)
returns boolean
language plpgsql
stable
as $$
declare
  k text;
  curr int;
  arr_key text;
  ver jsonb;
  items jsonb;
begin
  if jsonb_typeof(j) <> 'object' then return false; end if;

  k := j->>'kind';
  if k not in ('image','video','audio') then return false; end if;

  if not (j ? 'current_v') or jsonb_typeof(j->'current_v') <> 'number' then return false; end if;
  if not (j ? 'versions') or jsonb_typeof(j->'versions') <> 'array' then return false; end if;

  curr := (j->>'current_v')::int;
  if not exists (
    select 1 from jsonb_array_elements(j->'versions') v where (v->>'v')::int = curr
  ) then return false; end if;

  arr_key := case k when 'image' then 'images'
                    when 'video' then 'videos'
                    else 'audios' end;

  -- validate each version
  for ver in select * from jsonb_array_elements(j->'versions')
  loop
    if jsonb_typeof(ver) <> 'object' then return false; end if;
    if not (ver ? 'v') or jsonb_typeof(ver->'v') <> 'number' or (ver->>'v')::int < 1 then return false; end if;

    items := jsonb_extract_path(ver, arr_key);
    if items is null or jsonb_typeof(items) <> 'array' then return false; end if;

    -- item-level validation
    if k='image' and exists (
      select 1 from jsonb_array_elements(items) itm where not public.is_valid_image_item(itm)
    ) then return false; end if;

    if k='video' and exists (
      select 1 from jsonb_array_elements(items) itm where not public.is_valid_video_item(itm)
    ) then return false; end if;

    if k='audio' and exists (
      select 1 from jsonb_array_elements(items) itm where not public.is_valid_audio_item(itm)
    ) then return false; end if;

    -- unique ids within this version
    if exists (
      select 1
      from (
        select count(*) cnt, count(distinct (itm->>'id')) cntd
        from jsonb_array_elements(items) itm
      ) s
      where s.cnt <> s.cntd
    ) then return false; end if;
  end loop;

  return true;
end $$;

-- =========================
-- TABLE CHECK (storyboard_nodes)
-- =========================
alter table public.storyboard_nodes
  drop constraint if exists chk_media_content_valid,
  add constraint chk_media_content_valid
  check (
    case
      when node_type = 'media' then public.is_valid_media_content(content)
      else true
    end
  );
```

---

# Section 4: Storyboard Nodes (Final)

Awesome — here’s the doc pack you asked for.

### Purpose

* Make storyboard nodes **predictable and safe** to read/write.
* Enforce **shape-by-type** (group/form/media) so UI and jobs can rely on consistent data.
* Guard **hierarchy rules** (root sections, immediate children, same job) and **touch** timestamps.
* Normalize form authoring: if `required` is omitted, it defaults to `false`; if `required: true` is present, a valid `value` is mandatory (per §2).

### Simplified Prose

* A storyboard is a **tree** of nodes.
* **Root sections** live at `root.<section>` (depth=2). Any child is **exactly one level deeper** than its parent and shares the same `job_id`.
* **group** nodes are **structural only** → their `content` is `{}`.
* **form** nodes are validated by §2:

  * Top-level keys: `{ groups, items }`.
  * Each item has `ref` (must exist in Field Registry) and `parent.group_name`.
  * If `required: true` appears, the item must also include a valid `value` (type-checked by §2).
  * If `required` is **omitted**, a trigger sets it to `false`.
* **media** nodes are validated by §3:

  * `{ kind: 'image'|'video'|'audio', current_v: int, versions: [{ v: int, images|videos|audios: [...] }] }`.
  * Each media item passes its per-kind validator (e.g., `is_valid_image_item`).

### Top-Level Contract

> **Note on version metadata:** Additional per-version keys such as `ai_models`, `credits_used`,
> `created_at`, and `source` MAY appear and are persisted but are **not validated** by the SQL
> function in this MVP. Treat them as opaque metadata at read-time.

* **Uniqueness:** `(job_id, path)` unique.
* **Node types:** `node_type ∈ {'group','form','media'}`.
- **Paths (ltree):**
  - Root sections must have depth **2**: `root.<section>`.
  - For a child: `subpath(child.path, 0, nlevel(child.path) - 1) = parent.path`
    **and** `nlevel(child.path) = nlevel(parent.path) + 1`.
  - All children must share the same `job_id` as their parent.
* **Auto flags:** `is_section = (nlevel(path)=2)`.
* **Content by type:**
- `group` → `content` must be exactly `{}`.
- `form`  → validated by §2 (`is_valid_form_content`). If an item has `"required": true`,
  it **must** include a valid `value` per §2; if `required` is omitted, the trigger defaults it to `false`.
- `media` → validated by §3 (`is_valid_media_content`), versioned shape with per-kind item validators.

* **Edit/Actions:**

  * `edit`: `{ has_editables?: boolean, validate?: { n8n_function_id: uuid|string } }`.
  * `actions`: `{ generate?: { n8n_function_id: uuid|string } }`.
* **Dependencies:** `string[] | {path:string, optional?:boolean}[]` where `path` matches `^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$`.
- **Touch & normalization:**
  - `updated_at` is auto-updated on any change.
  - Triggers do **not** mutate `content` except for **form** nodes, where a normalizer
    defaults missing `required` to `false` on each item (see §2).

### Minimal examples

* **group**

```json
{ }
```

* **form**

```json
{
  "groups": [
    { "name": "basic",     "label": { "fallback": "Basic" } },
    { "name": "character", "label": { "fallback": "Character" } }
  ],
  "items": [
    { "ref": "language", "parent": { "group_name": "basic" } },
    { "ref": "character_name", "parent": { "group_name": "character" } }
  ]
}
```

* **media (image)**

```json
{
  "kind": "image",
  "current_v": 1,
  "versions": [
    {
      "v": 1,
      "images": [
        {
          "asset_type": "image",
          "id": "img_001",
          "url": "https://…/img_001.jpg",
          "storage": { "bucket": "storyboard", "path": "jobs/<job>/media/portrait/v1/img_001.jpg" },
          "meta": { "width": 1024, "height": 1536, "mime": "image/jpeg", "orientation": "portrait" }
        }
      ]
    }
  ]
}
```

### SQL Definition (idempotent; assumes §1–§3 helpers already exist)

```sql
-- Helpers (safe to re-run; param names match existing)
create or replace function public.is_uuid(p text)
returns boolean language sql immutable as $$
  select coalesce(p ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', false);
$$;

create or replace function public.is_valid_path_text(p text)
returns boolean language sql immutable as $$
  select p ~ '^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$';
$$;

-- Section-4 validators (names match what you already have)
create or replace function public.is_valid_node_edit_strict(p jsonb)
returns boolean language sql immutable as $$
  select
    jsonb_typeof(p)='object'
    and (not (p ? 'has_editables') or jsonb_typeof(p->'has_editables')='boolean')
    and (not (p ? 'validate') or (
      jsonb_typeof(p->'validate')='object'
      and (p->'validate') ? 'n8n_function_id'
      and jsonb_typeof((p->'validate')->'n8n_function_id')='string'
      and ( public.is_uuid((p->'validate')->>'n8n_function_id')
            or length((p->'validate')->>'n8n_function_id') between 1 and 128 )
    ));
$$;

create or replace function public.is_valid_node_actions_strict(p jsonb)
returns boolean language sql immutable as $$
  select
    jsonb_typeof(p)='object'
    and (not (p ? 'generate') or (
      jsonb_typeof(p->'generate')='object'
      and (p->'generate') ? 'n8n_function_id'
      and jsonb_typeof((p->'generate')->'n8n_function_id')='string'
      and ( public.is_uuid((p->'generate')->>'n8n_function_id')
            or length((p->'generate')->>'n8n_function_id') between 1 and 128 )
    ));
$$;

-- ["root.a", {"path":"root.b.c","optional":true}]
create or replace function public.is_valid_node_dependencies(p jsonb)
returns boolean language sql immutable as $$
  with els as (select e from jsonb_array_elements(coalesce(p,'[]'::jsonb)) e)
  select
    jsonb_typeof(coalesce(p,'[]'::jsonb))='array'
    and not exists (
      select 1 from els
      where not (
        (jsonb_typeof(e)='string' and public.is_valid_path_text(e #>> '{}'))
        or (
          jsonb_typeof(e)='object'
          and (e ? 'path') and jsonb_typeof(e->'path')='string'
          and public.is_valid_path_text(e->>'path')
          and (not (e ? 'optional') or jsonb_typeof(e->'optional')='boolean')
        )
      )
    );
$$;

-- Router into §2 + §3 + strict group
create or replace function public.is_valid_content_shape(node_type text, content jsonb)
returns boolean language sql immutable as $$
  select case
    when node_type = 'form'  then public.is_valid_form_content(content)
    when node_type = 'media' then public.is_valid_media_content(content)
    when node_type = 'group' then jsonb_typeof(content)='object' and content='{}'::jsonb
    else false
  end;
$$;

-- Normalizer: default missing "required" → false (used by trigger)
create or replace function public.form_default_required_false(j jsonb)
returns jsonb language sql immutable as $$
  select case
    when jsonb_typeof(j)='object' and (j ? 'items') and jsonb_typeof(j->'items')='array'
    then jsonb_set(
           j,'{items}',
           (select jsonb_agg(
                    case when not (e ? 'required')
                         then e || jsonb_build_object('required', false)
                         else e end)
            from jsonb_array_elements(j->'items') e))
    else j
  end;
$$;

-- Triggers
create or replace function public.t_storyboard_nodes_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.t_storyboard_nodes_parent_guard()
returns trigger language plpgsql as $$
declare
  p_job uuid;
  p_path ltree;
begin
  -- auto-flag sections at depth 2
  new.is_section := (nlevel(new.path) = 2);

  if new.parent_id is null then
    if nlevel(new.path) <> 2 then
      raise exception 'root-level nodes must have depth 2 (got %)', nlevel(new.path) using errcode='23514';
    end if;
    return new;
  end if;

  select n.job_id, n.path into p_job, p_path
  from public.storyboard_nodes n
  where n.id = new.parent_id;

  if p_job is null then
    raise exception 'parent_id % not found', new.parent_id using errcode='23503';
  end if;
  if p_job <> new.job_id then
    raise exception 'parent.job_id (%) does not match new.job_id (%)', p_job, new.job_id using errcode='23514';
  end if;
  if subpath(new.path, 0, nlevel(new.path)-1) <> p_path then
    raise exception 'parent.path (%) must equal immediate ancestor of child.path (%)', p_path::text, new.path::text using errcode='23514';
  end if;
  if nlevel(new.path) <> nlevel(p_path) + 1 then
    raise exception 'child path depth must be exactly one level deeper than parent' using errcode='23514';
  end if;

  return new;
end $$;

create or replace function public.t_storyboard_nodes_form_normalize()
returns trigger language plpgsql as $$
begin
  if new.node_type = 'form' then
    new.content := public.form_default_required_false(new.content);
  end if;
  return new;
end $$;

-- Attach triggers (safe re-create)
do $$
begin
  if exists (select 1 from pg_trigger where tgname='trg_storyboard_nodes_touch' and tgrelid='public.storyboard_nodes'::regclass) then
    execute 'drop trigger trg_storyboard_nodes_touch on public.storyboard_nodes';
  end if;
  execute 'create trigger trg_storyboard_nodes_touch before update on public.storyboard_nodes
           for each row execute function public.t_storyboard_nodes_touch()';

  if exists (select 1 from pg_trigger where tgname='trg_storyboard_nodes_parent_guard' and tgrelid='public.storyboard_nodes'::regclass) then
    execute 'drop trigger trg_storyboard_nodes_parent_guard on public.storyboard_nodes';
  end if;
  execute 'create trigger trg_storyboard_nodes_parent_guard before insert or update on public.storyboard_nodes
           for each row execute function public.t_storyboard_nodes_parent_guard()';

  if exists (select 1 from pg_trigger where tgname='trg_storyboard_nodes_form_normalize' and tgrelid='public.storyboard_nodes'::regclass) then
    execute 'drop trigger trg_storyboard_nodes_form_normalize on public.storyboard_nodes';
  end if;
  execute 'create trigger trg_storyboard_nodes_form_normalize before insert or update on public.storyboard_nodes
           for each row execute function public.t_storyboard_nodes_form_normalize()';
end $$;

-- Constraints (add if missing)
do $$
begin
  if not exists (select 1 from pg_constraint where conname='chk_sn_node_type' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint chk_sn_node_type check (node_type in ('form','group','media'))$$;
  end if;
  if not exists (select 1 from pg_constraint where conname='chk_sn_content_shape' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint chk_sn_content_shape check (public.is_valid_content_shape(node_type, content))$$;
  end if;
  if not exists (select 1 from pg_constraint where conname='chk_sn_edit_shape' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint chk_sn_edit_shape check (public.is_valid_node_edit_strict(edit))$$;
  end if;
  if not exists (select 1 from pg_constraint where conname='chk_sn_actions_shape' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint chk_sn_actions_shape check (public.is_valid_node_actions_strict(actions))$$;
  end if;
  if not exists (select 1 from pg_constraint where conname='chk_sn_deps_shape' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint chk_sn_deps_shape check (public.is_valid_node_dependencies(dependencies))$$;
  end if;
  if not exists (select 1 from pg_constraint where conname='chk_sn_version' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint chk_sn_version check (version >= 1)$$;
  end if;
end $$;

-- Deferred self-FK on parent (add if missing)
do $$
begin
  if not exists (select 1 from pg_constraint where conname='fk_storyboard_nodes_parent' and conrelid='public.storyboard_nodes'::regclass) then
    execute $$alter table public.storyboard_nodes
             add constraint fk_storyboard_nodes_parent
             foreign key (parent_id) references public.storyboard_nodes(id)
             deferrable initially deferred
             not valid$$;
    execute $$alter table public.storyboard_nodes validate constraint fk_storyboard_nodes_parent$$;
  end if;
end $$;

-- Indexes (safe)
create unique index if not exists ux_storyboard_nodes_job_path on public.storyboard_nodes(job_id, path);
create index if not exists ix_storyboard_nodes_job_type    on public.storyboard_nodes(job_id, node_type);
create index if not exists ix_storyboard_nodes_job_section on public.storyboard_nodes(job_id) where is_section = true;
```

---
# Section 4: Video_Jobs

## Purpose

`video_jobs` is the **top-level container** for a user’s video/storyboard session. It owns the lifecycle, billing/consent flags, and a lightweight `node_index` cache for fast lookup. **All actual content lives in `storyboard_nodes`** (nodes are authoritative). Nodes are created **on user request**.

## Simplified prose

* Jobs belong to either an authenticated **user** (`user_id`) or a **guest session** (`session_id`).
* Store only **metadata** on the job: `status`, `credits_used`, `watermark`, **consents**.
* Keep an optional **`node_index` cache**: `[{slot, path, node_id}]` for FE speed; never source of truth.
* **Stable addressing** is via `(job_id, path::ltree)` on `storyboard_nodes` (e.g., `root.user_input`, `root.movie_info`, `root.characters`).
* **RLS** should ensure callers can only read/write jobs they own (by `user_id` or `session_id`).

## Top-level contract

* **Authoritative data**: `storyboard_nodes` (one node per canonical slot; unique `(job_id, path)`).
* **Job states**: `status ∈ {draft, active, archived, error}`.
* **Consent**: `accepted_terms_at`, `accepted_ip_at` are set when the user explicitly accepts.
* **Rendering**: `watermark=true` for free outputs; flipped off after successful purchase.
* **Credits**: `credits_used` is cumulative for the job (update per generation step).
* **Indexing**: FE can list nodes via `node_index`, but must read/write fields via path APIs/RPCs to `storyboard_nodes`.
* **Timestamps**: `updated_at` auto-touches on any job update.
* **Creation**: Creating a job does **not** create nodes; FE/back-end creates nodes on demand.

## SQL definition

```sql
-- Table
create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  session_id text null,                  -- for guest ownership via RLS
  template_key text not null,            -- e.g. 'fight_scene' | 'trailer_v1'
  status text not null
    check (status in ('draft','active','archived','error'))
    default 'draft',
  credits_used integer not null default 0,
  watermark boolean not null default true,
  accepted_terms_at timestamptz null,
  accepted_ip_at timestamptz null,
  node_index jsonb not null default '[]'::jsonb,  -- [{slot,path,node_id}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_video_jobs_user_created
  on public.video_jobs(user_id, created_at desc);

create index if not exists idx_video_jobs_status_created
  on public.video_jobs(status, created_at desc);

-- Touch trigger
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_video_jobs_touch on public.video_jobs;
create trigger trg_video_jobs_touch
before update on public.video_jobs
for each row execute function public.tg_touch_updated_at();

-- Invariant on nodes (enforce one node per path per job)
create unique index if not exists ux_storyboard_nodes_job_path
  on public.storyboard_nodes(job_id, path);

-- (Optional) keep node_index cache in sync when nodes change
create or replace function public.refresh_job_node_index(p_job_id uuid)
returns void language sql as $$
  update public.video_jobs j
  set node_index = coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'slot', split_part(n.path::text, '.', 2), -- e.g. 'user_input'
        'path', n.path::text,
        'node_id', n.id
      ) order by n.path
    )
    from public.storyboard_nodes n
    where n.job_id = j.id
  ), '[]'::jsonb)
  where j.id = p_job_id;
$$;

create or replace function public.tg_nodes_refresh_index()
returns trigger language plpgsql as $$
begin
  perform public.refresh_job_node_index(coalesce(new.job_id, old.job_id));
  return coalesce(new, old);
end; $$;

drop trigger if exists trg_nodes_refresh_index_ins on public.storyboard_nodes;
create trigger trg_nodes_refresh_index_ins
after insert on public.storyboard_nodes
for each row execute function public.tg_nodes_refresh_index();

drop trigger if exists trg_nodes_refresh_index_upd on public.storyboard_nodes;
create trigger trg_nodes_refresh_index_upd
after update on public.storyboard_nodes
for each row execute function public.tg_nodes_refresh_index();

drop trigger if exists trg_nodes_refresh_index_del on public.storyboard_nodes;
create trigger trg_nodes_refresh_index_del
after delete on public.storyboard_nodes
for each row execute function public.tg_nodes_refresh_index();
```

> **RLS (outline):**
>
> * On `video_jobs`: allow `select/update` when `auth.uid() = user_id` **or** when request carries a trusted `session_id` matching the row (for guests).
> * On `storyboard_nodes`: allow access only when the parent job row is visible to the caller (`exists` join on `video_jobs`).

---

## Section 6: n8n Functions

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


## Section 9: Node Definitions

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

