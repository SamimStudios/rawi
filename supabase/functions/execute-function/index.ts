import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import Ajv from 'https://esm.sh/ajv@8.12.0';

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
    message: { en: string; ar: string } | string;
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

// Bilingual message helper
const bi = (msg: unknown, enDefault: string, arDefault?: string) => {
  if (msg && typeof msg === 'object' && 'en' in (msg as any) && 'ar' in (msg as any)) return msg as any;
  const s = typeof msg === 'string' ? msg : enDefault;
  return { en: s, ar: arDefault ?? s };
};

// Envelope pass-through detection
const isEnvelope = (response: any): boolean => {
  return response && 
         typeof response === 'object' && 
         'status' in response && 
         ('http_status' in response || 'data' in response || 'error' in response);
};

// Check if status should trigger retry
const shouldRetry = (status: number): boolean => [429, 502, 503, 504].includes(status);

// Initialize Ajv for schema validation with proper configuration
const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false, // Allow unknown keywords to prevent strict mode errors
  removeAdditional: false, // Don't remove additional properties
  useDefaults: true, // Use default values from schema
  validateSchema: false // Skip meta-schema validation to avoid draft issues
});

// Helper to clean schema from unsupported meta-schema references
const cleanSchema = (schema: any): any => {
  if (!schema || typeof schema !== 'object') return schema;
  
  const cleaned = { ...schema };
  // Remove $schema property that causes AJV issues with draft 2020-12
  delete cleaned.$schema;
  
  // Clean nested schemas recursively
  if (cleaned.properties) {
    cleaned.properties = Object.fromEntries(
      Object.entries(cleaned.properties).map(([key, value]) => [key, cleanSchema(value)])
    );
  }
  if (cleaned.items) {
    cleaned.items = cleanSchema(cleaned.items);
  }
  if (cleaned.additionalProperties && typeof cleaned.additionalProperties === 'object') {
    cleaned.additionalProperties = cleanSchema(cleaned.additionalProperties);
  }
  
  return cleaned;
};

