import React from 'react';
import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';

export default function WorkspaceNew() {
  const { jobId } = useParams<{ jobId: string }>();
  
  if (!jobId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Invalid Job ID</h2>
          <p className="text-muted-foreground">Please provide a valid job ID in the URL.</p>
        </div>
      </div>
    );
  }
  
  return <WorkspaceLayout jobId={jobId} />;
}