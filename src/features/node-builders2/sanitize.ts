import { FormContent, GroupContent, MediaContent } from "./ssot";

const normDash = (s?: string) => (s ?? "").replace(/[\u2010-\u2015\u2212]/g, "-");

export function sanitizeForLibrary(node_type: string, content: any) {
  if (!content || typeof content !== "object") return content;

  if (node_type === "media" && content.kind === "MediaContent") {
    return MediaContent.parse({ ...content }); // accepts zero versions
  }

  if (node_type === "group" && content.kind === "GroupContent") {
    const c = { ...content };
    if ("instances" in c) delete (c as any).instances;
    c.children = Array.isArray(c.children) ? c.children.filter(Boolean).map(String) : [];
    return GroupContent.parse(c);
  }

  if (node_type === "form" && content.kind === "FormContent") {
    const c = { ...content };
    c.version = "v2-items"; // normalize
    // strip any instances recursively
    const scrub = (items: any[]): any[] =>
      (Array.isArray(items) ? items : []).map((it) => {
        if (it?.kind === "CollectionFieldItem") {
          const { instances, ...rest } = it;
          return rest;
        }
        if (it?.kind === "CollectionSection") {
          const { instances, children, ...rest } = it;
          return { ...rest, children: scrub(children || []) };
        }
        if (it?.kind === "SectionItem") {
          return { ...it, children: scrub(it.children || []) };
        }
        return it; // FieldItem etc.
      });
    c.items = scrub(c.items);
    // normalize weird dashes in version
    c.version = normDash(c.version) || "v2-items";
    return FormContent.parse(c);
  }

  // unknown types: return as-is
  return content;
}
