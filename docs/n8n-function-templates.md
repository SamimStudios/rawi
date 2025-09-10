# N8N Function Node Templates

This document provides the N8N Function node templates for implementing the systematic N8N Response Envelope.

## Format Success Function

Use this template in N8N Function nodes to format successful responses:

```javascript
// N8N Function Node: Format Success
// Use this after successful workflow execution

const requestId = $('Set Context').first().$node.context.request_id || 'unknown';
const startedAt = $('Set Context').first().$node.context.started_at || new Date().toISOString();
const env = $('Set Context').first().$node.context.env || 'dev';

const finishedAt = new Date().toISOString();
const startTime = new Date(startedAt);
const finishTime = new Date(finishedAt);
const durationMs = finishTime.getTime() - startTime.getTime();

// Get the main workflow result (adjust based on your workflow)
const workflowResult = $json; // or $('Previous Node Name').first().$json

return {
  // Correlation
  request_id: requestId,
  execution_id: $workflow.id,
  workflow_name: $workflow.name,
  workflow_version: $workflow.version,

  // Timing / transport
  timestamp: finishedAt,
  http_status: 200,

  // Outcome
  status: 'success',

  // Payload
  data: {
    raw_response: workflowResult,
    parsed: workflowResult // Customize this based on your specific workflow
  },

  // Meta
  meta: {
    env: env,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
    credits_consumed: $('Set Context').first().$node.context.credits_consumed || 0
  }
};
```

## Format Error Function

Use this template in N8N Function nodes to format error responses:

```javascript
// N8N Function Node: Format Error
// Use this in error handling branches

const requestId = $('Set Context').first().$node.context.request_id || 'unknown';
const startedAt = $('Set Context').first().$node.context.started_at || new Date().toISOString();
const env = $('Set Context').first().$node.context.env || 'dev';

const finishedAt = new Date().toISOString();
const startTime = new Date(startedAt);
const finishTime = new Date(finishedAt);
const durationMs = finishTime.getTime() - startTime.getTime();

// Extract error information from the failed node
const errorData = $json;
const hasError = errorData.error || (errorData.statusCode && errorData.statusCode >= 400);

// Determine error type and code based on the error
let errorType = 'internal';
let errorCode = 'INTERNAL_SERVER_ERROR';
let httpStatus = 500;
let retryPossible = true;

if (errorData.statusCode) {
  const status = errorData.statusCode;
  
  if (status === 401 || status === 403) {
    errorType = 'authentication';
    errorCode = status === 401 ? 'INVALID_TOKEN' : 'PERMISSION_DENIED';
    httpStatus = status;
    retryPossible = false;
  } else if (status === 422) {
    errorType = 'validation';
    errorCode = 'VALIDATION_FAILED';
    httpStatus = 422;
    retryPossible = false;
  } else if (status === 429) {
    errorType = 'rate_limited';
    errorCode = 'RATE_LIMIT_EXCEEDED';
    httpStatus = 429;
    retryPossible = true;
  } else if (status >= 500) {
    errorType = 'upstream_http';
    errorCode = 'UPSTREAM_ERROR';
    httpStatus = 502;
    retryPossible = true;
  }
} else if (errorData.error) {
  // Check for specific error patterns
  const errorMessage = errorData.error.message || errorData.error || '';
  
  if (errorMessage.includes('timeout')) {
    errorType = 'upstream_http';
    errorCode = 'UPSTREAM_TIMEOUT';
    httpStatus = 504;
  } else if (errorMessage.includes('validation')) {
    errorType = 'validation';
    errorCode = 'VALIDATION_FAILED';
    httpStatus = 422;
    retryPossible = false;
  } else if (errorMessage.includes('rate limit')) {
    errorType = 'rate_limited';
    errorCode = 'RATE_LIMIT_EXCEEDED';
    httpStatus = 429;
  } else {
    errorType = 'workflow_execution';
    errorCode = 'WORKFLOW_FAILED';
    httpStatus = 500;
  }
}

return {
  // Correlation
  request_id: requestId,
  execution_id: $workflow.id,
  workflow_name: $workflow.name,
  workflow_version: $workflow.version,

  // Timing / transport
  timestamp: finishedAt,
  http_status: httpStatus,

  // Outcome
  status: 'error',

  // Error details
  error: {
    type: errorType,
    code: errorCode,
    message: errorData.error?.message || errorData.error || 'Workflow execution failed',
    details: errorData,
    retry_possible: retryPossible
  },

  // Meta
  meta: {
    env: env,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
    credits_consumed: 0 // No credits consumed on error
  }
};
```

## Set Context Function

Use this at the beginning of your workflows to set up context:

```javascript
// N8N Function Node: Set Context
// Use this as the first node after Webhook trigger

const requestId = crypto.randomUUID();
const startedAt = new Date().toISOString();
const env = process.env.NODE_ENV || 'dev'; // Map to 'prod', 'staging', 'dev'

// Store in node context for later use
$node.context.request_id = requestId;
$node.context.started_at = startedAt;
$node.context.env = env;
$node.context.credits_consumed = $json.credits_to_consume || 0;

return {
  ...($json || {}), // Pass through original data
  __context: {
    request_id: requestId,
    started_at: startedAt,
    env: env
  }
};
```

## IF Node Configuration

Use this expression in IF nodes to detect errors:

```javascript
{{$json.error || ($json.statusCode && $json.statusCode >= 400) || ($json.__ctx?.errors?.length > 0)}}
```

## Webhook Response Configuration

Configure your Webhook Response node as follows:

**Response Body:**
```javascript
{{$json}}
```

**Response Code:**
```javascript
{{$json.http_status || 200}}
```

**Response Headers:**
```json
{
  "Content-Type": "application/json; charset=utf-8",
  "X-Request-Id": "{{$json.request_id}}"
}
```

## Continue On Fail Settings

For risky nodes (HTTP Request, OpenAI, Execute Workflow, etc.), enable:
- ✅ Continue On Fail
- Error Output: Include Error Details

## Example Workflow Structure

```
Webhook In (respond later)
    ↓
Set Context
    ↓
HTTP Request / OpenAI (Continue On Fail = true)
    ↓
IF (check for errors)
   ├── true → Format Error → Webhook Response  
   └── false → Continue processing...
                    ↓
               Format Success → Webhook Response
```

## Partial Success Template

For complex workflows that can partially succeed:

```javascript
// N8N Function Node: Format Partial Success
// Use when some operations succeed but others fail

const requestId = $('Set Context').first().$node.context.request_id || 'unknown';
const startedAt = $('Set Context').first().$node.context.started_at || new Date().toISOString();
const env = $('Set Context').first().$node.context.env || 'dev';

const finishedAt = new Date().toISOString();
const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

// Collect successful and failed operations
const successfulData = $('Successful Operations').all().map(item => item.json);
const failedOperations = $('Failed Operations').all().map(item => item.json);

const warnings = failedOperations.map(failure => ({
  type: 'operation_failed',
  message: failure.error || 'Operation failed',
  field: failure.operation_name
}));

return {
  request_id: requestId,
  execution_id: $workflow.id,
  workflow_name: $workflow.name,
  timestamp: finishedAt,
  http_status: 206, // Partial Content
  status: 'partial_success',
  
  data: {
    raw_response: { successful: successfulData, failed: failedOperations },
    parsed: successfulData // Return successful data
  },
  
  warnings: warnings,
  
  meta: {
    env: env,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
    credits_consumed: $('Set Context').first().$node.context.credits_consumed || 0
  }
};
```