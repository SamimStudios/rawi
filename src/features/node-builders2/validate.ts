import { z } from "zod";
import { FormContent, GroupContent, MediaContent } from "./ssot";

export function validateTemplate(node_type: string, content: any): { ok: boolean; why?: string } {
  try {
    if (node_type === "media") { MediaContent.parse(content); return { ok: true }; }
    if (node_type === "group") { GroupContent.parse(content); return { ok: true }; }
    if (node_type === "form")  { FormContent.parse(content); return { ok: true }; }
    return { ok: true }; // permissive for future types
  } catch (e: any) {
    const issue = e?.issues?.[0];
    return { ok: false, why: issue ? `${issue.path?.join(".")}: ${issue.message}` : String(e) };
  }
}
