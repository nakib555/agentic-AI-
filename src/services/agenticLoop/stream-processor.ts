
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StreamCallbacks {
    onStart?: (requestId: string) => void;
    onTextChunk: (text: string) => void;
    onWorkflowUpdate: (workflow: any) => void;
    onToolCallStart: (events: any[]) => void;
    onToolUpdate: (event: any) => void;
    onToolCallEnd: (event: any) => void;
    onPlanReady: (plan: string) => void;
    onFrontendToolRequest: (callId: string, name: string, args: any) => void;
    onComplete: (data: { finalText: string, groundingMetadata: any }) => void;
    onError: (error: any) => void;
    onCancel?: () => void;
}

/**
 * Processes a streaming response from the backend API.
 * Uses requestAnimationFrame to buffer rapid text updates for UI performance.
 */
export const processBackendStream = async (response: Response, callbacks: StreamCallbacks, signal?: AbortSignal) => {
    if (!response.body) {
        throw new Error("Response body is missing");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // --- Performance Optimization: Buffered State Updates ---
    // Use requestAnimationFrame to buffer rapid text chunks and update state only once per frame (approx 60fps).
    // This prevents the React render cycle from choking on high-speed token streams.
    let pendingText: string | null = null;
    let animationFrameId: number | null = null;

    const flushTextUpdates = () => {
        if (pendingText !== null) {
            callbacks.onTextChunk(pendingText);
            pendingText = null;
        }
        animationFrameId = null;
    };

    try {
        while (true) {
            if (signal?.aborted) {
                reader.cancel();
                break;
            }

            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last line in the buffer if it's incomplete
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const event = JSON.parse(line);
                    
                    // Prioritize text chunks for the buffering optimization
                    if (event.type === 'text-chunk') {
                        // ACCUMULATE deltas instead of replacing
                        pendingText = (pendingText || '') + event.payload; 
                        if (animationFrameId === null) {
                            animationFrameId = requestAnimationFrame(flushTextUpdates);
                        }
                        continue;
                    }

                    // For all other events, flush pending text first to ensure order consistency
                    if (pendingText !== null) {
                        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
                        flushTextUpdates();
                    }

                    switch (event.type) {
                        case 'start':
                            callbacks.onStart?.(event.payload?.requestId);
                            break;
                        case 'ping':
                            // Keep-alive, ignore
                            break;
                        case 'workflow-update':
                            callbacks.onWorkflowUpdate(event.payload);
                            break;
                        case 'tool-call-start':
                            callbacks.onToolCallStart(event.payload);
                            break;
                        case 'tool-update':
                            callbacks.onToolUpdate(event.payload);
                            break;
                        case 'tool-call-end':
                            callbacks.onToolCallEnd(event.payload);
                            break;
                        case 'plan-ready':
                            callbacks.onPlanReady(event.payload);
                            break;
                        case 'frontend-tool-request':
                            callbacks.onFrontendToolRequest(event.payload.callId, event.payload.toolName, event.payload.toolArgs);
                            break;
                        case 'complete':
                            callbacks.onComplete(event.payload);
                            break;
                        case 'error':
                            callbacks.onError(event.payload);
                            break;
                        case 'cancel':
                            callbacks.onCancel?.();
                            break;
                        default:
                            console.warn(`[StreamProcessor] Unknown event type: ${event.type}`);
                    }
                } catch(e) {
                    console.error("[StreamProcessor] Failed to parse stream event:", line, e);
                }
            }
        }
    } finally {
        // Cleanup any pending animation frame on stream end/error/close
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            flushTextUpdates();
        }
        reader.releaseLock();
    }
};
