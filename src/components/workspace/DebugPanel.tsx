import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';

interface DebugPanelProps {
  job: any;
  isLoading: boolean;
  error: string | null;
}

export function DebugPanel({ job, isLoading, error }: DebugPanelProps) {
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          🐛 Debug Panel
          <Badge variant="outline" className="text-xs">DEV ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Auth State:</strong> {user ? `User: ${user.id}` : 'Guest'}
        </div>
        <div>
          <strong>Session ID:</strong> {sessionId || 'None'}
        </div>
        <div>
          <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
        <div>
          <strong>Job Data:</strong> {job ? 'Loaded' : 'None'}
        </div>
        {job && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <div><strong>Job ID:</strong> {job.id}</div>
            <div><strong>User ID:</strong> {job.user_id || 'Guest'}</div>
            <div><strong>Session ID in Job:</strong> {job.session_id || 'None'}</div>
            <div><strong>Created:</strong> {new Date(job.created_at).toLocaleString()}</div>
            <div><strong>Updated:</strong> {new Date(job.updated_at).toLocaleString()}</div>
            <div><strong>Sections:</strong></div>
            <ul className="ml-4 mt-1">
              <li>user_input: {job.user_input ? '✓' : '✗'}</li>
              <li>movie_info: {job.movie_info ? '✓' : '✗'}</li>
              <li>characters: {job.characters ? '✓' : '✗'}</li>
              <li>props: {job.props ? '✓' : '✗'}</li>
              <li>timeline: {job.timeline ? '✓' : '✗'}</li>
              <li>music: {job.music ? '✓' : '✗'}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}