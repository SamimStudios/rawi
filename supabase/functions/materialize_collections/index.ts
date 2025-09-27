// supabase/functions/materialize_collections/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type UUID = string;
type NodeRow = { id: UUID; job_id: UUID; node_type: 'group'|'form'|'media'|'form_step'|string; content: any; title?: string|null; };

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

/* ---------- FORM: expand template-only to runtime instances ---------- */
function expandFormContentTemplate(content: any): any {
  if (!content || content.kind !== 'FormContent') return content;
  const out = clone(content);

  const scrubAndExpand = (items: any[]): any[] => (items || []).map((it: any) => {
    if (it.kind === 'FieldItem') {
      const c = clone(it);
      c.value = null;
      return c;
    }
    if (it.kind === 'CollectionFieldItem') {
      const N = Number(it.default_instances ?? it.min_instances ?? 0) || 0;
      const c = clone(it);
      c.instances = Array.from({ length: N }, (_, k) => ({
        instance_id: k + 1,
        path: `${c.path}.inst_${k + 1}`,
        value: null
      }));
      return c;
    }
    if (it.kind === 'SectionItem') {
      const c = clone(it);
      c.children = scrubAndExpand(c.children || []);
      return c;
    }
    if (it.kind === 'CollectionSection') {
      const N = Number(it.default_instances ?? it.min_instances ?? 0) || 0;
      const c = clone(it);
      const tplChildren = clone(c.children || []);
      c.instances = Array.from({ length: N }, (_, k) => ({
        instance_id: k + 1,
        path: `${c.path}.inst_${k + 1}`,
        children: rebaseChildren(tplChildren, `${c.path}.inst_${k + 1}`)
      }));
      return c;
    }
    return it;
  });

  const rebaseChildren = (children: any[], base: string): any[] => {
    const xs = clone(children);
    const renumber = (arr: any[], basePath: string) => {
      arr.forEach((c, idx) => {
        c.idx = idx + 1;
        const tail = (c.path || `item_${idx+1}`).split('.').pop();
        c.path = `${basePath}.${tail}`;
        if (c.kind === 'SectionItem') c.children = renumber(c.children || [], c.path);
        if (c.kind === 'CollectionSection') {
          // nested collection: template stays; build nested instances at next runtime step when needed
          c.instances = [];
          c.children = c.children || [];
        }
        if (c.kind === 'FieldItem') c.value = null;
      });
      return arr;
    };
    return renumber(xs, base);
  };

  out.items = scrubAndExpand(out.items || []);
  return out;
}

/* ---------- GROUP: clone template children from node_library ---------- */
async function cloneLibraryNodeToJob(libraryId: UUID, jobId: UUID): Promise<UUID> {
  const { data: lib, error } = await supabase
    .schema('app')
    .from('node_library')
    .select('id, node_type, content, title')
    .eq('id', libraryId)
    .single();
  if (error || !lib) throw error ?? new Error('library node not found');

  const insert = {
    job_id: jobId,
    node_type: lib.node_type,
    title: lib.title,
    content: lib.content,
    status: 'idle' as const,
  };
  const { data: created, error: insErr } = await supabase
    .schema('app')
    .from('nodes')
    .insert(insert)
    .select('id')
    .single();
  if (insErr) throw insErr;
  return created!.id as UUID;
}

async function fetchNode(id: UUID): Promise<NodeRow> {
  const { data, error } = await supabase
    .schema('app')
    .from('nodes')
    .select('id, job_id, node_type, content, title')
    .eq('id', id)
    .single();
  if (error || !data) throw error ?? new Error('node not found');
  return data as NodeRow;
}

async function updateNodeContent(id: UUID, content: any): Promise<void> {
  const { error } = await supabase.schema('app').from('nodes').update({ content }).eq('id', id);
  if (error) throw error;
}

async function expandGroupNode(nodeId: UUID): Promise<void> {
  const node = await fetchNode(nodeId);
  const c = clone(node.content || {});
  const isCollection = !!c?.collection;

  if (!isCollection) return; // nothing to expand

  const N = Number(c.collection?.default_instances ?? c.collection?.min ?? 0) || 0;
  const templateChildren: UUID[] = Array.isArray(c.children) ? c.children : [];
  const jobId = node.job_id;

  c.instances = [];
  for (let i = 1; i <= N; i++) {
    const newChildIds: UUID[] = [];
    for (const libId of templateChildren) {
      const newId = await cloneLibraryNodeToJob(libId, jobId);
      newChildIds.push(newId);

      // Recursively expand if cloned child is group/form
      const child = await fetchNode(newId);
      if (child.node_type === 'group') {
        await expandGroupNode(child.id);
      } else if (child.node_type === 'form') {
        const newForm = expandFormContentTemplate(child.content);
        await updateNodeContent(child.id, newForm);
      }
    }
    c.instances.push({ i, idx: i, children: newChildIds });
  }
  // keep c.children as the template or remove it; renderer can read instances
  // delete c.children;

  await updateNodeContent(nodeId, c);
}

/* ---------- entry ---------- */
Deno.serve(async (req) => {
  try {
    const { job_id, node_ids } = await req.json() as { job_id: UUID; node_ids: UUID[]; };

    for (const id of node_ids) {
      const node = await fetchNode(id);
      if (node.job_id !== job_id) throw new Error(`node ${id} does not belong to job ${job_id}`);

      if (node.node_type === 'group') {
        await expandGroupNode(id);
      } else if (node.node_type === 'form') {
        const newForm = expandFormContentTemplate(node.content);
        await updateNodeContent(id, newForm);
      }
      // media/others: no-op
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500 });
  }
});
