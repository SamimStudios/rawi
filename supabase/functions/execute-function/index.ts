import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// N8N Response Envelope Interface (inline for edge function)
interface N8NResponseEnvelope<TParsed = unknown> {
  request_id: string;
  execution_id?: string;
  workflow_name?: string;
  workflow_version?: string;
  timestamp: string;
  http_status?: number;
  status: 'success' | 'error' | 'partial_success';
  error?: {
    type: 'validation' | 'authentication' | 'authorization' | 'credits' | 'webhook_connectivity' | 'workflow_execution' | 'upstream_http' | 'rate_limited' | 'parsing' | 'internal';
    code: string;
    message: string;
    details?: unknown;
    retry_possible: boolean;
  };
  data?: {
    raw_response?: unknown;
    parsed?: TParsed;
  };
  warnings?: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
  meta: {
    env: 'prod' | 'staging' | 'dev';
    started_at: string;
    finished_at: string;
    duration_ms: number;
    credits_consumed?: number;
  };
}

// Helper function to create envelope
const createEnvelope = (
  requestId: string,
  startTime: Date,
  status: 'success' | 'error' | 'partial_success',
  options: {
    data?: any;
    error?: {
      type: N8NResponseEnvelope['error']['type'];
      code: string;
      message: string;
      details?: unknown;
      retryPossible: boolean;
    };
    httpStatus?: number;
    creditsConsumed?: number;
    warnings?: Array<{ type: string; message: string; field?: string }>;
  } = {}
): N8NResponseEnvelope => {
  const finishTime = new Date();
  const env = Deno.env.get('ENVIRONMENT') as 'prod' | 'staging' | 'dev' || 'dev';
  
  return {
    request_id: requestId,
    timestamp: finishTime.toISOString(),
    http_status: options.httpStatus || (status === 'success' ? 200 : status === 'error' ? 500 : 200),
    status,
    error: options.error ? {
      type: options.error.type,
      code: options.error.code,
      message: options.error.message,
      details: options.error.details,
      retry_possible: options.error.retryPossible
    } : undefined,
    data: options.data ? {
      raw_response: options.data,
      parsed: options.data
    } : undefined,
    warnings: options.warnings,
    meta: {
      env,
      started_at: startTime.toISOString(),
      finished_at: finishTime.toISOString(),
      duration_ms: finishTime.getTime() - startTime.getTime(),
      credits_consumed: options.creditsConsumed
    }
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate request correlation ID and start timing
  const requestId = crypto.randomUUID();
  const startTime = new Date();

  try {
    const { function_id, payload, user_id } = await req.json();
    
    console.log('Execute function request:', { function_id, payload, user_id });

    // Validate required parameters
    if (!function_id || !payload) {
      console.error('Missing required parameters:', { function_id, payload });
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'validation',
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Missing required parameters: function_id and payload',
          details: { function_id: !!function_id, payload: !!payload },
          retryPossible: false
        },
        httpStatus: 422
      });
      
      return new Response(JSON.stringify(envelope), {
        status: envelope.http_status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch function details
    console.log('Fetching function details...');
    const { data: functionData, error: functionError } = await supabase
      .from('n8n_functions')
      .select('*')
      .eq('id', function_id)
      .eq('active', true)
      .single();

    if (functionError || !functionData) {
      console.error('Function not found or inactive:', functionError);
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'authentication',
          code: 'FUNCTION_NOT_FOUND',
          message: 'Function not found or inactive',
          details: { function_id, error: functionError },
          retryPossible: false
        },
        httpStatus: 404
      });
      
      return new Response(JSON.stringify(envelope), {
        status: envelope.http_status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    console.log('Function details:', functionData);

    // Check if user has sufficient credits before making webhook call
    if (user_id && functionData.price > 0) {
      console.log(`Checking ${functionData.price} credits for user ${user_id}`);
      
      // First check if user has enough credits without consuming them
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user_id)
        .single();

      if (creditsError || !userCredits || userCredits.credits < functionData.price) {
        console.log('Insufficient credits for user');
        const envelope = createEnvelope(requestId, startTime, 'error', {
          error: {
            type: 'credits',
            code: 'INSUFFICIENT_CREDITS',
            message: `Insufficient credits. Required: ${functionData.price}, Available: ${userCredits?.credits || 0}`,
            details: {
              required_credits: functionData.price,
              available_credits: userCredits?.credits || 0,
              credits_error: creditsError
            },
            retryPossible: true
          },
          httpStatus: 402
        });
        
        return new Response(JSON.stringify(envelope), {
          status: envelope.http_status,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Request-Id': requestId
          }
        });
      }

      console.log(`User has sufficient credits: ${userCredits.credits}`);
    }

    // Test webhook connectivity first
    const webhookUrl = functionData.test_webhook || functionData.production_webhook;
    
    if (!webhookUrl) {
      console.error('No webhook URL configured for function');
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'internal',
          code: 'CONFIGURATION_ERROR',
          message: 'Function webhook not configured',
          details: { function_id, function_name: functionData.name },
          retryPossible: false
        },
        httpStatus: 500
      });
      
      return new Response(JSON.stringify(envelope), {
        status: envelope.http_status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    console.log('Testing webhook connectivity to:', webhookUrl);
    
    // Simple connectivity test
    try {
      const testResponse = await fetch(webhookUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      console.log('Webhook connectivity test result:', testResponse.status);
    } catch (testError) {
      console.error('Webhook connectivity test failed:', testError);
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'webhook_connectivity',
          code: 'WEBHOOK_UNREACHABLE',
          message: `Webhook endpoint not accessible: ${testError.message}`,
          details: { webhook_url: webhookUrl, test_error: testError.message },
          retryPossible: true
        },
        httpStatus: 503
      });
      
      return new Response(JSON.stringify(envelope), {
        status: envelope.http_status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Call the webhook
    console.log('Calling webhook:', webhookUrl);
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    
    let webhookResult;
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Webhook response status:', webhookResponse.status);
      console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

      if (!webhookResponse.ok) {
        const responseText = await webhookResponse.text();
        console.error('Webhook failed with response:', responseText);
        
        // Determine error type based on status code
        let errorType: N8NResponseEnvelope['error']['type'] = 'upstream_http';
        let errorCode = 'UPSTREAM_ERROR';
        let retryPossible = true;
        
        if (webhookResponse.status >= 400 && webhookResponse.status < 500) {
          if (webhookResponse.status === 401 || webhookResponse.status === 403) {
            errorType = 'authentication';
            errorCode = 'PERMISSION_DENIED';
            retryPossible = false;
          } else if (webhookResponse.status === 422) {
            errorType = 'validation';
            errorCode = 'VALIDATION_FAILED';
            retryPossible = false;
          } else if (webhookResponse.status === 429) {
            errorType = 'rate_limited';
            errorCode = 'RATE_LIMIT_EXCEEDED';
            retryPossible = true;
          } else {
            errorCode = 'UPSTREAM_ERROR';
          }
        } else if (webhookResponse.status >= 500) {
          errorType = 'workflow_execution';
          errorCode = 'WORKFLOW_FAILED';
        }
        
        const envelope = createEnvelope(requestId, startTime, 'error', {
          error: {
            type: errorType,
            code: errorCode,
            message: `Webhook failed with status ${webhookResponse.status}`,
            details: { 
              status: webhookResponse.status, 
              response: responseText,
              webhook_url: webhookUrl 
            },
            retryPossible
          },
          httpStatus: 502
        });
        
        return new Response(JSON.stringify(envelope), {
          status: envelope.http_status,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Request-Id': requestId
          }
        });
      }

      const responseText = await webhookResponse.text();
      console.log('Raw webhook response:', responseText);
      
      try {
        webhookResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse webhook response as JSON:', parseError);
        webhookResult = { raw_response: responseText };
      }
      
      console.log('Parsed webhook result:', webhookResult);
    } catch (webhookError) {
      console.error('Error calling webhook:', webhookError);
      
      // Determine error type based on error characteristics
      let errorType: N8NResponseEnvelope['error']['type'] = 'webhook_connectivity';
      let errorCode = 'WEBHOOK_TIMEOUT';
      
      if (webhookError.name === 'TimeoutError') {
        errorCode = 'WEBHOOK_TIMEOUT';
      } else if (webhookError.name === 'NetworkError') {
        errorCode = 'WEBHOOK_UNREACHABLE';
      } else {
        errorType = 'internal';
        errorCode = 'INTERNAL_SERVER_ERROR';
      }
      
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: errorType,
          code: errorCode,
          message: `Webhook call failed: ${webhookError.message}`,
          details: { 
            error_name: webhookError.name, 
            error_message: webhookError.message,
            webhook_url: webhookUrl 
          },
          retryPossible: true
        },
        httpStatus: 502
      });
      
      return new Response(JSON.stringify(envelope), {
        status: envelope.http_status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Now that webhook succeeded, consume the credits
    if (user_id && functionData.price > 0) {
      console.log(`Consuming ${functionData.price} credits for user ${user_id} after successful webhook`);
      
      const { data: creditResult, error: creditError } = await supabase.rpc('consume_credits', {
        p_user_id: user_id,
        p_credits: functionData.price,
        p_description: `${functionData.name} execution`
      });

      if (creditError || !creditResult) {
        console.error('Error consuming credits after successful webhook:', creditError);
        // Note: We don't return an error here since the webhook succeeded
        // This is a billing issue, not a functional failure
      } else {
        console.log('Credits consumed successfully after webhook completion');
      }
    }

    // Create success envelope
    const envelope = createEnvelope(requestId, startTime, 'success', {
      data: webhookResult,
      creditsConsumed: user_id ? functionData.price : 0,
      httpStatus: 200
    });

    // For storyboard jobs, update the job with the webhook response (now storing envelope)
    if (payload.table_id === 'storyboard_jobs' && payload.row_id) {
      const updateData: any = { 
        n8n_response: envelope, // Store the complete envelope
        updated_at: new Date().toISOString()
      };

      // If webhook response contains movie_info, also set movie_info_updated_at
      if (webhookResult && typeof webhookResult === 'object' && webhookResult.movie_info) {
        updateData.movie_info = webhookResult.movie_info;
        updateData.movie_info_updated_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('storyboard_jobs')
        .update(updateData)
        .eq('id', payload.row_id);

      if (updateError) {
        console.error('Error updating storyboard job:', updateError);
      } else {
        console.log('Successfully updated storyboard job with webhook response envelope');
      }
    }

    // Return success envelope
    return new Response(JSON.stringify(envelope), {
      status: envelope.http_status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Request-Id': requestId
      }
    });

  } catch (error) {
    console.error('Error in execute-function:', error);
    
    const envelope = createEnvelope(requestId, startTime, 'error', {
      error: {
        type: 'internal',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Internal server error',
        details: { error_stack: error.stack },
        retryPossible: true
      },
      httpStatus: 500
    });
    
    return new Response(JSON.stringify(envelope), {
      status: envelope.http_status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Request-Id': requestId
      }
    });
  }
});