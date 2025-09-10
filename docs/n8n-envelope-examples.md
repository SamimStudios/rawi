# N8N Envelope Response Examples

This document provides example responses for different scenarios using the N8N Response Envelope.

## Success Response Example

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "execution_id": "12345",
  "workflow_name": "generate-movie-info",
  "workflow_version": "1.0",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "http_status": 200,
  "status": "success",
  "data": {
    "raw_response": {
      "movie_info": {
        "title": "The Last Guardian",
        "logline": "A young warrior must protect an ancient artifact",
        "world": "Post-apocalyptic Earth with mystical elements",
        "look": "Dark and gritty with ethereal lighting"
      }
    },
    "parsed": {
      "movie_info": {
        "title": "The Last Guardian",
        "logline": "A young warrior must protect an ancient artifact",
        "world": "Post-apocalyptic Earth with mystical elements",
        "look": "Dark and gritty with ethereal lighting"
      }
    }
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T10:30:42.000Z",
    "finished_at": "2024-01-15T10:30:45.123Z",
    "duration_ms": 3123,
    "credits_consumed": 2.5
  }
}
```

## Error Response - Insufficient Credits

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-01-15T10:35:20.456Z",
  "http_status": 402,
  "status": "error",
  "error": {
    "type": "credits",
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits. Required: 2.5, Available: 1.0",
    "details": {
      "required_credits": 2.5,
      "available_credits": 1.0
    },
    "retry_possible": true
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T10:35:20.100Z",
    "finished_at": "2024-01-15T10:35:20.456Z",
    "duration_ms": 356,
    "credits_consumed": 0
  }
}
```

## Error Response - Validation Failed

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440002",
  "execution_id": "12346",
  "workflow_name": "validate-movie-info",
  "timestamp": "2024-01-15T10:40:12.789Z",
  "http_status": 422,
  "status": "error",
  "error": {
    "type": "validation",
    "code": "VALIDATION_FAILED",
    "message": "Movie title is too short and logline is missing",
    "details": {
      "field_errors": {
        "title": "Must be at least 3 characters",
        "logline": "This field is required"
      }
    },
    "retry_possible": false
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T10:40:10.000Z",
    "finished_at": "2024-01-15T10:40:12.789Z",
    "duration_ms": 2789,
    "credits_consumed": 0
  }
}
```

## Error Response - Rate Limited

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440003",
  "execution_id": "12347",
  "workflow_name": "generate-characters",
  "timestamp": "2024-01-15T10:45:30.123Z",
  "http_status": 429,
  "status": "error",
  "error": {
    "type": "rate_limited",
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Try again in 60 seconds",
    "details": {
      "retry_after": 60,
      "rate_limit_type": "requests_per_minute",
      "current_usage": 100,
      "limit": 100
    },
    "retry_possible": true
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T10:45:28.000Z",
    "finished_at": "2024-01-15T10:45:30.123Z",
    "duration_ms": 2123,
    "credits_consumed": 0
  }
}
```

## Error Response - Webhook Connectivity

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440004",
  "timestamp": "2024-01-15T10:50:15.678Z",
  "http_status": 503,
  "status": "error",
  "error": {
    "type": "webhook_connectivity",
    "code": "WEBHOOK_TIMEOUT",
    "message": "Webhook endpoint not accessible: Connection timeout after 5000ms",
    "details": {
      "webhook_url": "https://n8n.example.com/webhook/generate-movie-info",
      "timeout_ms": 5000,
      "test_error": "Connection timeout"
    },
    "retry_possible": true
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T10:50:10.000Z",
    "finished_at": "2024-01-15T10:50:15.678Z",
    "duration_ms": 5678,
    "credits_consumed": 0
  }
}
```

## Error Response - Workflow Execution Failed

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440005",
  "execution_id": "12348",
  "workflow_name": "generate-timeline",
  "timestamp": "2024-01-15T10:55:45.234Z",
  "http_status": 500,
  "status": "error",
  "error": {
    "type": "workflow_execution",
    "code": "NODE_EXECUTION_FAILED",
    "message": "OpenAI node failed: Model 'gpt-5' is currently unavailable",
    "details": {
      "failed_node": "OpenAI",
      "node_error": "Model 'gpt-5' is currently unavailable",
      "execution_step": 3
    },
    "retry_possible": true
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T10:55:40.000Z",
    "finished_at": "2024-01-15T10:55:45.234Z",
    "duration_ms": 5234,
    "credits_consumed": 0
  }
}
```

