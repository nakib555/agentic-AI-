
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, memo, useMemo } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import type { Message, Source } from '../../../types';
import { MarkdownComponents } from '../../Markdown/markdownComponents';
import { ErrorDisplay } from '../../UI/ErrorDisplay';
import { ImageDisplay } from '../../AI/ImageDisplay';
import { VideoDisplay } from '../../AI/VideoDisplay';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { TypingIndicator } from '../TypingIndicator';
import { McqComponent } from '../../AI/McqComponent';
import { MapDisplay } from '../../AI/MapDisplay';
import { FileAttachment } from '../../AI/FileAttachment';
import { SuggestedActions } from '../SuggestedActions';
import { ExecutionApproval } from '../../AI/ExecutionApproval';
import type { MessageFormHandle } from '../MessageForm/index';
import { useAiMessageLogic } from './useAiMessageLogic';
import { MessageToolbar } from './MessageToolbar';
import { ThinkingWorkflow } from '../../AI/ThinkingWorkflow';
import { FormattedBlock } from '../../Markdown/FormattedBlock';
import { BrowserSessionDisplay } from '../../AI/BrowserSessionDisplay';
import { useTypewriter } from '../../../hooks/useTypewriter';
import { parseContentSegments } from '../../../utils/workflowParsing';
import { ThinkingProcess } from './ThinkingProcess';

// Optimized spring physics for performance
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
};

