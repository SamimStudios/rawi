/* ============================================================================
 * addresses.ts
 * Canonical address helpers for AI Scenes node renderer
 *
 * Address shape:  <nodeAddr>#<json_subpath>
 * - nodeAddr: ltree-like string starting with "root" (e.g., "root.user_input")
 * - json_subpath: dot selectors only (no bracket indexes)
 *
 * Conventions (SSOT):
 * - Fields addressed by FieldItem.ref
 * - Sections addressed by SectionItem.path
 * - Collections addressed with `.instances.iN` (1-based, e.g., i1, i2)
 * - Media versions addressed with `.versions.iN`, single `item` per version
 * - DO NOT use array numeric indexes in addresses
 * ========================================================================== */

//// Types ////////////////////////////////////////////////////////////////////

/** Rooted ltree-like address (must start with "root"). */
export type NodeAddr = `root${string}`;

/** Full address string "<nodeAddr>#<json_subpath>" */
export type Address = `${NodeAddr}#${string}`;

/** Field ref (DB: app.field_registry.id); kept simple here with a label-ish check */
export type FieldRef = string;

/** Section key = SectionItem.path (must be unique within the form) */
export type SectionPath = string;

/** 1-based instance number */
export type InstanceN = number;

/** Safe string brand for `.instances.iN` tokens */
export type InstanceToken = `i${number}`;

//// Validation & formatting //////////////////////////////////////////////////

const LTREE_ADDR_RE = /^root(\.[A-Za-z0-9_]+)*$/;
const LABEL_RE = /^[A-Za-z][A-Za-z0-9_]*$/; // tolerant, matches path-label style

export function assertNodeAddr(addr: string): asserts addr is NodeAddr {
  if (!LTREE_ADDR_RE.test(addr)) {
    throw new Error(`Invalid node addr "${addr}". Must start with "root" and use dot-separated labels.`);
  }
}

export function assertLabel(label: string, kind: 'fieldRef' | 'sectionPath'): void {
  if (!LABEL_RE.test(label)) {
    throw new Error(`Invalid ${kind} "${label}". Must be label-like (A–Z, 0–9, underscore; start with a letter).`);
  }
}

export function iToken(n: InstanceN): InstanceToken {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Instance index must be >= 1, got ${n}`);
  return `i${n}`;
}

//// Address join/parse ///////////////////////////////////////////////////////

export function join(addr: NodeAddr, subpath: string): Address {
  assertNodeAddr(addr);
  if (!subpath || subpath.startsWith('#')) {
    throw new Error(`Invalid subpath "${subpath}". Must be a non-empty JSON path without leading '#'.`);
  }
  return `${addr}#${subpath}`;
}

export function parse(address: string): { nodeAddr: NodeAddr; subpath: string } {
  const [nodeAddr, subpath] = address.split('#');
  if (!nodeAddr || subpath === undefined) throw new Error(`Invalid address "${address}". Expected "<nodeAddr>#<json_subpath>".`);
  assertNodeAddr(nodeAddr);
  return { nodeAddr: nodeAddr as NodeAddr, subpath };
}

//// Node-level ///////////////////////////////////////////////////////////////

export const NodeAddrPath = {
  content: (addr: NodeAddr) => join(addr, `content`),
  validationStatus: (addr: NodeAddr) => join(addr, `validation_status`),
  generationStatus: (addr: NodeAddr) => join(addr, `generation_status`),
};

//// Form: fields & sections //////////////////////////////////////////////////

export const FormAddr = {
  // Field (non-collection)
  fieldRoot(addr: NodeAddr, fieldRef: FieldRef) {
    assertNodeAddr(addr); assertLabel(fieldRef, 'fieldRef');
    return join(addr, `content.items.${fieldRef}`);
  },
  fieldValue(addr: NodeAddr, fieldRef: FieldRef) {
    assertNodeAddr(addr); assertLabel(fieldRef, 'fieldRef');
    return join(addr, `content.items.${fieldRef}.value`);
  },

  // Field (collection)
  fieldInstanceRoot(addr: NodeAddr, fieldRef: FieldRef, n: InstanceN) {
    assertNodeAddr(addr); assertLabel(fieldRef, 'fieldRef');
    return join(addr, `content.items.${fieldRef}.instances.${iToken(n)}`);
  },
  fieldInstanceValue(addr: NodeAddr, fieldRef: FieldRef, n: InstanceN) {
    assertNodeAddr(addr); assertLabel(fieldRef, 'fieldRef');
    return join(addr, `content.items.${fieldRef}.instances.${iToken(n)}.value`);
  },

  // Section (non-collection)
  sectionRoot(addr: NodeAddr, sectionPath: SectionPath) {
    assertNodeAddr(addr); assertLabel(sectionPath, 'sectionPath');
    return join(addr, `content.items.${sectionPath}`);
  },
  sectionFieldValue(addr: NodeAddr, sectionPath: SectionPath, fieldRef: FieldRef) {
    assertNodeAddr(addr); assertLabel(sectionPath, 'sectionPath'); assertLabel(fieldRef, 'fieldRef');
    return join(addr, `content.items.${sectionPath}.children.${fieldRef}.value`);
  },

  // Section (collection)
  sectionInstanceRoot(addr: NodeAddr, sectionPath: SectionPath, n: InstanceN) {
    assertNodeAddr(addr); assertLabel(sectionPath, 'sectionPath');
    return join(addr, `content.items.${sectionPath}.instances.${iToken(n)}`);
  },
  sectionInstanceFieldValue(addr: NodeAddr, sectionPath: SectionPath, n: InstanceN, fieldRef: FieldRef) {
    assertNodeAddr(addr); assertLabel(sectionPath, 'sectionPath'); assertLabel(fieldRef, 'fieldRef');
    return join(addr, `content.items.${sectionPath}.instances.${iToken(n)}.children.${fieldRef}.value`);
  },
};

