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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
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

    // First, get the main node
    let mainNodeQuery = normalizedForms 
      ? supabase.from('v_storyboard_forms_normalized').select('*').eq('id', nodeId).single()
      : supabase.from('storyboard_nodes').select('*').eq('id', nodeId).single();

    const { data: mainNode, error: mainError } = await mainNodeQuery;

    if (mainError || !mainNode) {
      console.error('Main node error:', mainError);
      return new Response(
        JSON.stringify({ error: 'Node not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      let ancestorsQuery = supabase
        .from('storyboard_nodes')
        .select('*')
        .textSearch('path', `@> ${mainNode.path}`)
        .neq('path', mainNode.path)
        .order('path', { ascending: true });

      if (types) {
        ancestorsQuery = ancestorsQuery.in('node_type', types);
      }

      const { data: ancestorsData, error: ancestorsError } = await ancestorsQuery;
      
      if (!ancestorsError && ancestorsData) {
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
      let descendantsQuery = supabase
        .from('storyboard_nodes')
        .select('*')
        .textSearch('path', `<@ ${mainNode.path}`)
        .neq('path', mainNode.path)
        .order('path', { ascending: true });

      if (normalizedForms) {
        descendantsQuery = supabase
          .from('v_storyboard_forms_normalized')
          .select('*')
          .textSearch('path', `<@ ${mainNode.path}`)
          .neq('path', mainNode.path)
          .order('path', { ascending: true });
      }

      if (types) {
        descendantsQuery = descendantsQuery.in('node_type', types);
      }

      // Apply depth limit if specified
      if (depth !== null && mainNode.path) {
        // This is a simplified depth check - in production you'd want to use nlevel() PostgreSQL function
        descendantsQuery = descendantsQuery.lte('path', `${mainNode.path}.${depth}`);
      }

      const { data: descendantsData, error: descendantsError } = await descendantsQuery;
      
      if (!descendantsError && descendantsData) {
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