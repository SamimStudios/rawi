import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client and forward auth for RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    // Extract node ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const nodeId = pathSegments[pathSegments.length - 1];

    if (!nodeId) {
      return new Response(
        JSON.stringify({ error: 'Node ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const ancestors = url.searchParams.get('ancestors') === '1';
    const children = url.searchParams.get('children') === '1';
    const descendants = url.searchParams.get('descendants') === '1';
    const depth = url.searchParams.get('depth') ? parseInt(url.searchParams.get('depth')!) : null;
    const types = url.searchParams.get('types')?.split(',') || null;
    const normalizedForms = url.searchParams.get('normalized_forms') === '1';

    console.log('Fetching node:', { nodeId, ancestors, children, descendants, depth, types, normalizedForms });

    // First, get the main node (prefer normalized view if available)
    let mainNode: any = null;

    if (normalizedForms) {
      const { data: normalizedNode } = await supabase
        .from('v_storyboard_forms_normalized')
        .select('*')
        .eq('id', nodeId)
        .maybeSingle();
      if (normalizedNode) mainNode = normalizedNode;
    }

    if (!mainNode) {
      const { data: rawNode, error: rawErr } = await supabase
        .from('storyboard_nodes')
        .select('*')
        .eq('id', nodeId)
        .maybeSingle();

      if (rawErr || !rawNode) {
        console.error('Main node error:', rawErr);
        return new Response(
          JSON.stringify({ error: 'Node not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      mainNode = rawNode;
    }


    const response = {
      node: mainNode,
      meta: {
        job_id: mainNode.job_id,
        count: 1
      }
    } as any;

    let allUpdatedAts = [mainNode.updated_at];

    // Get ancestors if requested
    if (ancestors && mainNode.path) {
      const segs = String(mainNode.path).split('.');
      const prefixes: string[] = [];
      for (let i = 1; i <= segs.length; i++) {
        prefixes.push(segs.slice(0, i).join('.'));
      }
      const targetSet = prefixes.filter(p => p !== mainNode.path);

      let { data: ancestorsData } = await supabase
        .from('storyboard_nodes')
        .select('*')
        .in('path', targetSet);

      ancestorsData = (ancestorsData || []).filter(n => (types ? types.includes(n.node_type) : true));

      // Order by nlevel(path) ASC (by segment count)
      ancestorsData.sort((a, b) => String(a.path).split('.').length - String(b.path).split('.').length);

      if (ancestorsData && ancestorsData.length) {
        response.ancestors = ancestorsData;
        allUpdatedAts.push(...ancestorsData.map(n => n.updated_at));
      }
    }

    // Get children if requested
    if (children) {
      let childrenQuery = supabase
        .from('storyboard_nodes')
        .select('*')
        .eq('parent_id', nodeId)
        .order('path', { ascending: true });

      if (normalizedForms) {
        childrenQuery = supabase
          .from('v_storyboard_forms_normalized')
          .select('*')
          .eq('parent_id', nodeId)
          .order('path', { ascending: true });
      }

      if (types) {
        childrenQuery = childrenQuery.in('node_type', types);
      }

      const { data: childrenData, error: childrenError } = await childrenQuery;
      
      if (!childrenError && childrenData) {
        response.children = childrenData;
        allUpdatedAts.push(...childrenData.map(n => n.updated_at));
      }
    }

    // Get descendants if requested
    if (descendants && mainNode.path) {
      // Fetch same job nodes and filter by path prefix client-side for reliable behavior
      const { data: sameJobNodes } = await supabase
        .from('storyboard_nodes')
        .select('*')
        .eq('job_id', mainNode.job_id)
        .order('path', { ascending: true });

      let descendantsData = (sameJobNodes || []).filter(n => String(n.path).startsWith(String(mainNode.path) + '.') && String(n.path) !== String(mainNode.path));

      if (typeof depth === 'number') {
        const baseDepth = String(mainNode.path).split('.').length;
        descendantsData = descendantsData.filter(n => String(n.path).split('.').length <= baseDepth + depth);
      }

      if (types) {
        descendantsData = descendantsData.filter(n => types.includes(n.node_type));
      }

      if (descendantsData.length) {
        response.descendants = descendantsData;
        allUpdatedAts.push(...descendantsData.map(n => n.updated_at));
      }
    }

    // Generate ETag from max updated_at
    const maxUpdatedAt = Math.max(...allUpdatedAts.map(d => new Date(d).getTime()));
    const etag = `W/"${maxUpdatedAt}"`;
    response.meta.etag = etag;
    response.meta.count = 1 + (response.ancestors?.length || 0) + (response.children?.length || 0) + (response.descendants?.length || 0);

    console.log('Response prepared:', { nodeId, count: response.meta.count });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'ETag': etag
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});