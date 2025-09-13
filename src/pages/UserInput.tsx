import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DynamicUserInputForm } from '@/components/forms/DynamicUserInputForm';
import { useStoryboardJob } from '@/hooks/useStoryboardJob';
import { useToast } from '@/hooks/use-toast';
import { useSEOConfig } from '@/hooks/useSEO';

export default function UserInput() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job_id');
  const { createJob, updateJob, loading } = useStoryboardJob();
  const { toast } = useToast();

  // SEO optimization
  useSEOConfig({
    title: "Create Your Story - AI Scenes",
    description: "Start creating your AI-generated movie scenes. Input your story details and let our AI bring your vision to life.",
    keywords: "AI movie creation, story input, scene generation, artificial intelligence, video creation"
  });

  const handleSubmit = async (formData: any) => {
    try {
      let resultJobId: string;

      if (jobId) {
        // Update existing job
        await updateJob(jobId, formData);
        resultJobId = jobId;
        
        toast({
          title: "Success",
          description: "Your story has been updated successfully!"
        });
      } else {
        // Create new job
        resultJobId = await createJob(formData);
        
        toast({
          title: "Success", 
          description: "Your story has been created successfully!"
        });
      }

      // Navigate to the next step (dashboard or workspace)
      navigate(`/app/dashboard?job_id=${resultJobId}`);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save your story. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Create Your Story
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us about your story and we'll help you bring it to life with AI-generated scenes.
            Fill in the details below to get started.
          </p>
        </div>

        <DynamicUserInputForm
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </main>
  );
}