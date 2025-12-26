
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
import type { MessageFormHandle } from '../MessageForm/index';
import { useAiMessageLogic } from './useAiMessageLogic';
import { MessageToolbar } from './MessageToolbar';
import { BrowserSessionDisplay } from '../../AI/BrowserSessionDisplay';
import { useTypewriter } from '../../../hooks/useTypewriter';
import { parseContentSegments } from '../../../utils/workflowParsing';
import { ThinkingProcess } from './ThinkingProcess';
import { ArtifactRenderer } from '../../Artifacts/ArtifactRenderer'; // Import new component

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
    userQuery?: string; // Optional prompt context
};

const AiMessageRaw: React.FC<AiMessageProps> = (props) => {
  const { msg, isLoading, sendMessage, ttsVoice, ttsModel, currentChatId, 
          onShowSources, approveExecution, denyExecution, messageFormRef, onRegenerate,
          onSetActiveResponseIndex, isAgentMode, userQuery } = props;
  const { id } = msg;

  const logic = useAiMessageLogic(msg, ttsVoice, ttsModel, sendMessage, isLoading);
  const { activeResponse, finalAnswerText, thinkingIsComplete, thinkingText } = logic;
  
  const typedFinalAnswer = useTypewriter(finalAnswerText, msg.isThinking ?? false);

  const displaySegments = useMemo(() => {
      // Enhanced parsing to detect artifact tags
      // We process the text to extract [ARTIFACT_CODE] and [ARTIFACT_DATA] tags manually here
      // since the utility might not support them yet.
      
      const segments = parseContentSegments(typedFinalAnswer);
      
      // Post-process segments to handle artifacts if parseContentSegments doesn't
      // For this implementation, we will assume standard components are handled, 
      // and check text segments for artifacts.
      
      const enhancedSegments = [];
      for (const segment of segments) {
          if (segment.type === 'text' && segment.content) {
              const artifactRegex = /(\[(?:ARTIFACT_CODE|ARTIFACT_DATA)\].*?\[\/(?:ARTIFACT_CODE|ARTIFACT_DATA)\])/s;
              const parts = segment.content.split(artifactRegex);
              
              for (const part of parts) {
                  if (!part.trim()) continue;
                  
                  const codeMatch = part.match(/^\[ARTIFACT_CODE\](\{.*?\})\[\/ARTIFACT_CODE\]$/s);
                  const dataMatch = part.match(/^\[ARTIFACT_DATA\](\{.*?\})\[\/ARTIFACT_DATA\]$/s);
                  
                  if (codeMatch) {
                      try {
                          const data = JSON.parse(codeMatch[1]);
                          enhancedSegments.push({ 
                              type: 'component', 
                              componentType: 'ARTIFACT_CODE', 
                              data 
                          });
                      } catch (e) { enhancedSegments.push({ type: 'text', content: part }); }
                  } else if (dataMatch) {
                      try {
                          const data = JSON.parse(dataMatch[1]);
                          enhancedSegments.push({ 
                              type: 'component', 
                              componentType: 'ARTIFACT_DATA', 
                              data 
                          });
                      } catch (e) { enhancedSegments.push({ type: 'text', content: part }); }
                  } else {
                      enhancedSegments.push({ type: 'text', content: part });
                  }
              }
          } else {
              enhancedSegments.push(segment);
          }
      }
      return enhancedSegments;

  }, [typedFinalAnswer]);

  const handleEditImage = (blob: Blob, editKey: string) => {
      const file = new File([blob], "image-to-edit.png", { type: blob.type });
      (file as any)._editKey = editKey;
      messageFormRef.current?.attachFiles([file]);
  };

  if (logic.isInitialWait) return <TypingIndicator />;

  return (
    <motion.div 
        {...animationProps} 
        className="w-full flex flex-col items-start gap-3 origin-bottom-left group/message min-w-0"
    >
      {logic.hasThinkingText && (
          <ThinkingProcess 
              thinkingText={thinkingText} 
              isThinking={!logic.thinkingIsComplete} 
          />
      )}
      
      {(logic.hasFinalAnswer || activeResponse?.error || logic.isWaitingForFinalAnswer) && (
        <div className="w-full flex flex-col gap-3 min-w-0">
          {logic.isWaitingForFinalAnswer && <TypingIndicator />}
          {activeResponse?.error && <ErrorDisplay error={activeResponse.error} onRetry={() => onRegenerate(id)} />}
          
          <div className="markdown-content max-w-none w-full text-slate-800 dark:text-gray-100 leading-relaxed break-words min-w-0">
            {displaySegments.map((segment: any, index: number) => {
                const key = `${id}-${index}`;
                if (segment.type === 'component') {
                    const { componentType, data } = segment;
                    switch (componentType) {
                        case 'VIDEO': return <VideoDisplay key={key} {...data} />;
                        case 'ONLINE_VIDEO': return <VideoDisplay key={key} srcUrl={data.url} prompt={data.title} />;
                        case 'IMAGE':
                        case 'ONLINE_IMAGE': return <ImageDisplay key={key} onEdit={handleEditImage} {...data} />;
                        case 'MCQ': return <McqComponent key={key} {...data} />;
                        case 'MAP': return <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><MapDisplay {...data} /></motion.div>;
                        case 'FILE': return <FileAttachment key={key} {...data} />;
                        case 'BROWSER': return <BrowserSessionDisplay key={key} {...data} />;
                        case 'ARTIFACT_CODE': return <ArtifactRenderer key={key} type="code" content={data.code} language={data.language} title={data.title} />;
                        case 'ARTIFACT_DATA': return <ArtifactRenderer key={key} type="data" content={data.content} title={data.title} />;
                        case 'CODE_OUTPUT': return null; 
                        default: return <ErrorDisplay key={key} error={{ message: `Unknown component: ${componentType}`, details: JSON.stringify(data) }} />;
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
          <div className="w-full mt-2 transition-opacity duration-300">
            <MessageToolbar
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

      {logic.thinkingIsComplete && activeResponse?.suggestedActions && activeResponse.suggestedActions.length > 0 && !activeResponse.error && (
         <div className="w-full"><SuggestedActions actions={activeResponse.suggestedActions} onActionClick={sendMessage} /></div>
      )}
    </motion.div>
  );
};

export const AiMessage = memo(AiMessageRaw);
