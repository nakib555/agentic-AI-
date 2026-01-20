
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Message, ContentBlock, ToolCallEvent, MediaRenderBlock, ComponentRenderBlock } from '../types/message';
import { parseMessageText } from './messageParser';
import { parseContentSegments } from './workflowParser';

/**
 * Hydrates the raw message state into a linear list of "Activity Blocks".
 * This bridges the gap between the stream-based backend and the block-based UI.
 */
export const hydrateContentBlocks = (msg: Message): ContentBlock[] => {
    if (msg.role === 'user') return [];
    
    const response = msg.responses?.[msg.activeResponseIndex];
    if (!response) return [];

    const blocks: ContentBlock[] = [];
    const isThinking = msg.isThinking ?? false;
    const hasError = !!response.error;

    // 1. Thought Chain (The Brain)
    // We treat the "thinking text" or the "plan" as the thought chain.
    const { thinkingText, finalAnswerText } = parseMessageText(response.text, isThinking, hasError);
    const planText = response.workflow?.plan || '';
    
    // Combine Plan and Thinking into one reasoning block if they exist
    const rawThoughtContent = [planText, thinkingText].filter(t => t.trim()).join('\n\n---\n\n').trim();
    
    if (rawThoughtContent) {
        blocks.push({
            id: 'thought-chain',
            type: 'thought_chain',
            status: (isThinking && !finalAnswerText) ? 'running' : 'completed',
            content: rawThoughtContent,
            isExpanded: false
        });
    }

    // 2. Tool Executions & Artifacts (The Action)
    if (response.toolCallEvents && response.toolCallEvents.length > 0) {
        response.toolCallEvents.forEach((event: ToolCallEvent) => {
            const isCode = event.call.name === 'executeCode';
            
            // A. Tool Card
            blocks.push({
                id: `tool-${event.id}`,
                type: 'tool_execution',
                toolName: event.call.name || 'Unknown Tool',
                status: event.result ? (event.result.startsWith('Tool execution failed') ? 'error' : 'success') : 'running',
                input: event.call.args,
                output: event.result,
                variant: isCode ? 'code_interpreter' : 'generic',
                timestamp: event.endTime
            });

            // B. Artifacts (Media/Components derived from tool results)
            if (event.result) {
                // Check for Visual Component Tags in the result string
                const componentMatches = parseComponentTags(event.result);
                componentMatches.forEach((comp, idx) => {
                    blocks.push(comp);
                });
            }
        });
    }

    // 3. Final Text (The Voice) - Parsed into Text + Component Blocks
    if (finalAnswerText) {
        const segments = parseContentSegments(finalAnswerText);
        
        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1;
            // A block is "running" (streaming) only if it's the last one and the message is still thinking
            const blockStatus = (isThinking && !hasError && isLast) ? 'running' : 'completed';
            const blockId = `final-content-${index}`;

            if (segment.type === 'text') {
                if (segment.content) {
                     blocks.push({
                        id: blockId,
                        type: 'final_text',
                        status: blockStatus,
                        content: segment.content
                    });
                }
            } else if (segment.type === 'component') {
                const { componentType, data } = segment;
                
                // Fixed: Check for 'FILE' which is the correct internal type from parser, not 'FILE_ATTACHMENT'
                if (componentType === 'IMAGE' || componentType === 'VIDEO' || componentType === 'ONLINE_IMAGE' || componentType === 'ONLINE_VIDEO' || componentType === 'FILE') { 
                     blocks.push({
                        id: blockId,
                        type: 'media_render',
                        status: 'success',
                        data: {
                            mimeType: data.mimeType || (componentType.includes('VIDEO') ? 'video/mp4' : 'image/png'),
                            url: data.srcUrl || data.url,
                            altText: data.alt || data.prompt || data.filename,
                            filename: data.filename
                        }
                    });
                } else if (['MAP', 'BROWSER', 'CODE_OUTPUT', 'LOCATION_PERMISSION', 'VEO_API_KEY'].includes(componentType || '')) {
                     blocks.push({
                        id: blockId,
                        type: 'component_render',
                        status: 'success',
                        componentType: componentType as any,
                        data: data
                    });
                }
            }
        });
    }
    
    // If we have an error and no text, show it as a block
    if (hasError && !finalAnswerText) {
        blocks.push({
            id: 'error-block',
            type: 'final_text',
            status: 'error',
            content: `**Error:** ${response.error?.message}`
        });
    }

    return blocks;
};

// Helper to extract component tags from Tool Results into Blocks
// Note: This logic duplicates parseContentSegments slightly but is kept for Tool Result strings specifically which might not be full workflow text.
const parseComponentTags = (text: string): (MediaRenderBlock | ComponentRenderBlock)[] => {
    const blocks: (MediaRenderBlock | ComponentRenderBlock)[] = [];
    
    // Regex for [TAG]{json}[/TAG]
    const regex = /\[(IMAGE_COMPONENT|VIDEO_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|LOCATION_PERMISSION_REQUEST|BROWSER_COMPONENT|CODE_OUTPUT_COMPONENT)\](.*?)\[\/\1\]/gs;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const tag = match[1];
        const content = match[2];
        const id = `comp-${Math.random().toString(36).substr(2, 9)}`;

        try {
            if (tag === 'LOCATION_PERMISSION_REQUEST') {
                blocks.push({
                    id,
                    type: 'component_render',
                    status: 'success',
                    componentType: 'LOCATION_PERMISSION',
                    data: { text: content }
                });
                continue;
            }

            const json = JSON.parse(content);

            if (tag === 'IMAGE_COMPONENT' || tag === 'VIDEO_COMPONENT' || tag === 'FILE_ATTACHMENT_COMPONENT') {
                blocks.push({
                    id,
                    type: 'media_render',
                    status: 'success',
                    data: {
                        mimeType: json.mimeType || (tag === 'VIDEO_COMPONENT' ? 'video/mp4' : 'image/png'),
                        url: json.srcUrl || json.url,
                        altText: json.alt || json.prompt || json.filename,
                        filename: json.filename
                    }
                });
            } else if (tag === 'MAP_COMPONENT') {
                blocks.push({
                    id,
                    type: 'component_render',
                    status: 'success',
                    componentType: 'MAP',
                    data: json
                });
            } else if (tag === 'BROWSER_COMPONENT') {
                blocks.push({
                    id,
                    type: 'component_render',
                    status: 'success',
                    componentType: 'BROWSER',
                    data: json
                });
            } else if (tag === 'CODE_OUTPUT_COMPONENT') {
                blocks.push({
                    id,
                    type: 'component_render',
                    status: 'success',
                    componentType: 'CODE_OUTPUT',
                    data: json
                });
            }

        } catch (e) {
            console.error("Failed to parse component block", e);
        }
    }
    return blocks;
};
