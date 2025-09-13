# AI Scenes System Specification (Global Doc, Consolidated — Full)

This document is the **single reference** for schemas, constraints, contracts, and triggers across the AI Scenes system. Each section has four parts:

1. Purpose
2. Simplified prose
3. Top-level contract
4. SQL definition (collapsible)

---

## Section 1: Field Registry

### Purpose

- Central registry for reusable fields.
- Ensures strict typing, UI consistency, and defaulting.

### Simplified Prose

- **id**: UUID PK.
- **field\_id**: unique string identifier.
- **datatype**: `string|number|boolean|array|object|uuid|url|date|datetime`.
- **widget**: UI hint.
- **options**: JSON describing choices.
- **rules**: datatype-aware constraints.
- **ui**: `{label?, placeholder?, help?}` i18n-ready.
- **default\_value**: must match datatype and options.
- **version**: integer ≥1.
- **timestamps**: created\_at, updated\_at.

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

## Section 2: Storyboard Nodes

### Purpose

- Capture storyboard hierarchy.
- Store node content (fields, groups, media) and relationships.

### Simplified Prose

- **id**: UUID PK.
- **job\_id**: FK → storyboard\_jobs.id.
- **node\_type**: form|group|media.
- **path**: ltree path.
- **parent\_id**: FK self.
- **is\_section**: auto boolean.
- **content**: type-specific array.
- **edit**: has\_editables flag + optional validate.
- **actions**: generate function link.
- **dependencies**: array of paths.
- **timestamps**: created\_at, updated\_at.

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

- Top-level container for storyboard sessions.
- Owns nodes and progressive sections.

### Simplified Prose

- **id**: UUID PK.
- **user\_id**: FK auth.users.
- **session\_id**: optional string.
- **user\_input**, **movie\_info**, **characters**, **props**, **timeline**, **music** as JSON sections.
- Each section has updated\_at for staleness checks.

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

- Registry of orchestrator functions.
- Enforces contracts for requests, responses, and expected payload.

### Simplified Prose

- Each function defines name, type, price, webhooks, expected\_payload, success schema.
- `expected_payload` uses ltree selectors (strict except node\_path).
- Can be called by id or name.
- Auto-touch trigger for updated\_at.

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

- Define allowed asset categories.
- Standardize metadata.

### Simplified Prose

- Types: image, audio, video, file.
- Common: url, meta.
- Meta holds type-specific properties.

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

- Handle dependency freshness at runtime.
- Guide UI flags and validation.

### Simplified Prose

- Node marked stale if any dependency updated\_at > node.updated\_at.
- Validation payloads come from live UI + job\_id/node\_path.

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

## Appendix: Migration Order

1. Enable extensions.
2. Create validators.
3. Create tables & indexes.
4. Add constraints.
5. Attach triggers.
6. Add automation for dependencies if needed.

