# AI Scenes System Specification (Global Doc, Consolidated — Full)

This document is the **single reference** for schemas, constraints, contracts, and triggers across the AI Scenes system. Each section has four parts:

1. Purpose
2. Simplified prose
3. Top-level contract
4. SQL definition (collapsible)

---

## Section 1: Field Registry

### Purpose

* Central registry for reusable fields.
* Ensures strict typing, UI consistency, and defaulting.

### Simplified Prose

* **id**: UUID PK.
* **field\_id**: unique string identifier.
* **datatype**: `string|number|boolean|array|object|uuid|url|date|datetime`.
* **widget**: UI hint.
* **options**: JSON describing choices.
* **rules**: datatype-aware constraints.
* **ui**: `{label?, placeholder?, help?}` i18n-ready.
* **default\_value**: must match datatype and options.
* **version**: integer ≥1.
* **timestamps**: created\_at, updated\_at.

### Top-Level Contract

```json
{
  "field_id": "string",
  "datatype": "string",
  "widget": "string",
  "options": { },
  "rules": { },
  "ui": { "label": "…", "placeholder": "…", "help": "…" },
  "default_value": "valid instance"
}
```

### SQL Definition

```sql
-- see existing strict schema with constraints and triggers
```

---

## Section 1.A: Field Options Schema (Detailed)

### Purpose
- Standardize `options` JSON used by widgets (selects, lookups, etc.).
- Support three sources: **static**, **endpoint**, **table**.
- Keep **closed sets** strict via Postgres enums while preserving JSON flexibility.

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
  - `where?`: array of `{ column: string, op: one of (eq, neq, gt, gte, lt, lte, like, ilike, in), value: any }`.
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
        "extras": { },
        "disabled": false
      }
    ],
    "dependsOn": [
      { "field": "string", "allow": ["string", "string"] }
    ],

    "url": "string",
    "method": "GET|POST|PUT|PATCH|DELETE",
    "query": { },
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
-- Enums (idempotent guards)
do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='string_format' and n.nspname='public'
  ) then
    create type public.string_format as enum ('none','email','phone','color','slug','uri','url');
  end if;
end$$;

do $$
declare v text;
begin
  foreach v in array array['none','email','phone','color','slug','uri','url'] loop
    begin execute format('alter type public.string_format add value %L', v);
    exception when duplicate_object then null;
    end;
  end loop;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='array_item_type' and n.nspname='public'
  ) then
    create type public.array_item_type as enum
      ('string','number','boolean','uuid','url','date','datetime','object');
  end if;
end$$;

do $$
declare v text;
begin
  foreach v in array array['string','number','boolean','uuid','url','date','datetime','object'] loop
    begin execute format('alter type public.array_item_type add value %L', v);
    exception when duplicate_object then null;
    end;
  end loop;
end$$;

-- Safe enum-membership helper
create or replace function public.in_enum(val text, etype anyenum)
returns boolean language sql immutable as $$
  select case
           when val is null then false
           else val = any (enum_range(etype)::text[])
         end;
$$;

-- Validator: returns true if rules JSON matches the datatype contract
create or replace function public.is_valid_rules(p jsonb, p_datatype text)
returns boolean
language sql immutable
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
      select 1
      from base b, jsonb_object_keys(b.j) k, t
      where case
        when t.is_str     then k not in ('minLength','maxLength','pattern','format')
        when t.is_num     then k not in ('minimum','maximum')
        when t.is_bool    then true
        when t.is_arr     then k not in ('minItems','maxItems','uniqueItems','itemType')
        when t.is_objtype then false   -- no key-level restriction for object
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
          (not (b.j ? 'minItems')     or jsonb_typeof(b.j->'minItems')     = 'number')
          and (not (b.j ? 'maxItems') or jsonb_typeof(b.j->'maxItems')     = 'number')
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

-- Optional table constraint (add first as NOT VALID, then validate)
-- alter table public.field_registry
--   add constraint chk_field_registry_rules
--   check (public.is_valid_rules(rules, datatype::text)) not valid;