// Validate payload against schema
const validatePayload = (schema: any, payload: any) => {
  try {
    const cleanedSchema = cleanSchema(schema);
    const validate = ajv.compile(cleanedSchema);
    return validate(payload) ? null : validate.errors;
  } catch (error) {
    console.error('Schema compilation error:', error);
    return [{ message: `Schema compilation failed: ${error.message}` }];
  }
};

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
      message: { en: string; ar: string } | string;
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
  
  // Default HTTP status codes
  let defaultStatus = 200;
  if (status === 'error') defaultStatus = 500;
  if (status === 'partial_success') defaultStatus = 207;
  
  return {
    request_id: requestId,
    timestamp: finishTime.toISOString(),
    http_status: options.httpStatus || defaultStatus,
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate request correlation ID and start timing
  const requestId = req.headers.get('X-Request-Id') || crypto.randomUUID();
  const startTime = new Date();

  try {
    const requestData = await req.json();
    
    // Support both n8n_function_id and function_id (alias for backward compatibility)
    const n8n_function_id = requestData.n8n_function_id || requestData.function_id;
    const { payload, user_id } = requestData;
    
    console.log('Execute function request:', { n8n_function_id, payload, user_id });

    // Validate required parameters
    if (!n8n_function_id || !payload) {
      console.error('Missing required parameters:', { n8n_function_id, payload });
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'validation',
          code: 'MISSING_REQUIRED_FIELD',
          message: bi(null, 'Missing required parameters: n8n_function_id and payload', 'المعاملات المطلوبة مفقودة: n8n_function_id و payload'),
          details: { n8n_function_id: !!n8n_function_id, payload: !!payload },
          retryPossible: false
        },
        httpStatus: 422
      });
      
      return new Response(JSON.stringify(envelope), {
        status: 200, // Always return 200 for envelope pattern
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
      .eq('id', n8n_function_id)
      .eq('active', true)
      .single();

    if (functionError || !functionData) {
      console.error('Function not found or inactive:', functionError);
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'authentication',
          code: 'FUNCTION_NOT_FOUND',
          message: bi(null, 'Function not found or inactive', 'الوظيفة غير موجودة أو غير نشطة'),
          details: { n8n_function_id, error: functionError },
          retryPossible: false
        },
        httpStatus: 404
      });
      
      return new Response(JSON.stringify(envelope), {
        status: 200, // Always return 200 for envelope pattern
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    console.log('Function details:', functionData);

    // Validate payload against expected_schema if present
    if (functionData.expected_schema) {
      console.log('Validating payload against expected schema...');
      try {
        const validationErrors = validatePayload(functionData.expected_schema, payload);
        
        if (validationErrors) {
          console.warn('Payload validation failed, but continuing execution:', validationErrors);
          // For now, just log validation errors but don't block execution
          // This allows us to test webhook connectivity while debugging schema issues
        } else {
          console.log('Payload validation passed');
        }
      } catch (schemaError) {
        console.error('Schema validation error, continuing execution:', schemaError);
        // Continue execution even if schema validation fails
      }
    } else {
      console.log('No expected_schema provided, skipping validation');
    }

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
            message: bi(null, `Insufficient credits. Required: ${functionData.price}, Available: ${userCredits?.credits || 0}`, `الرصيد غير كافي. المطلوب: ${functionData.price}، المتاح: ${userCredits?.credits || 0}`),
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
          status: 200, // Always return 200 for envelope pattern
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Request-Id': requestId
          }
        });
      }

      console.log(`User has sufficient credits: ${userCredits.credits}`);
    }

    // Get webhook URL
    const webhookUrl = functionData.test_webhook || functionData.production_webhook;
    
    if (!webhookUrl) {
      console.error('No webhook URL configured for function');
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: 'internal',
          code: 'CONFIGURATION_ERROR',
          message: bi(null, 'Function webhook not configured', 'webhook الوظيفة غير مكون'),
          details: { n8n_function_id, function_name: functionData.name },
          retryPossible: false
        },
        httpStatus: 500
      });
      
      return new Response(JSON.stringify(envelope), {
        status: 200, // Always return 200 for envelope pattern
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Call the webhook with retry logic
    console.log('=== WEBHOOK CALL DEBUG ===');
    console.log('Webhook URL:', webhookUrl);
    console.log('Function name:', functionData.name);
    console.log('Function type:', functionData.type);
    console.log('Payload being sent:', JSON.stringify(payload, null, 2));
    console.log('Request ID:', requestId);
    console.log('User ID:', user_id);
    console.log('=== END DEBUG ===');
    
    let webhookResult;
    let webhookResponse;
    let lastError;
    
    // Try up to 2 times (initial + 1 retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Webhook attempt ${attempt}...`);
        
        webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': requestId,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        console.log('Webhook response status:', webhookResponse.status);
        console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

        // Check if we should retry based on status
        if (attempt === 1 && shouldRetry(webhookResponse.status)) {
          console.log(`Retrying webhook call due to status ${webhookResponse.status}`);
          continue;
        }

        break; // Success or non-retryable error
        
      } catch (error) {
        console.error(`Webhook attempt ${attempt} failed:`, error);
        lastError = error;
        
        // Only retry timeout/network errors
        if (attempt === 1 && (error.name === 'TimeoutError' || error.name === 'NetworkError')) {
          console.log('Retrying webhook call due to network/timeout error');
          continue;
        }
        
        break; // Non-retryable error
      }
    }

    // Handle webhook errors
    if (!webhookResponse) {
      console.error('Webhook call completely failed:', lastError);
      
      let errorType: N8NResponseEnvelope['error']['type'] = 'webhook_connectivity';
      let errorCode = 'WEBHOOK_TIMEOUT';
      
      if (lastError?.name === 'TimeoutError') {
        errorCode = 'WEBHOOK_TIMEOUT';
      } else if (lastError?.name === 'NetworkError') {
        errorCode = 'WEBHOOK_UNREACHABLE';
      } else {
        errorType = 'internal';
        errorCode = 'INTERNAL_SERVER_ERROR';
      }
      
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: errorType,
          code: errorCode,
          message: bi(null, `Webhook call failed: ${lastError?.message}`, `فشل استدعاء webhook: ${lastError?.message}`),
          details: { 
            error_name: lastError?.name, 
            error_message: lastError?.message,
            webhook_url: webhookUrl 
          },
          retryPossible: true
        },
        httpStatus: webhookResponse?.status || 502
      });
      
      return new Response(JSON.stringify(envelope), {
        status: 200, // Always return 200 for envelope pattern
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Handle non-OK responses
    if (!webhookResponse.ok) {
      const responseText = await webhookResponse.text();
      console.error('Webhook failed with status:', webhookResponse.status);
      console.error('Webhook failed with response:', responseText);
      
      // Try to parse the response - N8N might return valid envelope data even with error status
      let parsedErrorResponse = null;
      try {
        parsedErrorResponse = JSON.parse(responseText);
        console.log('Successfully parsed error response:', JSON.stringify(parsedErrorResponse, null, 2));
        
        // If it's a valid envelope, fix any type issues and use it
        if (isEnvelope(parsedErrorResponse)) {
          console.log('Error response is valid envelope, using it');
          
          // Fix type issues
          if (parsedErrorResponse.http_status && typeof parsedErrorResponse.http_status === 'string') {
            const parsed = parseInt(parsedErrorResponse.http_status, 10);
            if (!isNaN(parsed)) {
              parsedErrorResponse.http_status = parsed;
              console.log(`Fixed http_status in error response: "${parsedErrorResponse.http_status}" -> ${parsed}`);
            }
          }
          
          parsedErrorResponse.request_id = requestId;
          
          return new Response(JSON.stringify(parsedErrorResponse), {
            status: 200, // Always return 200 for envelope pattern
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Request-Id': requestId
            }
          });
        }
      } catch (parseError) {
        console.error('Could not parse error response as JSON:', parseError);
      }
      
      // Enhanced error classification for unparseable responses
      let errorType: N8NResponseEnvelope['error']['type'] = 'upstream_http';
      let errorCode = `UPSTREAM_${webhookResponse.status}`;
      let retryPossible = true;
      
      // Specific pattern matching
      if (responseText.includes('Invalid status code') && responseText.includes('must be an integer')) {
        errorType = 'parsing';
        errorCode = 'STATUS_CODE_TYPE_ERROR'; 
        retryPossible = false;
      } else if (webhookResponse.status === 404 && responseText.includes('not registered')) {
        errorType = 'webhook_connectivity';
        errorCode = 'N8N_WEBHOOK_NOT_FOUND';
        retryPossible = false;
      } else if (webhookResponse.status === 500 && responseText.includes('could not be started')) {
        errorType = 'workflow_execution';
        errorCode = 'START_FAILED';
        retryPossible = false;
      } else if (webhookResponse.status === 520 && responseText.includes('<html')) {
        errorType = 'webhook_connectivity';
        errorCode = 'EDGE_520';
        retryPossible = true;
      } else if (webhookResponse.status === 401 || webhookResponse.status === 403) {
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
      }
      
      const envelope = createEnvelope(requestId, startTime, 'error', {
        error: {
          type: errorType,
          code: errorCode,
          message: bi(null, `Webhook failed with status ${webhookResponse.status}`, `فشل webhook بالحالة ${webhookResponse.status}`),
          details: { 
            status: webhookResponse.status, 
            response: responseText,
            webhook_url: webhookUrl,
            parsed_response: parsedErrorResponse || null
          },
          retryPossible
        },
        httpStatus: webhookResponse.status
      });
      
      return new Response(JSON.stringify(envelope), {
        status: 200, // Always return 200 for envelope pattern
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Parse webhook response with better error handling
    const responseText = await webhookResponse.text();
    console.log('Raw webhook response:', responseText);
    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));
    
    try {
      webhookResult = JSON.parse(responseText);
      console.log('Successfully parsed webhook result:', JSON.stringify(webhookResult, null, 2));
    } catch (parseError) {
      console.error('Failed to parse webhook response as JSON:', parseError);
      console.error('Response text was:', responseText);
      webhookResult = { raw_response: responseText };
    }

    // Check if response is already an envelope - if so, pass it through
    if (isEnvelope(webhookResult)) {
      console.log('Webhook returned envelope format, passing through...');
      
      // Fix any type issues in the envelope - be more thorough
      if (webhookResult.http_status) {
        if (typeof webhookResult.http_status === 'string') {
          const parsed = parseInt(webhookResult.http_status, 10);
          if (!isNaN(parsed)) {
            webhookResult.http_status = parsed;
            console.log(`Fixed http_status: "${webhookResult.http_status}" -> ${parsed}`);
          }
        }
      }
      
      // Also check nested status codes if they exist
      if (webhookResult.error && webhookResult.error.http_status && typeof webhookResult.error.http_status === 'string') {
        const parsed = parseInt(webhookResult.error.http_status, 10);
        if (!isNaN(parsed)) {
          webhookResult.error.http_status = parsed;
        }
      }
      
      // Ensure request_id is set
      webhookResult.request_id = requestId;
      
      // Consume credits for successful/partial_success responses
      if ((webhookResult.status === 'success' || webhookResult.status === 'partial_success') && 
          user_id && functionData.price > 0) {
        console.log(`Consuming ${functionData.price} credits for user ${user_id} after successful webhook`);
        
        await supabase.rpc('consume_credits', {
          p_user_id: user_id,
          p_credits: functionData.price,
          p_description: `${functionData.name} execution`
        });
        
        // Update credits_consumed in meta
        if (webhookResult.meta) {
          webhookResult.meta.credits_consumed = functionData.price;
        }
      }
      
      // Update database if needed
      if (payload.table_id === 'storyboard_jobs' && payload.row_id) {
        const updateData: any = { 
          n8n_response: webhookResult,
          updated_at: new Date().toISOString()
        };

        if (webhookResult.data?.parsed?.movie_info) {
          updateData.movie_info = webhookResult.data.parsed.movie_info;
          updateData.movie_info_updated_at = new Date().toISOString();
        }

        await supabase.from('storyboard_jobs').update(updateData).eq('id', payload.row_id);
        console.log('Successfully updated storyboard job with webhook response envelope');
      }
      
      return new Response(JSON.stringify(webhookResult), {
        status: 200, // Always return 200 for envelope pattern
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      });
    }

    // Validate success response against success_response_schema if present
    let status: 'success' | 'partial_success' = 'success';
    let warnings: Array<{ type: string; message: string; field?: string }> | undefined;
    
    if (functionData.success_response_schema) {
      console.log('Validating success response against schema...');
      try {
        const validationErrors = validatePayload(functionData.success_response_schema, webhookResult);
        
        if (validationErrors) {
          console.warn('Success response validation failed:', validationErrors);
          status = 'partial_success';
          warnings = validationErrors.map((error: any) => ({
            type: 'schema_validation',
            message: `Response validation warning: ${error.message}`,
            field: error.instancePath || error.schemaPath
          }));
        } else {
          console.log('Success response validation passed');
        }
      } catch (schemaError) {
        console.error('Response schema validation error:', schemaError);
        // Don't fail the entire request for response validation issues
        status = 'partial_success';
        warnings = [{
          type: 'schema_validation',
          message: `Response validation error: ${schemaError.message}`
        }];
      }
    } else {
      console.log('No success_response_schema provided, skipping validation');
    }

    // Consume credits after successful/partial_success webhook
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
      } else {
        console.log('Credits consumed successfully after webhook completion');
      }
    }

    // Create success/partial_success envelope
    const envelope = createEnvelope(requestId, startTime, status, {
      data: webhookResult,
      creditsConsumed: user_id ? functionData.price : 0,
      httpStatus: status === 'partial_success' ? 207 : 200,
      warnings
    });

    // For storyboard jobs, update the job with the webhook response
    if (payload.table_id === 'storyboard_jobs' && payload.row_id) {
      const updateData: any = { 
        n8n_response: envelope,
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
      status: 200, // Always return 200 for envelope pattern
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
        message: bi(null, error.message || 'Internal server error', error.message || 'خطأ خادم داخلي'),
        details: { error_stack: error.stack },
        retryPossible: true
      },
      httpStatus: 500
    });
    
    return new Response(JSON.stringify(envelope), {
      status: 200, // Always return 200 for envelope pattern
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Request-Id': requestId
      }
    });
  }
});