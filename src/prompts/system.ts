/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PREAMBLE } from './preamble';
import { AGENTIC_WORKFLOW } from './agenticWorkflow';
import { PERSONA_AND_APP_FORMATTING } from './persona';
import { STYLING_GUIDE } from './styling';
import { TOOLS_OVERVIEW } from './tools';
import { CRITICAL_RULES } from './rules';

// =================================================================================================
// MASTER PROMPT: CORE DIRECTIVES FOR THE AGENTIC AI
// =================================================================================================

export const systemInstruction = [
    PREAMBLE,
    AGENTIC_WORKFLOW,
    PERSONA_AND_APP_FORMATTING,
    STYLING_GUIDE,
    TOOLS_OVERVIEW,
    CRITICAL_RULES,
].join('\n\n');