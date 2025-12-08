/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, memo, Suspense } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import type { Message, Source } from '../../../types';
import { MarkdownComponents } from '../../Markdown/markdownComponents';
import { ErrorDisplay } from '../../UI/ErrorDisplay';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { TypingIndicator } from '../TypingIndicator';
import { SuggestedActions } from '../SuggestedActions';
import type { MessageFormHandle } from '../MessageForm/index';
import { useAiMessageLogic } from './useAiMessageLogic';
import { MessageToolbar } from './MessageToolbar';

// Lazy load heavy components
const ThinkingWorkflow = React.lazy(() => import('../../AI/ThinkingWorkflow').then(m => ({ default: m.ThinkingWorkflow })));
const FormattedBlock = React.lazy(() => import('../../Markdown/FormattedBlock').then(m => ({ default: m.FormattedBlock })));
const ExecutionApproval = React.lazy(() => import('../../AI/ExecutionApproval').then(m => ({ default: m.ExecutionApproval })));
const ImageDisplay = React.lazy(() => import('../../AI/ImageDisplay').then(m => ({ default: m.ImageDisplay })));
const VideoDisplay = React.lazy(() => import('../../AI/VideoDisplay').then(m => ({ default: m.VideoDisplay })));
const McqComponent = React.lazy(() => import('../../AI/McqComponent').then(m => ({ default: m.McqComponent })));
const MapDisplay = React.lazy(() => import('../../AI/MapDisplay').then(m => ({ default: m.MapDisplay })));
const FileAttachment = React.lazy(() => import('../../AI/FileAttachment').then(m => ({ default: m.FileAttachment })));
const BrowserSessionDisplay = React.lazy(() => import('../../AI/BrowserSessionDisplay').then(m => ({ default: m.BrowserSessionDisplay })));

const animationProps = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 200, damping: 25 },
};

type AiMessageProps = { 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    isAutoPlayEnabled: boolean;
    currentChatId: string | null;
    onShowSources: (sources: Source[]) => void;
    approveExecution: (editedPlan: string) => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
    onRegenerate: (messageId: string) => void;
    onSetActiveResponseIndex: (messageId: string, index: number) => void;
    isAgentMode: boolean;
};

const ComponentLoader = () => (
    <div className="w-full h-24 bg-layer-2 rounded-xl animate-pulse flex items-center justify-center text-sm text-content-tertiary">
        Loading content...
    </div>
);

