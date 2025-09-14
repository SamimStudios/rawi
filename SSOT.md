# Rawi App System Specification (Global Doc, Consolidated — Full)

This document is the **single reference** for schemas, constraints, contracts, and triggers across the AI Scenes system. Each section has four parts:

1. Purpose
2. Simplified prose
3. Top-level contract
4. SQL definition (collapsible)

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

## Section 2: Storyboard Nodes

### Purpose

* Capture storyboard hierarchy.
* Store node content (fields, groups, media) and relationships.

### Simplified Prose

* **id**: UUID PK.
* **job\_id**: FK → storyboard\_jobs.id.
* **node\_type**: form|group|media.
* **path**: ltree path.
* **parent\_id**: FK self.
* **is\_section**: auto boolean.
* **content**: type-specific array.
* **edit**: has\_editables flag + optional validate.
* **actions**: generate function link.
* **dependencies**: array of paths.
* **timestamps**: created\_at, updated\_at.

### Top-Level Contract

```json
{
  "id": "uuid",
  "job_id": "uuid",
  "node_type": "form|group|media",
  "path": "ltree",
  "parent_id": "uuid|null",
  "content": [ { /* field/group/media */ } ],
  "edit": { "has_editables": true, "validate": {"n8n_function_id": "uuid"} },
  "actions": { "generate": {"n8n_function_id": "uuid"} },
  "dependencies": ["root.characters.lead", {"path":"root.props","optional":true}],
  "removable": true
}
```

### SQL Definition

```sql
-- see strict schema with constraints, triggers for parent guard, has_editables, is_section
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
