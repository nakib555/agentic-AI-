
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
  const [isWorkflowCollapsed, setIsWorkflowCollapsed] = useState(false);

  // Apply typewriter effect to the final answer text.
  // We pass isThinking so it starts empty for new messages, but full for history.
  // Note: we use msg.isThinking directly to determine if it's an active generation.
  const typedFinalAnswer = useTypewriter(finalAnswerText, msg.isThinking ?? false);

  // Dynamic Parsing: Parse the *typed* text into segments.
  // This ensures components "pop in" as their tags are fully typed.
  const displaySegments = useMemo(() => {
      return parseContentSegments(typedFinalAnswer);
  }, [typedFinalAnswer]);

  // Auto-collapse workflow when thinking is complete if there is a final answer
  useEffect(() => {
      if (thinkingIsComplete && finalAnswerText) {
          setIsWorkflowCollapsed(true);
      } else {
          setIsWorkflowCollapsed(false);
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
        className="w-full flex flex-col items-start gap-4 origin-bottom-left group/message"
        style={{ willChange: 'transform, opacity' }}
    >
      {/* 1. Agentic Workflow (Timeline) */}
      {logic.hasWorkflow && (
        <div className="w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 transition-all duration-300">
            <button
                onClick={() => setIsWorkflowCollapsed(!isWorkflowCollapsed)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/50 dark:hover:bg-white/5 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {logic.thinkingIsComplete ? (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                        </div>
                    ) : (
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse" />
                            <div className="absolute inset-0 w-full h-full bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full animate-ping" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-700 dark:text-white">
                            {logic.thinkingIsComplete ? 'Reasoning complete' : 'Thinking...'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-black/20 px-2 py-0.5 rounded-full">
                        {logic.displayDuration}s
                    </span>
                    <div className="text-slate-400 dark:text-slate-500">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor" 
                            className={`w-4 h-4 transition-transform duration-300 ${isWorkflowCollapsed ? '' : 'rotate-180'}`}
                        >
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </button>
            
            <AnimatePresence initial={false}>
                {!isWorkflowCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        <div className="px-4 pb-4 pt-0 space-y-6 bg-transparent">
                            {agentPlan && (
                                <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 mt-4 ml-1 select-none">Mission Plan</h4>
                                    <FormattedBlock content={agentPlan} isStreaming={msg.isThinking && executionLog.length === 0} />
                                </div>
                            )}
                            {executionLog.length > 0 && (
                                <div className={`${agentPlan ? '' : 'pt-2 border-t border-slate-200/50 dark:border-white/5'}`}>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 mt-2 ml-1 select-none">Execution Log</h4>
                                    <ThinkingWorkflow
                                        nodes={executionLog}
                                        sendMessage={sendMessage}
                                        onRegenerate={() => onRegenerate(id)}
                                        messageId={id}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      )}
      
      {/* 2. Chain of Thought (Thinking Process Stream) */}
      {logic.hasThinkingText && (
          <ThinkingProcess 
              thinkingText={thinkingText} 
              isThinking={!logic.thinkingIsComplete} 
          />
      )}
      
      {/* 3. Final Answer / Result */}
      {(logic.hasFinalAnswer || activeResponse?.error || logic.isWaitingForFinalAnswer) && (
        <div className="w-full flex flex-col gap-4">
          {logic.isWaitingForFinalAnswer && <TypingIndicator />}
          {activeResponse?.error && <ErrorDisplay error={activeResponse.error} onRetry={() => onRegenerate(id)} />}
          
          <div className="markdown-content max-w-none w-full text-slate-800 dark:text-white">
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
                            isStreaming={msg.isThinking ?? false} // Pass thinking state for any internal cursor logic in renderer
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
          <div className="w-full">
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