const AiMessageRaw: React.FC<AiMessageProps> = (props) => {
  const { msg, isLoading, sendMessage, ttsVoice, isAutoPlayEnabled, currentChatId, 
          onShowSources, approveExecution, denyExecution, messageFormRef, onRegenerate,
          onSetActiveResponseIndex, isAgentMode } = props;
  const { id } = msg;

  const logic = useAiMessageLogic(msg, isAutoPlayEnabled, ttsVoice, sendMessage, isLoading);
  const { activeResponse, finalAnswerText, thinkingIsComplete, isStreamingFinalAnswer, agentPlan, executionLog, parsedFinalAnswer } = logic;
  const [isWorkflowCollapsed, setIsWorkflowCollapsed] = useState(false);

  useEffect(() => {
      if (thinkingIsComplete && finalAnswerText) {
          setIsWorkflowCollapsed(true);
      } else {
          setIsWorkflowCollapsed(false);
      }
  }, [thinkingIsComplete, !!finalAnswerText]);

  const handleEditImage = (blob: Blob, editKey: string) => {
      const file = new File([blob], "image-to-edit.png", { type: blob.type });
      (file as any)._editKey = editKey;
      messageFormRef.current?.attachFiles([file]);
  };

  if (logic.isInitialWait) return <TypingIndicator />;

  if (logic.showApprovalUI && activeResponse?.plan) {
    return (
        <Suspense fallback={<ComponentLoader />}>
            <ExecutionApproval plan={activeResponse.plan} onApprove={approveExecution} onDeny={denyExecution} />
        </Suspense>
    );
  }

  return (
    <motion.div 
        {...animationProps} 
        className="w-full flex flex-col items-start gap-4"
        style={{ willChange: 'transform, opacity' }}
    >
      {/* Inline Thought Process Display */}
      {logic.hasThinkingProcess && (
        <div className="w-full max-w-3xl rounded-xl overflow-hidden bg-layer-2/50 border border-border-default">
            <button
                onClick={() => setIsWorkflowCollapsed(!isWorkflowCollapsed)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-layer-2 transition-colors text-left group"
            >
                <div className="flex items-center gap-3">
                    {logic.thinkingIsComplete ? (
                        <div className="w-5 h-5 rounded-full bg-status-success-bg flex items-center justify-center text-status-success-text">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                        </div>
                    ) : (
                        <div className="relative w-5 h-5 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-primary-main rounded-full animate-pulse" />
                            <div className="absolute inset-0 w-full h-full bg-primary-main/20 rounded-full animate-ping" />
                        </div>
                    )}
                    <span className="font-semibold text-content-secondary group-hover:text-content-primary text-sm transition-colors">
                        {logic.thinkingIsComplete ? `Reasoning complete (${logic.displayDuration}s)` : `Working... (${logic.displayDuration}s)`}
                    </span>
                </div>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className={`w-5 h-5 text-content-tertiary transition-transform duration-200 ${isWorkflowCollapsed ? '' : 'rotate-180'}`}
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>
            
            <AnimatePresence initial={false}>
                {!isWorkflowCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="p-4 border-t border-border-default space-y-6">
                            {agentPlan && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-content-tertiary mb-3 ml-1">Mission Plan</h4>
                                    <Suspense fallback={<div className="h-20 animate-pulse bg-layer-2 rounded-lg" />}>
                                        <FormattedBlock content={agentPlan} isStreaming={msg.isThinking && executionLog.length === 0} />
                                    </Suspense>
                                </div>
                            )}
                            {executionLog.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-content-tertiary mb-3 ml-1">Execution Log</h4>
                                    <Suspense fallback={<div className="h-40 animate-pulse bg-layer-2 rounded-lg" />}>
                                        <ThinkingWorkflow
                                            nodes={executionLog}
                                            sendMessage={sendMessage}
                                            onRegenerate={() => onRegenerate(id)}
                                            messageId={id}
                                        />
                                    </Suspense>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      )}
      
      {(logic.hasFinalAnswer || activeResponse?.error || logic.isWaitingForFinalAnswer) && (
        <div className="w-full flex flex-col gap-4">
          {logic.isWaitingForFinalAnswer && <TypingIndicator />}
          {activeResponse?.error && <ErrorDisplay error={activeResponse.error} />}
          
          <div className="markdown-content max-w-none w-full text-[15px] leading-relaxed">
            {isStreamingFinalAnswer && (
               <ManualCodeRenderer 
                  text={finalAnswerText} 
                  components={MarkdownComponents} 
                  isStreaming={true} 
                  onRunCode={isAgentMode ? logic.handleRunCode : undefined}
                  isRunDisabled={true}
               />
            )}
            
            {thinkingIsComplete && logic.hasFinalAnswer && !activeResponse.error && (
                parsedFinalAnswer.map((segment, index) => {
                    const key = `${id}-${index}`;
                    if (segment.type === 'component') {
                        const { componentType, data } = segment;
                        return (
                            <React.Fragment key={key}>
                                <Suspense fallback={<ComponentLoader />}>
                                    {(() => {
                                        switch (componentType) {
                                            case 'VIDEO':
                                                return <VideoDisplay {...data} />;
                                            case 'ONLINE_VIDEO':
                                                return <VideoDisplay srcUrl={data.url} prompt={data.title} />;
                                            case 'IMAGE':
                                            case 'ONLINE_IMAGE':
                                                return <ImageDisplay onEdit={handleEditImage} {...data} />;
                                            case 'MCQ':
                                                return <McqComponent {...data} />;
                                            case 'MAP':
                                                return (
                                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                                        <MapDisplay {...data} />
                                                    </motion.div>
                                                );
                                            case 'FILE':
                                                return <FileAttachment {...data} />;
                                            case 'BROWSER':
                                                return <BrowserSessionDisplay {...data} />;
                                            default:
                                                return <ErrorDisplay error={{ message: `Unknown component type: ${componentType}`, details: JSON.stringify(data) }} />;
                                        }
                                    })()}
                                </Suspense>
                            </React.Fragment>
                        );
                    } else {
                        return (
                            <ManualCodeRenderer 
                                key={key} 
                                text={segment.content!} 
                                components={MarkdownComponents} 
                                isStreaming={false} 
                                onRunCode={isAgentMode ? logic.handleRunCode : undefined} 
                                isRunDisabled={isLoading} 
                            />
                        );
                    }
                })
            )}
          </div>
        </div>
      )}
      
      {logic.thinkingIsComplete && logic.hasFinalAnswer && !activeResponse?.error && (
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
      )}

      {logic.thinkingIsComplete && activeResponse?.suggestedActions && activeResponse.suggestedActions.length > 0 && !activeResponse.error && (
         <div className="w-full"><SuggestedActions actions={activeResponse.suggestedActions} onActionClick={sendMessage} /></div>
      )}
    </motion.div>
  );
};

export const AiMessage = memo(AiMessageRaw);
