import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function N8NTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  
  // Test data
  const [testPayload, setTestPayload] = useState({
    movieTitle: 'The Last Echo',
    logline: 'In a world where sound is forbidden, a young musician discovers the power of music to save humanity.',
    world: 'Post-apocalyptic city where silence is enforced by the Sound Police',
    look: 'Dark, dystopian with neon highlights and underground music venues'
  });

  const executeFunction = async (functionId: string, payload: any) => {
    const { data: envelope, error } = await supabase.functions.invoke('execute-function', {
      body: {
        function_id: functionId,
        payload,
        user_id: user?.id || null
      }
    });

    if (error) {
      throw new Error(error.message || 'Function execution failed');
    }
    
    if (envelope?.status === 'error') {
      const errorMessage = envelope.error?.message || 'Function execution failed';
      throw new Error(typeof errorMessage === 'string' ? errorMessage : errorMessage.en || 'Function execution failed');
    }
    
    return envelope;
  };

  const testGenerateMovieInfo = async () => {
    setLoading(prev => ({ ...prev, generateMovie: true }));
    
    try {
      const result = await executeFunction('e9ec8814-cef4-4e3d-adf1-deaa16d47dd0', {
        prompt: `Create a movie with title: ${testPayload.movieTitle}, logline: ${testPayload.logline}`
      });
      
      setResults(prev => ({ ...prev, generateMovie: result }));
      toast({
        title: "Success",
        description: "Movie info generation completed",
      });
    } catch (error) {
      console.error('❌ Generate movie info error:', error);
      setResults(prev => ({ ...prev, generateMovie: { error: error.message } }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate movie info',
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, generateMovie: false }));
    }
  };

  const testValidateMovieInfo = async () => {
    setLoading(prev => ({ ...prev, validateMovie: true }));
    
    try {
      const result = await executeFunction('17c13967-cf25-484d-87a2-16895116b408', {
        title: testPayload.movieTitle,
        logline: testPayload.logline,
        world: testPayload.world,
        look: testPayload.look
      });
      
      setResults(prev => ({ ...prev, validateMovie: result }));
      toast({
        title: "Success",
        description: "Movie info validation completed",
      });
    } catch (error) {
      console.error('❌ Validate movie info error:', error);
      setResults(prev => ({ ...prev, validateMovie: { error: error.message } }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to validate movie info',
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, validateMovie: false }));
    }
  };

  const renderResult = (key: string, result: any) => {
    if (!result) return null;
    
    if (result.error) {
      return (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80">{result.error}</p>
          </div>
        </div>
      );
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'success':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'partial_success':
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case 'error':
          return <XCircle className="h-5 w-5 text-destructive" />;
        default:
          return <Clock className="h-5 w-5 text-muted-foreground" />;
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(result.status)}
          <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
            {result.status}
          </Badge>
          {result.request_id && (
            <span className="text-xs text-muted-foreground">ID: {result.request_id}</span>
          )}
        </div>
        
        {result.data?.parsed && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Parsed Data:</h4>
            <pre className="text-sm overflow-x-auto">{JSON.stringify(result.data.parsed, null, 2)}</pre>
          </div>
        )}
        
        {result.warnings && result.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
            {result.warnings.map((warning: any, index: number) => (
              <p key={index} className="text-sm text-yellow-700">{warning.message}</p>
            ))}
          </div>
        )}
        
        {result.meta && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Duration: {result.meta.duration_ms}ms</p>
            {result.meta.credits_consumed && <p>Credits consumed: {result.meta.credits_consumed}</p>}
            <p>Environment: {result.meta.env}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">N8N Functions Test</h1>
        <p className="text-muted-foreground">Test the N8N function system with sample data</p>
      </div>

      {/* Test Data Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Movie Title</label>
            <Input
              value={testPayload.movieTitle}
              onChange={(e) => setTestPayload(prev => ({ ...prev, movieTitle: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Logline</label>
            <Textarea
              value={testPayload.logline}
              onChange={(e) => setTestPayload(prev => ({ ...prev, logline: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">World</label>
            <Textarea
              value={testPayload.world}
              onChange={(e) => setTestPayload(prev => ({ ...prev, world: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Look</label>
            <Textarea
              value={testPayload.look}
              onChange={(e) => setTestPayload(prev => ({ ...prev, look: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Functions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Movie Info</CardTitle>
            <p className="text-sm text-muted-foreground">Test the movie info generation function</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testGenerateMovieInfo}
              disabled={loading.generateMovie}
              className="w-full"
            >
              {loading.generateMovie ? (
                <>
                  <LoadingSpinner size="sm" />
                  Testing...
                </>
              ) : (
                'Test Generate Movie Info'
              )}
            </Button>
            {renderResult('generateMovie', results.generateMovie)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validate Movie Info</CardTitle>
            <p className="text-sm text-muted-foreground">Test the movie info validation function</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testValidateMovieInfo}
              disabled={loading.validateMovie}
              className="w-full"
            >
              {loading.validateMovie ? (
                <>
                  <LoadingSpinner size="sm" />
                  Testing...
                </>
              ) : (
                'Test Validate Movie Info'
              )}
            </Button>
            {renderResult('validateMovie', results.validateMovie)}
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p>User ID: {user?.id || 'Guest'}</p>
            <p>Functions configured: generate-movie-info, validate-movie-info</p>
            <p>Edge Function: execute-function</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}