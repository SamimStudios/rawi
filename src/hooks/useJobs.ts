import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Job {
  id: string;
  user_id: string;
  session_id?: string;
  status: string;
  category?: string;
  template?: string;
  credits_used: number;
  nodes?: string[];
  final_output?: Record<string, any>;
  name?: string; // Add name for compatibility
  created_at?: string;
  updated_at?: string;
}

export interface JobNode {
  id: string;
  idx: number;
  job_id: string;
  node_type: string;
  path: string;
  parent_id?: string;
  content: Record<string, any>;
  dependencies: string[];
  removable: boolean;
  validate_n8n_id?: string;
  generate_n8n_id?: string;
  arrangeable: boolean;
  path_ltree?: any;
  addr?: any;
  library_id?: string;
  validation_status?: 'pending' | 'valid' | 'invalid';
  created_at?: string;
  updated_at?: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobNodes, setJobNodes] = useState<JobNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeUpdatedAtMap, setNodeUpdatedAtMap] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('jobs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobNodes = useCallback(async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('*')
        .eq('job_id', jobId)
        .order('path');

      if (error) throw error;
      const nodes = data || [];
      setJobNodes(nodes);
      
      // Update the nodeUpdatedAtMap for stale detection
      const newMap = new Map<string, string>();
      nodes.forEach(node => {
        if (node.addr && node.updated_at) {
          newMap.set(node.addr, node.updated_at);
        }
      });
      setNodeUpdatedAtMap(newMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job nodes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadNode = useCallback(async (jobId: string, nodeId: string) => {
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('*')
        .eq('id', nodeId)
        .single();

      if (error) throw error;
      
      // Update the specific node in jobNodes
      setJobNodes(prev => prev.map(node => 
        node.id === nodeId ? data : node
      ));
      
      // Update the nodeUpdatedAtMap for stale detection
      if (data.addr && data.updated_at) {
        setNodeUpdatedAtMap(prev => new Map(prev).set(data.addr, data.updated_at));
      }
    } catch (err) {
      console.error('Error reloading node:', err);
    }
  }, []);

  const getNodeUpdatedAt = useCallback((addr: string): string | undefined => {
    return nodeUpdatedAtMap.get(addr);
  }, [nodeUpdatedAtMap]);

  const getJob = useCallback(async (jobId: string): Promise<Job | null> => {
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as Job || null;
    } catch (err) {
      console.error('Error fetching job:', err);
      return null;
    }
  }, []);

  const createJobFromTemplate = useCallback(async (templateId: string, jobName: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create jobs",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.group('🚀 Creating job from template');
      console.log('Template ID:', templateId);
      console.log('Job Name:', jobName);
      console.log('User ID:', user.id);

      // Generate a session ID for this job
      const sessionId = crypto.randomUUID();
      
      // Use app schema RPC call with type assertion
      const { data, error } = await (supabase as any)
        .schema('app')
        .rpc('instantiate_template', {
          p_template_id: templateId,
          p_user_id: user.id,
          p_session_id: sessionId
        });

      if (error) {
        console.error('❌ RPC error:', error);
        throw error;
      }

      console.log('✅ Job created with ID:', data);
      console.groupEnd();

      toast({
        title: "Success",
        description: `Job "${jobName}" created successfully`,
      });

      return data as string;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job from template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.groupEnd();
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  const updateJobNode = useCallback(async (nodeId: string, content: Record<string, any>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .update({ content })
        .eq('id', nodeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Node updated successfully",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update node';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkJobReady = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any)
        .schema('app')
        .rpc('job_ready', {
          p_job_id: jobId
        });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error checking job readiness:', err);
      return false;
    }
  }, []);

  const getJobGenerationInput = useCallback(async (jobId: string): Promise<Record<string, any> | null> => {
    try {
      const { data, error } = await (supabase as any)
        .schema('app')
        .rpc('job_generation_input', {
          p_job_id: jobId
        });

      if (error) throw error;
      return data || null;
    } catch (err) {
      console.error('Error getting job generation input:', err);
      return null;
    }
  }, []);

  return {
    jobs,
    jobNodes,
    loading,
    error,
    fetchJobs,
    fetchJobNodes,
    getJob,
    createJobFromTemplate,
    updateJobNode,
    checkJobReady,
    getJobGenerationInput,
    reloadNode,
    getNodeUpdatedAt,
  };
}