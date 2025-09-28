import { z } from "zod";

/** ===== SSOT: shared enums & node content ===== */

// Media
export const MediaVersion = z.object({
  kind: z.literal("MediaVersion"),
  idx: z.number().int().positive(),
  uri: z.string().url().optional().nullable(),
});
export type MediaVersion = z.infer<typeof MediaVersion>;

export const MediaContent = z.object({
  kind: z.literal("MediaContent"),
  path: z.string().min(1),
  type: z.enum(["image","video","audio","file"]),
  selected_version_idx: z.number().int().positive().optional(),
  versions: z.array(MediaVersion).optional(), // zero versions allowed
});
export type MediaContent = z.infer<typeof MediaContent>;

// Group
export const GroupCollection = z.object({
  min: z.number().int().nonnegative().optional(),
  max: z.number().int().positive().optional(),
  default_instances: z.number().int().nonnegative().optional(),
  allow_add: z.boolean().optional(),
  allow_remove: z.boolean().optional(),
  allow_reorder: z.boolean().optional(),
  label_template: z.string().optional(),
}).partial();
export type GroupCollection = z.infer<typeof GroupCollection>;

export const GroupContent = z.object({
  kind: z.literal("GroupContent"),
  path: z.string().min(1),
  label: z.any().optional(),
  description: z.any().optional(),
  children: z.array(z.string().min(1)), // library node ids
  collection: GroupCollection.optional(),
  // NO instances in library
});
export type GroupContent = z.infer<typeof GroupContent>;

// Form (template only)
const FieldItem = z.object({
  kind: z.literal("FieldItem"),
  idx: z.number().int().optional(),
  path: z.string().min(1),
  ref: z.string().min(1),
  required: z.boolean().optional(),
  editable: z.boolean().optional(),
  importance: z.enum(["low","normal","high"]).optional(),
  ui: z.any().optional(),
});

const SectionItem = z.object({
  kind: z.literal("SectionItem"),
  idx: z.number().int().optional(),
  path: z.string().min(1),
  label: z.any().optional(),
  required: z.boolean().optional(),
  children: z.array(z.lazy(() => FormItem)).default([]),
});

const CollectionFieldItem = z.object({
  kind: z.literal("CollectionFieldItem"),
  idx: z.number().int().optional(),
  path: z.string().min(1),
  ref: z.string().min(1),
  min_instances: z.number().int().nonnegative().optional(),
  max_instances: z.number().int().nonnegative().optional(),
  default_instances: z.number().int().nonnegative().optional(),
  // NO instances[] in library
  ui: z.any().optional(),
});

const CollectionSection = z.object({
  kind: z.literal("CollectionSection"),
  idx: z.number().int().optional(),
  path: z.string().min(1),
  label: z.any().optional(),
  min_instances: z.number().int().nonnegative().optional(),
  max_instances: z.number().int().nonnegative().optional(),
  default_instances: z.number().int().nonnegative().optional(),
  children: z.array(z.lazy(() => FormItem)).default([]),
  // NO instances[] in library
});

export const FormItem = z.discriminatedUnion("kind", [
  FieldItem, SectionItem, CollectionFieldItem, CollectionSection,
]);
export type FormItem = z.infer<typeof FormItem>;

export const FormContent = z.object({
  kind: z.literal("FormContent"),
  version: z.string().default("v2-items"), // normalized
  items: z.array(FormItem),
});
export type FormContent = z.infer<typeof FormContent>;

// Node Library row (minimal)
export const NodeLibraryRow = z.object({
  id: z.string().min(1),              // prefer lib_*
  node_type: z.enum(["media","group","form"]).or(z.string()),
  content: z.any(),
  version: z.number().int().optional(),
  active: z.boolean().optional(),
});
export type NodeLibraryRow = z.infer<typeof NodeLibraryRow>;
