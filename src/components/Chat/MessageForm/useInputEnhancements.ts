/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This hook manages features that enhance the user's text input,
// such as voice input, prompt enhancement, and proactive suggestions.

import { useState, useEffect } from 'react';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { enhanceUserPromptStream } from '../../../services/promptImprover';
import { PROACTIVE_SUGGESTIONS, isComplexText } from './utils';

export const useInputEnhancements = (
    inputValue: string,
    setInputValue: (value: string) => void,
    hasFiles: boolean,
    onSubmit: (message: string, files?: File[], options?: { isThinkingModeEnabled?: boolean }) => void
) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);

  // --- Voice Input ---
  const { isRecording, startRecording, stopRecording, isSupported } = useVoiceInput({
    onTranscriptUpdate: setInputValue,
  });

  // --- Proactive Suggestions ---
  useEffect(() => {
    if (!hasFiles && isComplexText(inputValue)) {
      setProactiveSuggestions(PROACTIVE_SUGGESTIONS);
    } else {
      setProactiveSuggestions([]);
    }
  }, [inputValue, hasFiles]);

  // --- Event Handlers ---
  const handleEnhancePrompt = async () => {
    const originalPrompt = inputValue;
    if (!originalPrompt.trim() || isEnhancing) return;

    setIsEnhancing(true);
    setInputValue(''); // Clear input once at the start

    let animationFrameId: number | null = null;

    try {
        const stream = enhanceUserPromptStream(originalPrompt);
        let accumulatedText = '';
        let isUpdatePending = false;

        const updateInputValue = () => {
            setInputValue(accumulatedText);
            isUpdatePending = false;
        };

        for await (const chunk of stream) {
            accumulatedText += chunk;
            if (!isUpdatePending) {
                isUpdatePending = true;
                animationFrameId = requestAnimationFrame(updateInputValue);
            }
        }

        // After the loop, ensure the final state is set and cancel any pending frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        setInputValue(accumulatedText); // Set final value
        
        // If the stream was empty or failed, restore the original prompt
        if (!accumulatedText.trim()) {
            setInputValue(originalPrompt);
        }

    } catch (e) {
        console.error("Error during prompt enhancement:", e);
        setInputValue(originalPrompt); // Restore on error
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const formattedMessage = `${suggestion}:\n\`\`\`\n${inputValue}\n\`\`\``;
    // This submission is a special case that bypasses the normal form submission
    // to include the thinking mode option.
    onSubmit(formattedMessage, [], { isThinkingModeEnabled: true });
    setInputValue(''); // Clear input after submitting
  };

  const handleMicClick = () => {
    isRecording ? stopRecording() : (setInputValue(''), startRecording());
  };

  return {
    isEnhancing,
    proactiveSuggestions,
    isRecording,
    startRecording,
    stopRecording,
    isSupported,
    handleEnhancePrompt,
    handleSuggestionClick,
    handleMicClick,
  };
};