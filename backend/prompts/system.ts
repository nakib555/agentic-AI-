
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PERSONA_AND_UI_FORMATTING } from './persona';

// =================================================================================================
// MASTER PROMPT: CORE DIRECTIVES FOR THE AI CHAT
// =================================================================================================

export const systemInstruction = [
    PERSONA_AND_UI_FORMATTING,
].join('\n\n');
