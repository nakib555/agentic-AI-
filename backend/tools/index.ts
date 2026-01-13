
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError";
import { executeImageGenerator } from './imageGenerator';
import { executeWebSearch } from './webSearch';
import { executeAnalyzeMapVisually, executeAnalyzeImageVisually } from './visualAnalysis';
import { executeCode } from "./codeExecutor";
import { executeVideoGenerator } from "./videoGenerator";
import { executeCalculator } from "./calculator";
import { executeListFiles, executeDisplayFile, executeDeleteFile, executeWriteFile } from "./fileTools";
import { executeDisplayMap } from "./map";
import { executeBrowser } from "./browser";

const generateId = () => Math.random().toString(36).substring(2, 9);

// Custom type for tool executor config
type ToolExecutorConfig = {
    provider: 'gemini' | 'openrouter';
    googleAI?: GoogleGenAI;
    apiKey: string;
    imageModel: string;
    videoModel: string;
    chatId: string;
    requestFrontendExecution: (callId: string, toolName: string, toolArgs: any) => Promise<string | { error: string }>;
    skipFrontendCheck?: boolean;
    onToolUpdate?: (id: string, data: any) => void;
};

type ToolImplementation = (
    args: any, 
    config: ToolExecutorConfig,
    onUpdate?: (data: any) => void
) => Promise<string>;

const BACKEND_TOOL_IMPLEMENTATIONS: Record<string, ToolImplementation> = {
    'generateImage': (args, config) => executeImageGenerator(config.googleAI!, args, config.chatId, config.provider, config.apiKey),
    'duckduckgoSearch': (args, config) => {
        // Search usually needs Gemini for summarization, fallback to simple search if no Gemini?
        // For now, if user is on OpenRouter, they might not have GoogleAI. 
        // We will need to update webSearch to support OpenRouter summarizer or just basic results.
        // Assuming GoogleAI is available via suggestion key, if not we throw for now or need refactor.
        if (!config.googleAI) throw new Error("Gemini API Key required for Search Summarization.");
        return executeWebSearch(config.googleAI, args);
    },
    'browser': (args, config, onUpdate) => executeBrowser(args, onUpdate),
    'analyzeMapVisually': (args, config) => {
         if (!config.googleAI) throw new Error("Gemini API Key required for Map Analysis.");
         return executeAnalyzeMapVisually(config.googleAI, args);
    },
    'analyzeImageVisually': (args, config) => {
         if (!config.googleAI) throw new Error("Gemini API Key required for Image Analysis.");
         return executeAnalyzeImageVisually(config.googleAI, args, config.chatId);
    },
    'executeCode': (args, config) => executeCode(args, config.chatId),
    'generateVideo': (args, config) => executeVideoGenerator(config.googleAI!, args, config.apiKey, config.chatId, config.provider),
    'calculator': (args) => Promise.resolve(executeCalculator(args)),
    'writeFile': (args, config) => executeWriteFile(args, config.chatId),
    'listFiles': (args, config) => executeListFiles(args, config.chatId),
    'displayFile': (args, config) => executeDisplayFile(args, config.chatId),
    'deleteFile': (args, config) => executeDeleteFile(args, config.chatId),
    'displayMap': (args) => Promise.resolve(executeDisplayMap(args)),
};

const FRONTEND_TOOLS = new Set([
    'getCurrentLocation',
    'requestLocationPermission',
    'captureCodeOutputScreenshot',
    'generateVideo',
]);

export const createToolExecutor = (config: ToolExecutorConfig) => {
    return async (name: string, args: any, id: string): Promise<string> => {
        console.log(`[TOOL_EXECUTOR] Received request to execute tool: "${name}"`, { args, chatId: config.chatId, id });
        
        if (!config.skipFrontendCheck && FRONTEND_TOOLS.has(name)) {
            const callId = id || `${name}-${generateId()}`;
            const result = await config.requestFrontendExecution(callId, name, args);
            if (typeof result === 'object' && result.error) {
                throw new ToolError(name, 'FRONTEND_EXECUTION_FAILED', result.error);
            }
            return result as string;
        }

        const toolImplementation = BACKEND_TOOL_IMPLEMENTATIONS[name];
        if (!toolImplementation) {
            console.error(`[TOOL_EXECUTOR] Tool not found: "${name}"`);
            throw new ToolError(name, 'TOOL_NOT_FOUND', `Tool "${name}" is not implemented on the backend.`);
        }

        try {
            let finalArgs = { ...args };
            // Inject model overrides from settings if provided
            if (name === 'generateImage' && config.imageModel) finalArgs.model = config.imageModel;
            if (name === 'generateVideo' && config.videoModel) finalArgs.model = config.videoModel;

            console.log(`[TOOL_EXECUTOR] Executing backend tool "${name}"...`);
            
            const boundUpdate = config.onToolUpdate ? (data: any) => config.onToolUpdate!(id, data) : undefined;
            
            const result = await toolImplementation(finalArgs, config, boundUpdate);
            console.log(`[TOOL_EXECUTOR] Backend tool "${name}" finished successfully.`);
            return result;
        } catch (err) {
            console.error(`[TOOL_EXECUTOR] Backend tool "${name}" failed.`, { err });
            if (err instanceof ToolError) throw err;
            const originalError = err instanceof Error ? err : new Error(String(err));
            throw new ToolError(name, 'BACKEND_EXECUTION_FAILED', originalError.message, originalError);
        }
    };
};
