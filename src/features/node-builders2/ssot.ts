import { z } from "zod";

/** Shared */
export const CollectionConfig = z.object({
  min: z.number().int().nonnegative().optional(),
  max: z.number().int().positive().optional(),
  default_instances: z.number().int().nonnegative().optional(),
  allow_add: z.boolean().optional(),
  allow_remove: z.boolean().optional(),
  allow_reorder: z.boolean().optional(),
  label_template: z.string().optional(),
});
export type CollectionConfig = z.infer<typeof CollectionConfig>;

/** Media */
export const MediaVersion = z.object({
  kind: z.literal("MediaVersion"),
  idx: z.number().int().positive(),
  uri: z.string().url().optional().nullable(),
});
export type MediaVersion = z.infer<typeof MediaVersion>;

export const MediaContent = z.object({
  kind: z.literal("MediaContent"),
  path: z.string().min(1),
  type: z.enum(["image", "video", "audio", "file"]),
  selected_version_idx: z.number().int().positive().optional(),
  versions: z.array(MediaVersion).optional(), // zero versions allowed
});
export type MediaContent = z.infer<typeof MediaContent>;

/** Form (template-only, SSOT) */
export const FieldItem = z.object({
  kind: z.literal("FieldItem"),
  idx: z.number().int().optional(),
  path: z.string().min(1),
  ref: z.string().min(1),            // comes from app.field_registry.id
  required: z.boolean().optional(),
  editable: z.boolean().optional(),
  importance: z.enum(["low", "normal", "high"]).optional(),
  ui: z.any().optional(),
  // collection is OPTIONAL; instances[] never saved in library
  collection: CollectionConfig.optional(),
});
export type FieldItem = z.infer<typeof FieldItem>;

export const SectionItem = z.object({
  kind: z.literal("SectionItem"),
  idx: z.number().int().optional(),
  path: z.string().min(1),           // section key
  label: z.any().optional(),
  required: z.boolean().optional(),
  // exactly ONE of the following in library (SSOT):
  // - children[]  (single section)
  // - collection  (repeatable; instances[] belong to runtime only)
  children: z.array(z.lazy(() => FormItem)).optional(),
  collection: CollectionConfig.optional(),
}).refine(
  (s) => !!s.children !== !!s.collection, // XOR
  { message: "SectionItem must have exactly one of children[] or collection" }
);
export type SectionItem = z.infer<typeof SectionItem>;

export const FormItem = z.discriminatedUnion("kind", [FieldItem, SectionItem]);
export type FormItem = z.infer<typeof FormItem>;

export const FormContent = z.object({
  kind: z.literal("FormContent"),
  version: z.string().default("v2-items"),
  items: z.array(FormItem),
});
export type FormContent = z.infer<typeof FormContent>;

/** Group (template-only, SSOT) */
export const GroupContent = z.object({
  kind: z.literal("GroupContent"),
  path: z.string().min(1),
  label: z.any().optional(),
  description: z.any().optional(),
  children: z.array(z.string().min(1)),       // child LIB node ids
  collection: CollectionConfig.optional(),     // runtime repeats (instances exist only at runtime)
});
export type GroupContent = z.infer<typeof GroupContent>;

/** Node library row (minimal) */
export const NodeLibraryRow = z.object({
  id: z.string().min(1),              // prefer lib_*
  node_type: z.enum(["media","group","form"]).or(z.string()),
  content: z.any(),
  version: z.number().int().optional(),
  active: z.boolean().optional(),
});
export type NodeLibraryRow = z.infer<typeof NodeLibraryRow>;
