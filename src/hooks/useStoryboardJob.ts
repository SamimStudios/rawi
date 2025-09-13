import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGuestSession } from './useGuestSession';

export interface StoryboardJob {
  id: string;
  user_id: string | null;
  session_id: string | null;
  user_input: any;
  characters?: any;
  movie_info?: any;
  timeline?: any;
  music?: any;
  props?: any;
  created_at: string;
  updated_at: string;
}

export function useStoryboardJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { sessionId: guestSessionId } = useGuestSession();

  const createJob = async (userInput: any): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const jobData = {
        user_id: user?.id || null,
        session_id: user ? null : guestSessionId,
        user_input: userInput,
        user_input_updated_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('storyboard_jobs')
        .insert(jobData)
        .select('id')
        .single();

      if (insertError) throw insertError;
      
      return data.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (jobId: string, userInput: any): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('storyboard_jobs')
        .update({ 
          user_input: userInput,
          user_input_updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) throw updateError;
    } catch (err: any) {
      setError(err.message || 'Failed to update job');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getJob = async (jobId: string): Promise<StoryboardJob | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('storyboard_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw queryError;
      }
      
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    createJob, 
    updateJob, 
    getJob, 
    loading, 
    error 
  };
}