const AiMessageRaw: React.FC<AiMessageProps> = (props) => {
  const { msg, isLoading, sendMessage, ttsVoice, ttsModel, currentChatId, 
          onShowSources, approveExecution, denyExecution, messageFormRef, onRegenerate,
          onSetActiveResponseIndex, isAgentMode } = props;
  const { id } = msg;

  const logic = useAiMessageLogic(msg, ttsVoice, ttsModel, sendMessage, isLoading);
  const { activeResponse, finalAnswerText, thinkingIsComplete, agentPlan, executionLog, thinkingText } = logic;
  
  // Default to collapsed if finished, open if thinking
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(!thinkingIsComplete);

  // Apply typewriter effect to the final answer text.
  const typedFinalAnswer = useTypewriter(finalAnswerText, msg.isThinking ?? false);

  // Dynamic Parsing: Parse the *typed* text into segments.
  const displaySegments = useMemo(() => {
      return parseContentSegments(typedFinalAnswer);
  }, [typedFinalAnswer]);

  // Auto-collapse workflow when thinking is complete if there is a final answer
  useEffect(() => {
      if (thinkingIsComplete && finalAnswerText) {
          setIsWorkflowOpen(false);
      }
  }, [thinkingIsComplete, !!finalAnswerText]);

  // Handler for editing images, used by ImageDisplay components
  const handleEditImage = (blob: Blob, editKey: string) => {
      const file = new File([blob], "image-to-edit.png", { type: blob.type });
      (file as any)._editKey = editKey;
      messageFormRef.current?.attachFiles([file]);
  };

  if (logic.isInitialWait) return <TypingIndicator />;

  if (logic.showApprovalUI && activeResponse?.plan) {
    return <ExecutionApproval plan={activeResponse.plan} onApprove={approveExecution} onDeny={denyExecution} />;
  }

  return (
    <motion.div 
        {...animationProps} 
        className="w-full flex flex-col items-start gap-3 origin-bottom-left group/message"
    >
      {/* --- Agentic Workflow (The Brain) --- */}
      {logic.hasWorkflow && (
        <div className="w-full">
            <motion.button
                onClick={() => setIsWorkflowOpen(!isWorkflowOpen)}
                className={`
                    group relative flex items-center gap-3 px-3 py-1.5 rounded-full border transition-all duration-300 ease-out w-fit
                    ${isWorkflowOpen 
                        ? 'bg-indigo-50/50 border-indigo-100 dark:bg-white/5 dark:border-white/10' 
                        : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                    }
                `}
                whileTap={{ scale: 0.98 }}
            >
                <div className="relative flex items-center justify-center w-5 h-5">
                    {logic.thinkingIsComplete ? (
                        <div className="text-emerald-500 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                    ) : (
                        <>
                            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400/20 animate-ping"></span>
                            <div className="relative w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                        </>
                    )}
                </div>
                
                <span className={`text-xs font-medium tracking-wide transition-colors ${isWorkflowOpen ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>
                    {logic.thinkingIsComplete 
                        ? `Reasoned for ${logic.displayDuration}s` 
                        : 'Thinking...'}
                </span>

                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isWorkflowOpen ? 'rotate-180' : ''}`}
                >
                    <path d="m6 9 6 6 6-6"/>
                </svg>
            </motion.button>
            
            <AnimatePresence initial={false}>
                {isWorkflowOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // Elegant ease
                        className="overflow-hidden"
                    >
                        <div className="pl-2 pr-4 pt-3 pb-6 space-y-4">
                            {agentPlan && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Mission Plan</span>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 p-3">
                                        <FormattedBlock content={agentPlan} isStreaming={msg.isThinking && executionLog.length === 0} />
                                    </div>
                                </div>
                            )}
                            
                            {executionLog.length > 0 && (
                                <ThinkingWorkflow
                                    nodes={executionLog}
                                    sendMessage={sendMessage}
                                    onRegenerate={() => onRegenerate(id)}
                                    messageId={id}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      )}
      
      {/* --- Chain of Thought (Raw Stream) --- */}
      {logic.hasThinkingText && (
          <ThinkingProcess 
              thinkingText={thinkingText} 
              isThinking={!logic.thinkingIsComplete} 
          />
      )}
      
      {/* --- Final Output --- */}
      {(logic.hasFinalAnswer || activeResponse?.error || logic.isWaitingForFinalAnswer) && (
        <div className="w-full flex flex-col gap-3">
          {logic.isWaitingForFinalAnswer && <TypingIndicator />}
          {activeResponse?.error && <ErrorDisplay error={activeResponse.error} onRetry={() => onRegenerate(id)} />}
          
          <div className="markdown-content max-w-none w-full text-slate-800 dark:text-gray-100 leading-relaxed">
            {displaySegments.map((segment, index) => {
                const key = `${id}-${index}`;
                if (segment.type === 'component') {
                    const { componentType, data } = segment;
                    switch (componentType) {
                        case 'VIDEO':
                            return <VideoDisplay key={key} {...data} />;
                        case 'ONLINE_VIDEO':
                            return <VideoDisplay key={key} srcUrl={data.url} prompt={data.title} />;
                        case 'IMAGE':
                        case 'ONLINE_IMAGE':
                            return <ImageDisplay key={key} onEdit={handleEditImage} {...data} />;
                        case 'MCQ':
                            return <McqComponent key={key} {...data} />;
                        case 'MAP':
                            return (
                                <motion.div key={key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                    <MapDisplay {...data} />
                                </motion.div>
                            );
                        case 'FILE':
                            return <FileAttachment key={key} {...data} />;
                        case 'BROWSER':
                            return <BrowserSessionDisplay key={key} {...data} />;
                        case 'CODE_OUTPUT':
                            return null; 
                        default:
                            return <ErrorDisplay key={key} error={{ message: `Unknown component type: ${componentType}`, details: JSON.stringify(data) }} />;
                    }
                } else {
                    return (
                        <ManualCodeRenderer 
                            key={key} 
                            text={segment.content!} 
                            components={MarkdownComponents} 
                            isStreaming={msg.isThinking ?? false} 
                            onRunCode={isAgentMode ? logic.handleRunCode : undefined} 
                            isRunDisabled={isLoading} 
                        />
                    );
                }
            })}
          </div>
        </div>
      )}
      
      {logic.thinkingIsComplete && logic.hasFinalAnswer && !activeResponse?.error && (
          <div className="w-full opacity-0 group-hover/message:opacity-100 transition-opacity duration-300 delay-150">
            <MessageToolbar
                messageId={id}
                messageText={logic.finalAnswerText}
                rawText={activeResponse?.text || ''}
                sources={logic.searchSources}
                onShowSources={onShowSources}
                ttsState={logic.audioState}
                onTtsClick={logic.playOrStopAudio}
                onRegenerate={() => onRegenerate(id)}
                responseCount={msg.responses?.length || 0}
                activeResponseIndex={msg.activeResponseIndex}
                onResponseChange={(index) => onSetActiveResponseIndex(id, index)}
            />
          </div>
      )}

      {logic.thinkingIsComplete && activeResponse?.suggestedActions && activeResponse.suggestedActions.length > 0 && !activeResponse.error && (
         <div className="w-full"><SuggestedActions actions={activeResponse.suggestedActions} onActionClick={sendMessage} /></div>
      )}
    </motion.div>
  );
};

export const AiMessage = memo(AiMessageRaw);
