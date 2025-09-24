import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Job {
  id: string;
  template_id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  user_input?: Record<string, any>;
  characters?: Record<string, any>;
  props?: Record<string, any>;
  timeline?: Record<string, any>;
  music?: Record<string, any>;
  movie_info?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface JobNode {
  id: string;
  job_id: string;
  path: string;
  node_type: 'form' | 'media' | 'group';
  library_id: string;
  content: Record<string, any>;
  user_data?: Record<string, any>;
  validation_status?: 'pending' | 'valid' | 'invalid';
  dependencies?: string[];
  parent_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobNodes, setJobNodes] = useState<JobNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
      setJobNodes(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job nodes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setLoading(true);
    setError(null);
    
    try {
      console.group('🚀 Creating job from template');
      console.log('Template ID:', templateId);
      console.log('Job Name:', jobName);

      // For now, create a basic job structure until we implement the RPC function
      const { data, error } = await supabase
        .schema('app' as any)
        .from('jobs')
        .insert({
          template_id: templateId,
          name: jobName,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }

      console.log('✅ Job created with ID:', data.id);
      console.groupEnd();

      toast({
        title: "Success",
        description: `Job "${jobName}" created successfully`,
      });

      return data.id as string;
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
  }, [toast]);

  const updateJobNode = useCallback(async (nodeId: string, userData: Record<string, any>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .update({ user_data: userData })
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
      // For now, return basic readiness check
      // TODO: Implement proper job_ready RPC call
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('validation_status')
        .eq('job_id', jobId);

      if (error) throw error;
      
      // Check if all nodes are valid
      const allValid = data?.every(node => node.validation_status === 'valid') || false;
      return allValid;
    } catch (err) {
      console.error('Error checking job readiness:', err);
      return false;
    }
  }, []);

  const getJobGenerationInput = useCallback(async (jobId: string): Promise<Record<string, any> | null> => {
    try {
      // For now, return aggregated user data from nodes
      // TODO: Implement proper job_generation_input RPC call
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('path, user_data')
        .eq('job_id', jobId);

      if (error) throw error;
      
      // Aggregate user data by path
      const generationData: Record<string, any> = {};
      data?.forEach(node => {
        if (node.user_data) {
          generationData[node.path] = node.user_data;
        }
      });
      
      return generationData;
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
  };
}