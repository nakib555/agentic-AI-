
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FunctionCall } from '@google/genai';
import type { MessageError } from './error';
import type { ParsedWorkflow } from './workflow';

export type BrowserSession = {
    url: string;
    title?: string;
    screenshot?: string; // base64
    logs: string[];
    status: 'running' | 'completed' | 'failed';
};

export type ToolCallEvent = {
    id: string;
    call: FunctionCall;
    result?: string;
    startTime?: number;
    endTime?: number;
    browserSession?: BrowserSession; // Live browser state
};

export type Attachment = {
  name: string;
  mimeType: string;
  data: string; // base64 encoded string
};

export type Source = {
  uri: string;
  title: string;
};

// --- Block Types ---

export type BlockStatus = 'running' | 'success' | 'error' | 'completed';

export type ThoughtChainBlock = {
  id: string;
  type: 'thought_chain';
  status: BlockStatus;
  content: string;
  isExpanded?: boolean;
};

export type ToolExecutionBlock = {
  id: string;
  type: 'tool_execution';
  toolName: string;
  status: BlockStatus;
  input: any;
  output?: any;
  variant?: 'code_interpreter' | 'generic';
  timestamp?: number;
};

export type MediaRenderBlock = {
  id: string;
  type: 'media_render';
  status: BlockStatus;
  data: {
    mimeType: string;
    url: string;
    altText?: string;
    filename?: string;
  };
};

export type ComponentRenderBlock = {
  id: string;
  type: 'component_render';
  status: BlockStatus;
  componentType: 'MAP' | 'LOCATION_PERMISSION' | 'VEO_API_KEY';
  data: any;
};

export type FinalTextBlock = {
  id: string;
  type: 'final_text';
  status: BlockStatus;
  content: string;
};

export type ContentBlock = 
  | ThoughtChainBlock 
  | ToolExecutionBlock 
  | MediaRenderBlock 
  | ComponentRenderBlock 
  | FinalTextBlock;

// -------------------

export type ModelResponse = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  error?: MessageError;
  startTime: number;
  endTime?: number;
  suggestedActions?: string[];
  plan?: { plan: string; callId?: string }; 
  groundingMetadata?: any;
  workflow?: ParsedWorkflow;
  historyPayload?: Message[]; 
  
  // Computed property for UI
  contentBlocks?: ContentBlock[];
};

export type UserMessageVersion = {
    text: string;
    attachments?: Attachment[];
    createdAt: number;
    historyPayload?: Message[]; 
};

export type Message = {
  id: string;
  role: 'user' | 'model';

  // --- User Message Properties ---
  text: string; 
  attachments?: Attachment[];
  
  // Branching support for User messages
  versions?: UserMessageVersion[];
  activeVersionIndex?: number;
  
  // --- Model Message Properties ---
  responses?: ModelResponse[]; 
  activeResponseIndex: number; 

  // --- Common State Properties ---
  isThinking?: boolean; 
  isHidden?: boolean;
  isPinned?: boolean;
  executionState?: 'pending_approval' | 'approved' | 'denied';
};
