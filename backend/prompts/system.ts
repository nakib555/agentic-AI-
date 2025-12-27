/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PREAMBLE } from './preamble.ts';
import { AGENTIC_WORKFLOW } from './agenticWorkflow.ts';
import { PERSONA_AND_UI_FORMATTING } from './persona.ts';
import { TOOLS_OVERVIEW } from './tools.ts';

// =================================================================================================
// MASTER PROMPT: CORE DIRECTIVES FOR THE AGENTIC AI
// =================================================================================================

export const systemInstruction = [
    PREAMBLE,
    AGENTIC_WORKFLOW,
    PERSONA_AND_UI_FORMATTING,
    TOOLS_OVERVIEW,
].join('\n\n');