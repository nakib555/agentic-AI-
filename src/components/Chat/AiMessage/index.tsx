
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useMemo } from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import type { Message, Source } from '../../../types';
import { hydrateContentBlocks } from '../../../utils/blockHydrator';
import { BlockRenderer } from '../Blocks/BlockRenderer';
import { ErrorDisplay } from '../../UI/ErrorDisplay';
import { SuggestedActions } from '../SuggestedActions';
import type { MessageFormHandle } from '../MessageForm/index';
import { useAiMessageLogic } from './useAiMessageLogic';
import { MessageToolbar } from './MessageToolbar';
import { TypingIndicator } from '../TypingIndicator';
import { ExecutionApproval } from '../../AI/ExecutionApproval';

const animationProps = {
  initial: { opacity: 0, y: 10, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 200, damping: 25 },
};

type AiMessageProps = { 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    ttsModel: string;
    currentChatId: string | null;
    onShowSources: (sources: Source[]) => void;
    approveExecution: (editedPlan: string) => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
    onRegenerate: (messageId: string) => void;
    onSetActiveResponseIndex: (messageId: string, index: number) => void;
    isAgentMode: boolean;
    userQuery?: string; 
    isLast?: boolean; 
};

const AiMessageRaw: React.FC<AiMessageProps> = (props) => {
  const { msg, isLoading, sendMessage, ttsVoice, ttsModel, currentChatId, 
          onShowSources, approveExecution, denyExecution, onRegenerate,
          onSetActiveResponseIndex, isLast = false } = props;
  const { id } = msg;

  const logic = useAiMessageLogic(msg, ttsVoice, ttsModel, sendMessage, isLoading);
  const { activeResponse, showApprovalUI } = logic;
  
  // HYDRATION: Convert raw state to Activity Blocks
  const contentBlocks = useMemo(() => hydrateContentBlocks(msg), [msg]);

  const isStoppedByUser = activeResponse?.error?.code === 'STOPPED_BY_USER';
  
  // Show toolbar if we have any completed blocks or an error
  const showToolbar = contentBlocks.length > 0 || !!activeResponse?.error || isStoppedByUser;

  if (contentBlocks.length === 0 && logic.isInitialWait) return <TypingIndicator />;

  return (
    <motion.div 
        {...animationProps} 
        className="w-full flex flex-col items-start gap-2 origin-bottom-left group/message min-w-0"
    >
      {/* 1. Execution Plan Approval UI (Special Case) */}
      {showApprovalUI && activeResponse?.plan && (
          <ExecutionApproval 
            plan={activeResponse.plan} 
            onApprove={approveExecution} 
            onDeny={denyExecution} 
          />
      )}

      {/* 2. Main Block Renderer */}
      <div className="w-full flex flex-col gap-2">
         {contentBlocks.map((block) => (
             <BlockRenderer key={block.id} block={block} sendMessage={sendMessage} />
         ))}
      </div>
      
      {/* 3. Global Error (if not captured in a block) */}
      {activeResponse?.error && !isStoppedByUser && !contentBlocks.some(b => b.type === 'final_text' && b.status === 'error') && (
          <ErrorDisplay error={activeResponse.error} onRetry={() => onRegenerate(id)} />
      )}

      {/* 4. Stopped Indicator */}
      {isStoppedByUser && (
          <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg w-fit"
          >
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Generation Stopped</span>
          </motion.div>
      )}
      
      {/* 5. Suggestions */}
      {isLast && activeResponse?.suggestedActions && activeResponse.suggestedActions.length > 0 && !activeResponse.error && (
            <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                className="w-full overflow-hidden"
            >
                <SuggestedActions actions={activeResponse.suggestedActions} onActionClick={sendMessage} />
            </motion.div>
      )}

      {/* 6. Footer Toolbar */}
      {showToolbar && (
          <div className="w-full mt-2 transition-opacity duration-300">
            <MessageToolbar
                chatId={currentChatId}
                messageId={id}
                messageText={logic.finalAnswerText}
                rawText={activeResponse?.text || ''}
                sources={logic.searchSources}
                onShowSources={onShowSources}
                ttsState={logic.audioState}
                ttsErrorMessage={logic.ttsError}
                onTtsClick={logic.playOrStopAudio}
                onRegenerate={() => onRegenerate(id)}
                responseCount={msg.responses?.length || 0}
                activeResponseIndex={msg.activeResponseIndex}
                onResponseChange={(index) => onSetActiveResponseIndex(id, index)}
            />
          </div>
      )}
    </motion.div>
  );
};

export const AiMessage = memo(AiMessageRaw);
