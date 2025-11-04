/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 2 of 2 from src/services/agenticLoop.ts
// Handles processing the stream from the Gemini API.

import type { GenerateContentResponse, FunctionCall, Part } from '@google/genai';
import { getText } from '../../utils/geminiUtils';
import { parseAgenticWorkflow } from '../workflowParser';
import { parseApiError } from '../gemini/index';
import type { StreamProcessorParams, StreamProcessorResult } from './types';

export const processStream = async (params: StreamProcessorParams): Promise<StreamProcessorResult> => {
    const { stream, signal, callbacks, fullModelResponseText, planApproved } = params;
    
    try {
        const functionCallsToProcess: FunctionCall[] = [];
        let currentTurnText = '';
        let lastChunk: GenerateContentResponse | undefined;
        let currentFullText = fullModelResponseText;
        let isPlanApproved = planApproved;

        for await (const chunk of stream) {
            if (signal.aborted) return { status: 'aborted' };
            lastChunk = chunk;
            
            const chunkText = getText(chunk);
            if (chunkText) {
                currentTurnText += chunkText;
                currentFullText += chunkText;
                callbacks.onTextChunk(currentFullText);

                if (!isPlanApproved && currentTurnText.includes('[USER_APPROVAL_REQUIRED]')) {
                    const plan = parseAgenticWorkflow(currentTurnText, [], false);
                    const approvalResult = await callbacks.onPlanReady(plan);
                    
                    if (approvalResult === false) { // Denied
                        return {
                            status: 'error',
                            error: { code: 'USER_DENIED_EXECUTION', message: 'Execution cancelled by user.' }
                        };
                    }
                    
                    isPlanApproved = true;
                    
                    if (typeof approvalResult === 'string') {
                        return {
                            status: 'running',
                            nextAction: 'continue_with_edited_plan',
                            editedPlan: approvalResult,
                            fullText: currentFullText,
                            planApproved: true,
                            modelTurnParts: [{ text: currentTurnText }]
                        };
                    }
                }
            }
            if (chunk.functionCalls) functionCallsToProcess.push(...chunk.functionCalls);
        }
        
        if (signal.aborted) return { status: 'aborted' };

        const modelTurnParts: Part[] = [];
        if (currentTurnText) modelTurnParts.push({ text: currentTurnText });

        if (isPlanApproved && !planApproved && functionCallsToProcess.length === 0) {
            return {
                status: 'running',
                nextAction: 'continue_with_edited_plan', // Re-use this pathway to continue the loop.
                editedPlan: currentTurnText, // The "plan" is the full text received this turn.
                fullText: currentFullText,
                planApproved: true,
                modelTurnParts: [{ text: currentTurnText }]
            };
        }
        
        if (functionCallsToProcess.length > 0) {
            functionCallsToProcess.forEach(fc => modelTurnParts.push({ functionCall: fc }));
            return {
                status: 'running', nextAction: 'continue_with_tools',
                fullText: currentFullText, planApproved: isPlanApproved,
                functionCalls: functionCallsToProcess, modelTurnParts
            };
        }

        const finishReason = lastChunk?.candidates?.[0]?.finishReason;
        if (currentTurnText.trim().endsWith('[AUTO_CONTINUE]') || finishReason === 'MAX_TOKENS') {
             if (finishReason === 'MAX_TOKENS' && !currentTurnText.trim().endsWith('[AUTO_CONTINUE]')) {
                const continueMarker = ' [AUTO_CONTINUE]';
                currentFullText += continueMarker;
                callbacks.onTextChunk(currentFullText);
                currentTurnText += continueMarker;
             }
             return {
                status: 'running', nextAction: 'continue_generation',
                fullText: currentFullText, planApproved: isPlanApproved, currentTurnText
            };
        }
        
        return { status: 'complete', fullText: currentFullText, planApproved: isPlanApproved };

    } catch (error) {
        if (signal.aborted) return { status: 'aborted' };
        console.error("Agentic loop stream processing failed:", error instanceof Error ? error : JSON.stringify(error));
        return { status: 'error', error: parseApiError(error) };
    }
};