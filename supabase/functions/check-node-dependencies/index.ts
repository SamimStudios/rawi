import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DependencyCheckRequest {
  nodeId: string;
  jobId: string;
}

interface DependencyStatus {
  addr: string;
  isStale: boolean;
  lastUpdated?: string;
  dependencyUpdated?: string;
}

interface DependencyCheckResponse {
  nodeAddr: string;
  staleDependencies: DependencyStatus[];
  allFresh: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[check-node-dependencies] Processing dependency check...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nodeId, jobId }: DependencyCheckRequest = await req.json();

    console.log(`[check-node-dependencies] Checking dependencies for node ${nodeId} in job ${jobId}`);

    // Get node information with dependencies
    const { data: node, error: nodeError } = await supabase
      .from('app.nodes')
      .select('addr, dependencies, updated_at')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('[check-node-dependencies] Node fetch error:', nodeError);
      throw new Error(`Failed to fetch node: ${nodeError.message}`);
    }

    console.log(`[check-node-dependencies] Node ${node.addr} has dependencies:`, node.dependencies);

    if (!node.dependencies || node.dependencies.length === 0) {
      console.log('[check-node-dependencies] No dependencies to check');
      return new Response(JSON.stringify({
        nodeAddr: node.addr,
        staleDependencies: [],
        allFresh: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staleDependencies: DependencyStatus[] = [];
    const nodeUpdatedAt = new Date(node.updated_at);

    // Check each dependency
    for (const dep of node.dependencies) {
      const depPath = typeof dep === 'string' ? dep : dep.path;
      
      console.log(`[check-node-dependencies] Checking dependency: ${depPath}`);

      // Find dependency node by address
      const { data: depNode, error: depError } = await supabase
        .from('app.nodes')
        .select('addr, updated_at')
        .eq('job_id', jobId)
        .eq('addr', depPath)
        .single();

      if (depError) {
        console.error(`[check-node-dependencies] Dependency ${depPath} not found:`, depError);
        
        // Optional dependency - skip if not found
        if (typeof dep === 'object' && dep.optional) {
          console.log(`[check-node-dependencies] Skipping optional dependency: ${depPath}`);
          continue;
        }
        
        // Required dependency missing
        staleDependencies.push({
          addr: depPath,
          isStale: true,
          lastUpdated: undefined,
          dependencyUpdated: 'NOT_FOUND'
        });
        continue;
      }

      const depUpdatedAt = new Date(depNode.updated_at);
      const isStale = depUpdatedAt > nodeUpdatedAt;

      console.log(`[check-node-dependencies] Dependency ${depPath}: node=${nodeUpdatedAt.toISOString()}, dep=${depUpdatedAt.toISOString()}, stale=${isStale}`);

      if (isStale) {
        staleDependencies.push({
          addr: depPath,
          isStale: true,
          lastUpdated: nodeUpdatedAt.toISOString(),
          dependencyUpdated: depUpdatedAt.toISOString()
        });
      }
    }

    const response: DependencyCheckResponse = {
      nodeAddr: node.addr,
      staleDependencies,
      allFresh: staleDependencies.length === 0
    };

    console.log('[check-node-dependencies] Dependency check result:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[check-node-dependencies] Error:', error);
    return new Response(JSON.stringify({ 
      nodeAddr: 'unknown',
      staleDependencies: [],
      allFresh: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});