## Partial Success Response

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440006",
  "execution_id": "12349",
  "workflow_name": "generate-characters",
  "timestamp": "2024-01-15T11:00:30.567Z",
  "http_status": 206,
  "status": "partial_success",
  "data": {
    "raw_response": {
      "successful": [
        {
          "character_id": "lead",
          "name": "Sarah Connor",
          "description": "Battle-hardened survivor"
        }
      ],
      "failed": [
        {
          "character_id": "supporting_1",
          "error": "Character generation failed due to content policy"
        }
      ]
    },
    "parsed": {
      "characters": {
        "lead": {
          "name": "Sarah Connor",
          "description": "Battle-hardened survivor"
        }
      }
    }
  },
  "warnings": [
    {
      "type": "character_generation_failed",
      "message": "Supporting character generation failed due to content policy",
      "field": "supporting_characters[0]"
    }
  ],
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T11:00:25.000Z",
    "finished_at": "2024-01-15T11:00:30.567Z",
    "duration_ms": 5567,
    "credits_consumed": 1.5
  }
}
```

## Validation Success Response

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440007",
  "execution_id": "12350",
  "workflow_name": "validate-movie-info",
  "timestamp": "2024-01-15T11:05:15.890Z",
  "http_status": 200,
  "status": "success",
  "data": {
    "raw_response": {
      "valid": true,
      "validation_score": 0.92,
      "feedback": "Excellent movie concept with strong narrative elements"
    },
    "parsed": {
      "valid": true,
      "validation_score": 0.92,
      "feedback": "Excellent movie concept with strong narrative elements"
    }
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T11:05:14.000Z",
    "finished_at": "2024-01-15T11:05:15.890Z",
    "duration_ms": 1890,
    "credits_consumed": 0.5
  }
}
```

## Validation Failed Response

```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440008",
  "execution_id": "12351",
  "workflow_name": "validate-movie-info",
  "timestamp": "2024-01-15T11:10:22.345Z",
  "http_status": 200,
  "status": "success",
  "data": {
    "raw_response": {
      "valid": false,
      "reason": {
        "en": "The logline lacks clear conflict and stakes",
        "ar": "السيناريو يفتقر إلى الصراع والمخاطر الواضحة"
      },
      "suggested_fix": {
        "logline": "A young warrior must protect an ancient artifact from dark forces threatening to destroy the world"
      }
    },
    "parsed": {
      "valid": false,
      "reason": {
        "en": "The logline lacks clear conflict and stakes",
        "ar": "السيناريو يفتقر إلى الصراع والمخاطر الواضحة"
      },
      "suggested_fix": {
        "logline": "A young warrior must protect an ancient artifact from dark forces threatening to destroy the world"
      }
    }
  },
  "meta": {
    "env": "prod",
    "started_at": "2024-01-15T11:10:20.000Z",
    "finished_at": "2024-01-15T11:10:22.345Z",
    "duration_ms": 2345,
    "credits_consumed": 0.5
  }
}
```

## Frontend Usage Examples

### TypeScript Usage

```typescript
import { N8NResponseEnvelope, isSuccessfulEnvelope, getErrorCode } from '@/types/n8n-envelope';

// Execute function and handle envelope
const handleGeneration = async () => {
  try {
    const result = await executeFunction('generate-movie-info', payload);
    const envelope: N8NResponseEnvelope = result.envelope;
    
    if (isSuccessfulEnvelope(envelope)) {
      // Handle success
      const movieInfo = envelope.data?.parsed?.movie_info;
      setMovieData(movieInfo);
      
      toast({
        title: "Success",
        description: "Movie information generated successfully"
      });
    } else if (envelope.status === 'partial_success') {
      // Handle partial success
      const movieInfo = envelope.data?.parsed?.movie_info;
      setMovieData(movieInfo);
      
      // Show warnings
      envelope.warnings?.forEach(warning => {
        toast({
          title: "Warning",
          description: warning.message,
          variant: "destructive"
        });
      });
    }
  } catch (error) {
    // Error already handled by executeFunction
    console.error('Generation failed:', error);
  }
};

// Error handling based on error codes
const handleError = (envelope: N8NResponseEnvelope) => {
  const errorCode = getErrorCode(envelope);
  
  switch (errorCode) {
    case 'INSUFFICIENT_CREDITS':
      // Redirect to billing
      break;
    case 'VALIDATION_FAILED':
      // Show validation errors
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Show retry timer
      break;
    default:
      // Generic error handling
      break;
  }
};
```