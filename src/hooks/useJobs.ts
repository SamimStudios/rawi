import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

/** Keep the shape you were already using */
export interface Job {
  id: string;
  user_id: string;
  session_id?: string | null;
  status: string;
  category?: string | null;
  template?: string | null;
  credits_used: number;
  nodes?: string[];
  final_output?: Record<string, any>;
  name?: string;           // legacy compat
  job_name?: string | null; // new column we added
  created_at?: string;
  updated_at?: string;
}

export interface JobNode {
  id: string;
  job_id: string;
  node_type: 'form' | 'group' | 'media' | string;
  path: string;
  addr?: string;
  parent_addr?: string | null;
  content: any;
  dependencies?: string[] | null;
  arrangeable?: boolean | null;
  removable?: boolean | null;
  library_id?: string | null;
  idx?: number | null;
  validate_n8n_id?: string | null;
  generate_n8n_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobNodes, setJobNodes] = useState<JobNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  /** Fetch all jobs for current user (kept generic; adjust filter if needed) */
  const fetchJobs = useCallback(async () => {
    console.group('[Jobs] ▶ fetchJobs');
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as any as Job[]);
      console.debug('[Jobs] ✅ jobs:', data?.length ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(msg);
      console.error('[Jobs] ❌', msg);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  /** Fetch nodes for a job */
  const fetchJobNodes = useCallback(async (jobId: string) => {
    console.group('[Jobs] ▶ fetchJobNodes');
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('*')
        .eq('job_id', jobId)
        .order('path', { ascending: true });

      if (error) throw error;
      setJobNodes((data || []) as any as JobNode[]);
      console.debug('[Jobs] ✅ nodes:', data?.length ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch job nodes';
      setError(msg);
      console.error('[Jobs] ❌', msg);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  /** Get one job row (convenience) */
  const getJob = useCallback(async (jobId: string): Promise<Job | null> => {
    console.group('[Jobs] ▶ getJob', jobId);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (error) throw error;
      console.debug('[Jobs] ✅ job:', (data as any)?.id);
      return (data as any as Job) ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get job';
      console.error('[Jobs] ❌', msg);
      setError(msg);
      return null;
    } finally {
      console.groupEnd();
    }
  }, []);

  /**
   * Create a job from a template using the new SSOT-aligned RPC:
   *   app.instantiate_job(p_template_id, p_user_id, p_session_id?, p_job_name?)
   *
   * Backward compatible signature:
   *   createJobFromTemplate(templateId, jobNameString)
   * or
   *   createJobFromTemplate(templateId, { jobName, sessionId, userId })
   */
  const createJobFromTemplate = useCallback(
    async (
      templateId: string,
      arg?: string | { jobName?: string | null; sessionId?: string | null; userId?: string | null }
    ): Promise<string> => {
      console.group('[Jobs] ▶ createJobFromTemplate');
      console.debug('templateId:', templateId, 'arg:', arg);

      setLoading(true);
      setError(null);

      // Unify args
      const jobName = typeof arg === 'string' ? arg : (arg?.jobName ?? null);
      const explicitUserId = typeof arg === 'object' ? (arg.userId ?? null) : null;
      const explicitSessionId = typeof arg === 'object' ? (arg.sessionId ?? null) : null;

      try {
        // Resolve user id → prefer explicit, else from auth hook, else Supabase auth
        let userId = explicitUserId ?? user?.id ?? null;
        if (!userId) {
          const { data } = await supabase.auth.getUser();
          userId = data?.user?.id ?? null;
        }
        if (!userId) throw new Error('No user id available to create a job.');

        // Use explicit session ID if provided (for guest sessions), otherwise null
        const sessionId = explicitSessionId ?? null;

        // New RPC payload
        const payloadNew = {
          p_template_id: templateId,
          p_user_id: userId,
          p_session_id: sessionId,
          p_job_name: (jobName ?? '').trim() || null,
        };

        // Try new RPC
        const { data: newId, error: newErr } = await supabase
          .schema('app' as any)
          .rpc('instantiate_job', payloadNew);

        if (!newErr && newId) {
          console.debug('[Jobs] ✅ instantiate_job OK → job_id:', newId);

          if ((jobName ?? '').trim()) {
            toast({ title: 'Success', description: `Job “${jobName}” created successfully` });
          } else {
            toast({ title: 'Success', description: 'Job created successfully' });
          }

          return String(newId);
        }

        console.warn('[Jobs] ⚠ instantiate_job failed, falling back…', newErr);

        // Legacy fallback: wrapper might be named 'instantiate_template' taking (template_id, user_id, session_id)
        const payloadOld = {
          p_template_id: templateId,
          p_user_id: userId,
          p_session_id: sessionId,
        };

        const { data: oldId, error: oldErr } = await supabase
          .schema('app' as any)
          .rpc('instantiate_template', payloadOld);

        if (oldErr || !oldId) {
          console.error('[Jobs] ❌ instantiate_template failed:', oldErr);
          throw (oldErr ?? newErr ?? new Error('Failed to create job from template'));
        }

        // If we fell back, persist job_name via direct update
        if ((jobName ?? '').trim()) {
          const { error: nameErr } = await supabase
.schema('app' as any)
            .from('jobs')
            .update({ job_name: (jobName ?? '').trim() })
            .eq('id', oldId);

          if (nameErr) {
            console.warn('[Jobs] ⚠ failed to set job_name after legacy create:', nameErr);
          }
        }

        console.debug('[Jobs] ✅ instantiate_template OK → job_id:', oldId);
        toast({
          title: 'Success',
          description: (jobName ?? '').trim()
            ? `Job “${jobName}” created successfully`
            : 'Job created successfully',
        });
        return String(oldId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create job from template';
        setError(msg);
        console.error('[Jobs] ❌', msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        throw err;
      } finally {
        setLoading(false);
        console.groupEnd();
      }
    },
    [toast, user?.id]
  );

  /** Update a single node's content (kept simple; DB trigger should validate SSOT) */
  const updateJobNode = useCallback(async (nodeId: string, content: any) => {
    console.group('[Jobs] ▶ updateJobNode', nodeId);
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .update({ content })
        .eq('id', nodeId);

      if (error) throw error;
      console.debug('[Jobs] ✅ node updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update node';
      setError(msg);
      console.error('[Jobs] ❌', msg);
      throw err;
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  /** Ask server if job is ready */
  const checkJobReady = useCallback(async (jobId: string): Promise<boolean> => {
    console.group('[Jobs] ▶ checkJobReady', jobId);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .rpc('job_ready', { p_job_id: jobId });

      if (error) throw error;
      console.debug('[Jobs] ✅ ready:', data);
      return !!data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to check job readiness';
      console.error('[Jobs] ❌', msg);
      setError(msg);
      return false;
    } finally {
      console.groupEnd();
    }
  }, []);

  /** Get generation payload preview */
  const getJobGenerationInput = useCallback(async (jobId: string): Promise<any> => {
    console.group('[Jobs] ▶ getJobGenerationInput', jobId);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .rpc('job_generation_input', { p_job_id: jobId });

      if (error) throw error;
      console.debug('[Jobs] ✅ generation input received');
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get generation input';
      console.error('[Jobs] ❌', msg);
      setError(msg);
      return null;
    } finally {
      console.groupEnd();
    }
  }, []);

  /** Reload one node */
  const reloadNode = useCallback(async (nodeId: string): Promise<JobNode | null> => {
    console.group('[Jobs] ▶ reloadNode', nodeId);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('*')
        .eq('id', nodeId)
        .maybeSingle();

      if (error) throw error;
      console.debug('[Jobs] ✅ node reloaded');
      return (data as any as JobNode) ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reload node';
      console.error('[Jobs] ❌', msg);
      setError(msg);
      return null;
    } finally {
      console.groupEnd();
    }
  }, []);

  /** Convenience: fetch only updated_at for a node */
  const getNodeUpdatedAt = useCallback(async (nodeId: string): Promise<string | null> => {
    console.group('[Jobs] ▶ getNodeUpdatedAt', nodeId);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('nodes')
        .select('updated_at')
        .eq('id', nodeId)
        .maybeSingle();

      if (error) throw error;
      const ts = (data as any)?.updated_at ?? null;
      console.debug('[Jobs] ✅ updated_at:', ts);
      return ts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read updated_at';
      console.error('[Jobs] ❌', msg);
      setError(msg);
      return null;
    } finally {
      console.groupEnd();
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
