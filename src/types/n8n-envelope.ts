// N8N Response Envelope Interface
// Single, stable JSON envelope for all n8n flows (success, error, partial)

export interface N8NResponseEnvelope<TParsed = unknown> {
  // Correlation
  request_id: string;
  execution_id?: string;
  workflow_name?: string;
  workflow_version?: string;

  // Timing / transport
  timestamp: string;     // finishedAt ISO
  http_status?: number;  // mirrored to Webhook Response

  // Outcome
  status: 'success' | 'error' | 'partial_success';

  // Error (present if status !== 'success')
  error?: {
    type:
      | 'validation'
      | 'authentication'
      | 'authorization'
      | 'credits'
      | 'webhook_connectivity'
      | 'workflow_execution'
      | 'upstream_http'
      | 'rate_limited'
      | 'parsing'
      | 'internal';
    code: string;              // e.g., 'INSUFFICIENT_CREDITS', 'WEBHOOK_TIMEOUT'
    message: string;
    details?: unknown;
    retry_possible: boolean;
  };

  // Payload
  data?: {
    raw_response?: unknown;    // native node output if needed
    parsed?: TParsed;          // per-flow structured object
  };

  // Non-fatal issues
  warnings?: Array<{
    type: string;
    message: string;
    field?: string;
  }>;

  // Meta
  meta: {
    env: 'prod' | 'staging' | 'dev';
    started_at: string;        // ISO
    finished_at: string;       // ISO
    duration_ms: number;
    credits_consumed?: number;
  };
}

// Specific typed envelopes for different workflows
export interface MovieInfoEnvelope extends N8NResponseEnvelope<{
  movie_info?: {
    title: string;
    logline: string;
    world: string;
    look: string;
  };
}> {}

export interface ValidationEnvelope extends N8NResponseEnvelope<{
  valid: boolean;
  reason?: { ar?: string; en?: string };
  suggested_fix?: {
    movie_title?: string;
    logline?: string;
    world?: string;
    look?: string;
  };
}> {}

export interface CharactersEnvelope extends N8NResponseEnvelope<{
  characters?: {
    lead?: any;
    supporting?: any[];
  };
}> {}

export interface PropsEnvelope extends N8NResponseEnvelope<{
  props?: any[];
}> {}

export interface TimelineEnvelope extends N8NResponseEnvelope<{
  timeline?: {
    clips?: any[];
  };
}> {}

export interface MusicEnvelope extends N8NResponseEnvelope<{
  music?: {
    prefs?: any;
    music_url?: string;
  };
}> {}

// Error code constants
export const N8N_ERROR_CODES = {
  // Validation errors (422)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Authentication/Authorization errors (401/403)
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Credits errors (402)
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  CREDITS_EXPIRED: 'CREDITS_EXPIRED',
  
  // Connectivity errors (503)
  WEBHOOK_TIMEOUT: 'WEBHOOK_TIMEOUT',
  WEBHOOK_UNREACHABLE: 'WEBHOOK_UNREACHABLE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Workflow execution errors (500)
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  NODE_EXECUTION_FAILED: 'NODE_EXECUTION_FAILED',
  
  // Upstream HTTP errors (502/503/504)
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Parsing errors
  RESPONSE_PARSE_ERROR: 'RESPONSE_PARSE_ERROR',
  INVALID_RESPONSE_FORMAT: 'INVALID_RESPONSE_FORMAT',
  
  // Internal errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const;

// Helper functions
export const isSuccessfulEnvelope = (envelope: N8NResponseEnvelope): boolean => {
  return envelope.status === 'success';
};

export const isErrorEnvelope = (envelope: N8NResponseEnvelope): boolean => {
  return envelope.status === 'error';
};

export const isPartialSuccessEnvelope = (envelope: N8NResponseEnvelope): boolean => {
  return envelope.status === 'partial_success';
};

export const isRetryableError = (envelope: N8NResponseEnvelope): boolean => {
  return envelope.status === 'error' && envelope.error?.retry_possible === true;
};

export const getErrorCode = (envelope: N8NResponseEnvelope): string | undefined => {
  return envelope.error?.code;
};

export const getErrorMessage = (envelope: N8NResponseEnvelope): string | undefined => {
  return envelope.error?.message;
};