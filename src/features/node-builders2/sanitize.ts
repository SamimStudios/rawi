import { FormContent, GroupContent, MediaContent, FormItem } from "./ssot";

const normDash = (s?: string) => (s ?? "").replace(/[\u2010-\u2015\u2212]/g, "-");

function stripInstances(item: any): any {
  if (!item || typeof item !== "object") return item;
  if (item.kind === "FieldItem") {
    const { instances, ...rest } = item;
    return rest;
  }
  if (item.kind === "SectionItem") {
    const { instances, children, ...rest } = item;
    if (rest.collection) return rest;          // collection section (no children in library)
    return { ...rest, children: (children || []).map(stripInstances) };
  }
  return item;
}

export function sanitizeForLibrary(node_type: string, content: any) {
  if (!content || typeof content !== "object") return content;

  if (node_type === "media" && content.kind === "MediaContent") {
    return MediaContent.parse({ ...content });
  }

  if (node_type === "group" && content.kind === "GroupContent") {
    const c = { ...content };
    if ("instances" in c) delete (c as any).instances;
    c.children = Array.isArray(c.children) ? c.children.filter(Boolean).map(String) : [];
    return GroupContent.parse(c);
  }

  if (node_type === "form" && content.kind === "FormContent") {
    const c = { ...content };
    c.version = "v2-items";
    c.items = (Array.isArray(c.items) ? c.items : []).map(stripInstances) as FormItem[];
    c.version = normDash(c.version) || "v2-items";
    return FormContent.parse(c);
  }

  return content;
}
