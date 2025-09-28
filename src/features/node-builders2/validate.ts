import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { NodeLibraryRow } from "./ssot";
import { sanitizeForLibrary } from "./sanitize";
import { validateTemplate } from "./validate";

const log = (label: string, obj: any) => { try { console.log(label, JSON.stringify(obj, null, 2)); } catch { console.log(label, obj); } };

export function useNodeLibrary2() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (row: NodeLibraryRow) => {
    setSaving(true);
    try {
      const id = row.id.startsWith("lib_") ? row.id : `lib_${row.id}`;
      const content = sanitizeForLibrary(row.node_type, row.content);
      const v = validateTemplate(row.node_type, content);
      log("🧪 validateTemplate", v);
      if (!v.ok) throw new Error(`Invalid template: ${v.why}`);

      // existence check → insert or update
      const { data: existing, error: exErr } = await supabase.schema("app" as any).from("node_library").select("id").eq("id", id);
      if (exErr) throw exErr;
      const payload: any = { id, node_type: row.node_type, content };

      let dbErr: any = null;
      if (existing && existing.length) {
        const { error } = await supabase.schema("app" as any).from("node_library").update(payload).eq("id", id);
        dbErr = error || null;
      } else {
        const { error } = await supabase.schema("app" as any).from("node_library").insert(payload);
        dbErr = error || null;
      }

      if (dbErr) {
        const msg = String(dbErr?.message || "");
        const needsVersion = /"version"/i.test(msg);
        const needsActive  = /"active"/i.test(msg);
        if (needsVersion || needsActive) {
          payload.version = (row as any).version ?? 1;
          payload.active  = (row as any).active ?? true;
          if (existing && existing.length) {
            const { error } = await supabase.schema("app" as any).from("node_library").update(payload).eq("id", id);
            if (error) throw error;
          } else {
            const { error } = await supabase.schema("app" as any).from("node_library").insert(payload);
            if (error) throw error;
          }
        } else {
          log("❌ DB error object", dbErr);
          throw dbErr;
        }
      }

      toast({ title: "Saved", description: `${id} updated` });
      return id;
    } catch (e: any) {
      toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" });
      throw e;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  return { save, saving };
}
