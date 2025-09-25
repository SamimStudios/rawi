// Core hybrid address system types

// Basic types
export type JobID = string;
export type NodeID = string;
export type LtreePath = string;
export type JsonDotPath = string;
export type HybridAddr = string;

// Hybrid address format: "ltree.path#json.dot.path"
export interface ParsedHybridAddr {
  ltreePath: LtreePath;
  jsonKeys: string[];
}

// Interpolation context for templates
export interface InterpCtx {
  job?: {
    id: JobID;
    [key: string]: any;
  };
  node?: {
    id: NodeID;
    path: LtreePath;
    [key: string]: any;
  };
  instance?: {
    id: string;
    path: string;
    index: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// Instance-specific types
export interface InstancePath {
  basePath: LtreePath;
  instanceId: string;
  instanceIndex?: number;
}

export interface InstanceContext {
  instanceId: string;
  instanceIndex: number;
  collectionPath: LtreePath;
  instancePath: LtreePath;
}

// Service layer types
export interface HybridAddrOptions {
  jobId: JobID;
  address: HybridAddr;
}

export interface SetValueOptions extends HybridAddrOptions {
  value: any;
}

export interface PayloadOptions {
  jobId: JobID;
  targetAddr: HybridAddr;
  payload: Record<string, any>;
  context?: InterpCtx;
}

// Hook return types
export interface UseHybridValueResult {
  value: any;
  setValue: (newValue: any) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UsePayloadResult {
  pushPayload: (payload: Record<string, any>, context?: InterpCtx) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Error types
export interface RpcError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Validation types
export type AddressValidation = {
  isValid: boolean;
  error?: string;
  parsed?: ParsedHybridAddr;
};

// Collection operations
export interface CollectionOperation {
  type: 'add' | 'remove' | 'update' | 'reorder';
  instanceId?: string;
  instanceIndex?: number;
  data?: any;
}

export interface CollectionState {
  instances: Array<{
    id: string;
    path: string;
    data: any;
  }>;
  count: number;
}