
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RenderSegment } from '../types';

/**
 * Parses raw text into component segments (e.g. text vs [IMAGE_COMPONENT]...[/...]).
 * This is used by the frontend to render components dynamically as text is typed.
 */
export const parseContentSegments = (text: string): RenderSegment[] => {
    if (!text) return [];

    // Regex to capture component tags and their content
    const componentRegex = /(\[(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT|CODE_OUTPUT_COMPONENT)\].*?\[\/(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT|CODE_OUTPUT_COMPONENT)\])/s;
    
    const parts = text.split(componentRegex).filter(part => part);

    return parts.map((part): RenderSegment => {
        const componentMatch = part.match(/^\[(VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT|CODE_OUTPUT_COMPONENT)\](\{.*?\})\[\/\1\]$/s);
        
        if (componentMatch) {
            try {
                const typeMap: Record<string, string> = {
                    'VIDEO_COMPONENT': 'VIDEO',
                    'ONLINE_VIDEO_COMPONENT': 'ONLINE_VIDEO',
                    'IMAGE_COMPONENT': 'IMAGE',
                    'ONLINE_IMAGE_COMPONENT': 'ONLINE_IMAGE',
                    'MCQ_COMPONENT': 'MCQ',
                    'MAP_COMPONENT': 'MAP',
                    'FILE_ATTACHMENT_COMPONENT': 'FILE',
                    'BROWSER_COMPONENT': 'BROWSER',
                    'CODE_OUTPUT_COMPONENT': 'CODE_OUTPUT'
                };
                return {
                    type: 'component',
                    componentType: typeMap[componentMatch[1]] as any,
                    data: JSON.parse(componentMatch[2])
                };
            } catch (e) {
                // Fallback if JSON parse fails
                return { type: 'text', content: part };
            }
        }
        
        // Handle any incomplete tags at the end of the stream
        // We strip partial tags to prevent UI glitching during streaming/typing
        const incompleteTagRegex = /\[(VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT|BROWSER_COMPONENT|CODE_OUTPUT_COMPONENT)\].*$/s;
        const cleanedPart = part.replace(incompleteTagRegex, '');
        
        if (!cleanedPart) return null; // Skip empty parts

        return { type: 'text', content: cleanedPart };
    }).filter((s): s is RenderSegment => s !== null);
};
