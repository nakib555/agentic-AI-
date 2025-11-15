/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";
import { ToolError } from "../utils/apiError.js";
import { executeImageGenerator } from './imageGenerator.js';
import { executeWebSearch } from './webSearch.js';
import { executeAnalyzeMapVisually, executeAnalyzeImageVisually } from './visualAnalysis.js';
import { executeCode } from "./codeExecutor.js";
import { executeVideoGenerator } from "./videoGenerator.js";
import { executeCalculator } from "./calculator.js";
import { executeListFiles, executeDisplayFile, executeDeleteFile, executeWriteFile } from "./fileTools.js";
import { executeDisplayMap } from "./map.js";
import { executeBrowsePage } from "./browser.js";

const generateId = () => Math.random().toString(36).substring(2, 9);

const BACKEND_TOOL_IMPLEMENTATIONS: Record<string, (ai: GoogleGenAI, args: any, apiKey?: string) => Promise<string>> = {
    'generateImage': (ai, args) => executeImageGenerator(ai, args),
    'duckduckgoSearch': (ai, args) => executeWebSearch(ai, args),
    'browsePage': (ai, args) => executeBrowsePage(args),
    'analyzeMapVisually': (ai, args) => executeAnalyzeMapVisually(ai, args),
    'analyzeImageVisually': (ai, args) => executeAnalyzeImageVisually(ai, args),
    'executeCode': (ai, args) => executeCode(args),
    'generateVideo': (ai, args, apiKey) => executeVideoGenerator(ai, args, apiKey!),
    'calculator': (ai, args) => Promise.resolve(executeCalculator(args)),
    'writeFile': (ai, args) => executeWriteFile(args),
    'listFiles': (ai, args) => executeListFiles(args),
    'displayFile': (ai, args) => executeDisplayFile(args),
    'deleteFile': (ai, args) => executeDeleteFile(args),
    'displayMap': (ai, args) => Promise.resolve(executeDisplayMap(args)),
};

const FRONTEND_TOOLS = new Set([
    'getCurrentLocation',
    'requestLocationPermission',
    'captureCodeOutputScreenshot',
    'videoGenerator', // The frontend wrapper for API key check
]);

export const createToolExecutor = (
    ai: GoogleGenAI,
    imageModel: string,
    videoModel: string,
    apiKey: string,
    requestFrontendExecution: (callId: string, toolName: string, toolArgs: any) => Promise<string | { error: string }>
) => {
    return async (name: string, args: any): Promise<string> => {
        console.log(`[TOOL_EXECUTOR] Received request to execute tool: "${name}"`, { args });
        
        // --- Frontend Tool Execution ---
        if (FRONTEND_TOOLS.has(name)) {
            const callId = `${name}-${generateId()}`;
            const result = await requestFrontendExecution(callId, name, args);
            if (typeof result === 'object' && result.error) {
                throw new ToolError(name, 'FRONTEND_EXECUTION_FAILED', result.error);
            }
            return result as string;
        }

        // --- Backend Tool Execution ---
        const toolImplementation = BACKEND_TOOL_IMPLEMENTATIONS[name];
        if (!toolImplementation) {
            console.error(`[TOOL_EXECUTOR] Tool not found: "${name}"`);
            throw new ToolError(name, 'TOOL_NOT_FOUND', `Tool "${name}" is not implemented on the backend.`);
        }

        try {
            // Inject model selections for relevant tools
            let finalArgs = { ...args };
            if (name === 'generateImage') finalArgs.model = imageModel;
            if (name === 'generateVideo') finalArgs.model = videoModel;

            console.log(`[TOOL_EXECUTOR] Executing backend tool "${name}"...`);
            const result = await toolImplementation(ai, finalArgs, apiKey);
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