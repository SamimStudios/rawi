import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VideoJob } from '@/types/workspace';

export function useVideoJobs() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: jobsData, error: jobsError } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (jobsError) throw jobsError;

      setJobs(jobsData || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  return { jobs, loading, error, refetch: fetchJobs };
}

export function useVideoJob(jobId: string) {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: jobData, error: jobError } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      setJob(jobData);
    } catch (e: any) {
      setError(e?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  return { job, loading, error, refetch: fetchJob };
}