-- -- Validate when ready:
-- alter table public.field_registry
--   validate constraint chk_field_registry_rules;
```

---

## Section 1.B: Field Rules Schema (Detailed)

### Purpose
- Standardize `rules` JSON per `datatype` for validation and UI hints.
- Use enums for closed sets (e.g., `format`, `itemType`) while keeping JSON flexible.
- Keep compatibility with existing rows and enforce via a single PG function + CHECK.

### Simplified Prose
- `rules` is a JSON object; allowed keys depend on `datatype`:
  - **string | uuid | url | date | datetime**:
    - Keys: `minLength?` (number ≥0), `maxLength?` (number ≥0), `pattern?` (string, regex), `format?` (enum).
    - `format` ∈ `string_format`: `none | email | phone | color | slug | uri | url`.
  - **number**:
    - Keys: `minimum?` (number), `maximum?` (number).
  - **boolean**:
    - Must be an **empty object** `{}` (no keys).
  - **array**:
    - Keys: `minItems?` (number ≥0), `maxItems?` (number ≥0), `uniqueItems?` (boolean), `itemType?` (enum).
    - `itemType` ∈ `array_item_type`: `string | number | boolean | uuid | url | date | datetime | object`.
  - **object**:
    - Any object allowed (pass-through today).
- Ranges: when both min/max exist, min ≤ max.

### Top-Level Contract
```json
{
  "rules": {
    // string-like datatypes
    "minLength": 0,
    "maxLength": 120,
    "pattern": "^[A-Za-z].*$",
    "format": "none|email|phone|color|slug|uri|url",

    // number
    "minimum": 0,
    "maximum": 100,

    // array
    "minItems": 1,
    "maxItems": 3,
    "uniqueItems": true,
    "itemType": "string|number|boolean|uuid|url|date|datetime|object"
  }
}
```

### SQL Definition

```sql
-- ENUMS (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='string_format' and n.nspname='public'
  ) then
    create type public.string_format as enum ('none','email','phone','color','slug','uri','url');
  end if;
end$$;

do $$
declare v text;
begin
  foreach v in array array['none','email','phone','color','slug','uri','url'] loop
    begin execute format('alter type public.string_format add value %L', v);
    exception when duplicate_object then null; end;
  end loop;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where t.typname='array_item_type' and n.nspname='public'
  ) then
    create type public.array_item_type as enum
      ('string','number','boolean','uuid','url','date','datetime','object');
  end if;
end$$;

do $$
declare v text;
begin
  foreach v in array array['string','number','boolean','uuid','url','date','datetime','object'] loop
    begin execute format('alter type public.array_item_type add value %L', v);
    exception when duplicate_object then null; end;
  end loop;
end$$;

-- Shared helper (safe if already created)
create or replace function public.in_enum(val text, etype anyenum)
returns boolean language sql immutable as $$
  select case when val is null then false
              else val = any (enum_range(etype)::text[]) end;
$$;

-- Validator
create or replace function public.is_valid_rules(p jsonb, p_datatype text)
returns boolean
language sql immutable
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
      select 1
      from base b, jsonb_object_keys(b.j) k, t
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
          (not (b.j ? 'minItems')     or jsonb_typeof(b.j->'minItems')     = 'number')
          and (not (b.j ? 'maxItems') or jsonb_typeof(b.j->'maxItems')     = 'number')
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

-- Optional table constraint for field_registry.rules
-- alter table public.field_registry
--   add constraint chk_field_registry_rules
--   check (public.is_valid_rules(rules, datatype::text)) not valid;
-- alter table public.field_registry validate constraint chk_field_registry_rules;
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

---

## Section 1.A: Field Options Schema (Detailed)

### Purpose
- Standardize `options` JSON used by widgets (selects, lookups, etc.).
- Support three sources: **static**, **endpoint**, **table**.
- Keep **closed sets** strict via Postgres enums while preserving JSON flexibility.

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
  - `where?`: array of `{ column: string, op: one of (eq, neq, gt, gte, lt, lte, like, ilike, in), value: any }`.
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
        "extras": { },
        "disabled": false
      }
    ],
    "dependsOn": [
      { "field": "string", "allow": ["string", "string"] }
    ],

    "url": "string",
    "method": "GET|POST|PUT|PATCH|DELETE",
    "query": { },
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
