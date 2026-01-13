
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';

type AgentBriefingProps = {
    content: string;
};

const Section: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    content: string; 
    colorClass: string 
}> = ({ icon, title, content, colorClass }) => (
    <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${colorClass}`}>
            {icon}
            {title}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed workflow-markdown">
            <ManualCodeRenderer text={content} components={WorkflowMarkdownComponents} isStreaming={false} />
        </div>
    </div>
);

export const AgentBriefing: React.FC<AgentBriefingProps> = ({ content }) => {
    // Parse the markdown to extract Strategy and Tools sections
    const parsedSections = useMemo(() => {
        const strategyMatch = content.match(/## 🧠 Strategy\s*([\s\S]*?)(?=## ⚙️ Planned Tools|$)/i);
        const toolsMatch = content.match(/## ⚙️ Planned Tools\s*([\s\S]*?)$/i);

        return {
            strategy: strategyMatch ? strategyMatch[1].trim() : '',
            tools: toolsMatch ? toolsMatch[1].trim() : ''
        };
    }, [content]);

    const isLegacyFormat = !parsedSections.strategy && !parsedSections.tools;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] shadow-sm mb-4"
        >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 bg-slate-50/50 dark:bg-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                    Initial Plan
                </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLegacyFormat ? (
                    <div className="col-span-1 md:col-span-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed workflow-markdown">
                         <ManualCodeRenderer text={content} components={WorkflowMarkdownComponents} isStreaming={false} />
                    </div>
                ) : (
                    <>
                        {parsedSections.strategy && (
                            <Section 
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                                }
                                title="Mission Strategy"
                                content={parsedSections.strategy}
                                colorClass="text-indigo-600 dark:text-indigo-400"
                            />
                        )}
                        
                        {parsedSections.tools && (
                            <Section 
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                                }
                                title="Planned Tools"
                                content={parsedSections.tools}
                                colorClass="text-emerald-600 dark:text-emerald-400"
                            />
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};