//// Media ////////////////////////////////////////////////////////////////////

export const MediaAddr = {
  versions: (addr: NodeAddr) => join(addr, `content.versions`),
  version: (addr: NodeAddr, n: InstanceN) => join(addr, `content.versions.${iToken(n)}`),
  versionItem: (addr: NodeAddr, n: InstanceN) => join(addr, `content.versions.${iToken(n)}.item`),
  selectedVersionIdx: (addr: NodeAddr) => join(addr, `content.selected_version_idx`),
};

//// Group (optional helpers for renderer completeness) ///////////////////////

export const GroupAddr = {
  children: (addr: NodeAddr) => join(addr, `content.children`), // Regular group
  instance: (addr: NodeAddr, n: InstanceN) => join(addr, `content.instances.${iToken(n)}`), // Collection group
  instanceChildren: (addr: NodeAddr, n: InstanceN) => join(addr, `content.instances.${iToken(n)}.children`),
};

//// Utilities ////////////////////////////////////////////////////////////////

/** Returns true if a string looks like a full Address ("root...#..."). */
export function isAddress(s: string): s is Address {
  const hash = s.indexOf('#');
  if (hash <= 0) return false;
  const nodeAddr = s.slice(0, hash);
  return LTREE_ADDR_RE.test(nodeAddr);
}

/** Extracts the `.instances.iN` number (1-based) from "...instances.iN..." segments. */
export function parseInstanceToken(token: string): InstanceN | null {
  const m = /^i(\d+)$/.exec(token);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/** Append an `.instances.iN` segment to an Address subpath (helper). */
export function appendInstance(address: Address, n: InstanceN): Address {
  const { nodeAddr, subpath } = parse(address);
  return join(nodeAddr, `${subpath}.instances.${iToken(n)}`);
}

/** Replace the last `.iN` in an address with a new N (useful on reindex). */
export function replaceLastInstance(address: Address, n: InstanceN): Address {
  const { nodeAddr, subpath } = parse(address);
  const replaced = subpath.replace(/\.i\d+(?=(\.|$))/, `.${iToken(n)}`);
  if (replaced === subpath) {
    throw new Error(`No .iN segment found in address "${address}" to replace.`);
  }
  return join(nodeAddr, replaced);
}

/** Compose a field address for either single or instance form. */
export function fieldValueAddr(
  addr: NodeAddr,
  fieldRef: FieldRef,
  n?: InstanceN
): Address {
  return typeof n === 'number'
    ? FormAddr.fieldInstanceValue(addr, fieldRef, n)
    : FormAddr.fieldValue(addr, fieldRef);
}

/** Compose a section field address for either single or instance form. */
export function sectionFieldValueAddr(
  addr: NodeAddr,
  sectionPath: SectionPath,
  fieldRef: FieldRef,
  n?: InstanceN
): Address {
  return typeof n === 'number'
    ? FormAddr.sectionInstanceFieldValue(addr, sectionPath, n, fieldRef)
    : FormAddr.sectionFieldValue(addr, sectionPath, fieldRef);
}

//// Example usage (remove in production if desired) //////////////////////////
// const a1 = FormAddr.fieldValue('root.user_input', 'title'); // root.user_input#content.items.title.value
// const a2 = FormAddr.fieldInstanceValue('root.user_input', 'tags', 2); // ...items.tags.instances.i2.value
// const a3 = FormAddr.sectionInstanceFieldValue('root.user_input', 'shots', 1, 'shot_title'); // ...items.shots.instances.i1.children.shot_title.value
// const m1 = MediaAddr.versionItem('root.trailer_media', 3); // ...content.versions.i3.item
