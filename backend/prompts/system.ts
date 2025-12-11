/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PREAMBLE } from './preamble.js';
import { AGENTIC_WORKFLOW } from './agenticWorkflow.js';
import { PERSONA_AND_UI_FORMATTING } from './persona.js';
import { TOOLS_OVERVIEW } from './tools.js';

// =================================================================================================
// MASTER PROMPT: CORE DIRECTIVES FOR THE AGENTIC AI
// =================================================================================================

export const systemInstruction = [
    PREAMBLE,
    AGENTIC_WORKFLOW,
    PERSONA_AND_UI_FORMATTING,
    TOOLS_OVERVIEW,
].join('\n\n');