import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { toast } from '@/hooks/use-toast';
import { WorkspaceJob } from './useWorkspaceState';

// Job data fetching and management
export function useJobData(jobId: string) {
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const queryClient = useQueryClient();

  // Fetch job data
  const {
    data: job,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['storyboard-job', jobId],
    queryFn: async (): Promise<WorkspaceJob | null> => {
      if (!jobId) return null;

      console.log('Fetching job:', jobId, 'with sessionId:', sessionId);

      let query = supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', jobId);

      // Add session filter for guest users
      if (!user && sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Job fetch error:', error);
        throw new Error(`Failed to fetch job: ${error.message}`);
      }

      if (!data) {
        console.warn('Job not found:', jobId);
        return null;
      }

      console.log('Job data loaded:', data);
      return data as WorkspaceJob;
    },
    retry: (failureCount, error) => {
      // Don't retry if job not found
      if (error.message.includes('Job not found')) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Update job data
  const updateJobMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      if (!jobId) throw new Error('No job ID');

      console.log('Updating job section:', section, 'with data:', data);

      const updateData = {
        [section]: data,
        [`${section}_updated_at`]: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let query = supabase
        .from('storyboard_jobs')
        .update(updateData)
        .eq('id', jobId);

      // Add session filter for guest users
      if (!user && sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('Job update error:', error);
        throw new Error(`Failed to update ${section}: ${error.message}`);
      }

      console.log('Job section updated successfully:', section);
      return { section, data };
    },
    onSuccess: ({ section, data }) => {
      // Update the cache optimistically
      queryClient.setQueryData(['storyboard-job', jobId], (oldJob: WorkspaceJob | undefined) => {
        if (!oldJob) return oldJob;
        const newJob = {
          ...oldJob,
          [section]: data,
          [`${section}_updated_at`]: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('Updated job cache:', newJob);
        return newJob;
      });
      
      toast({
        title: 'Saved',
        description: `${section} section has been saved successfully.`,
        duration: 2000
      });
    },
    onError: (error: Error, { section }) => {
      toast({
        title: 'Error',
        description: `Failed to save ${section}: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Delete section data
  const deleteSectionMutation = useMutation({
    mutationFn: async (section: string) => {
      if (!jobId) throw new Error('No job ID');

      const updateData = {
        [section]: null,
        [`${section}_updated_at`]: null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('storyboard_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        throw new Error(`Failed to delete ${section}: ${error.message}`);
      }

      return section;
    },
    onSuccess: (section) => {
      // Update the cache
      queryClient.setQueryData(['storyboard-job', jobId], (oldJob: WorkspaceJob | undefined) => {
        if (!oldJob) return oldJob;
        const newJob = { ...oldJob };
        delete newJob[section];
        delete newJob[`${section}_updated_at`];
        newJob.updated_at = new Date().toISOString();
        return newJob;
      });
      
      toast({
        title: 'Deleted',
        description: `${section} section has been deleted.`,
        duration: 2000
      });
    },
    onError: (error: Error, section) => {
      toast({
        title: 'Error',
        description: `Failed to delete ${section}: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Auto-save function with debouncing
  const debouncedUpdate = useMutation({
    mutationFn: updateJobMutation.mutateAsync,
    onError: (error) => {
      // Only show error if it's not a guest session issue
      console.warn('Auto-save failed:', error);
    }
  });

  return {
    // Data
    job,
    isLoading,
    error: error?.message || null,
    
    // Actions
    updateJob: updateJobMutation.mutate,
    deleteSection: deleteSectionMutation.mutate,
    autoSave: debouncedUpdate.mutate,
    refetch,
    
    // Status
    isUpdating: updateJobMutation.isPending || debouncedUpdate.isPending,
    isDeleting: deleteSectionMutation.isPending
  };
}