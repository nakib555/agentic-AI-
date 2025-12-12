
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AppSkeleton = () => {
  return (
    <div className="flex h-full w-full bg-page overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar Ghost (Desktop) */}
      <div className="hidden md:flex w-[272px] flex-col border-r border-border bg-layer-1 p-3 gap-6 flex-shrink-0 z-20">
        {/* Header */}
        <div className="flex items-center gap-3 px-2 mt-2">
            <div className="w-8 h-8 rounded-xl bg-layer-3 animate-pulse" />
            <div className="h-6 w-24 bg-layer-3 rounded-md animate-pulse" />
        </div>
        
        {/* Search & New Chat */}
        <div className="space-y-2">
            <div className="h-10 w-full bg-layer-2 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-layer-2 rounded-xl animate-pulse" />
        </div>

        <div className="h-px w-full bg-border" />

        {/* History List */}
        <div className="flex-1 space-y-4 pt-2">
            <div className="space-y-2">
                <div className="h-3 w-12 bg-layer-3 rounded ml-2 animate-pulse" /> {/* Section Title */}
                <div className="h-9 w-full bg-layer-2/50 rounded-lg animate-pulse" />
                <div className="h-9 w-full bg-layer-2/50 rounded-lg animate-pulse" />
                <div className="h-9 w-full bg-layer-2/50 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
                <div className="h-3 w-16 bg-layer-3 rounded ml-2 animate-pulse" />
                <div className="h-9 w-full bg-layer-2/50 rounded-lg animate-pulse" />
                <div className="h-9 w-full bg-layer-2/50 rounded-lg animate-pulse" />
            </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-border pt-4">
            <div className="h-10 w-full bg-layer-2 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Main Content Ghost */}
      <div className="flex-1 flex flex-col min-w-0 bg-page relative z-10">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-page/80 backdrop-blur-sm">
           <div className="h-8 w-48 bg-layer-2 rounded-full animate-pulse" />
           <div className="h-10 w-10 bg-layer-2 rounded-full animate-pulse" />
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 sm:p-8 flex flex-col justify-end space-y-8 pb-4 overflow-hidden">
           {/* AI Message Ghost */}
           <div className="flex flex-col gap-3 max-w-3xl w-full">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-layer-3 animate-pulse" />
                 <div className="h-4 w-32 bg-layer-3 rounded animate-pulse" />
              </div>
              <div className="space-y-2 pl-11">
                  <div className="h-4 w-full bg-layer-2 rounded animate-pulse" />
                  <div className="h-4 w-[90%] bg-layer-2 rounded animate-pulse" />
                  <div className="h-4 w-[95%] bg-layer-2 rounded animate-pulse" />
                  <div className="flex gap-2 mt-4">
                      <div className="h-8 w-24 bg-layer-2 rounded-lg animate-pulse" />
                      <div className="h-8 w-24 bg-layer-2 rounded-lg animate-pulse" />
                  </div>
              </div>
           </div>

           {/* User Message Ghost */}
           <div className="flex justify-end w-full">
              <div className="flex flex-col items-end gap-2 max-w-2xl w-full">
                  <div className="h-20 w-3/4 bg-layer-2 rounded-2xl rounded-tr-sm animate-pulse" />
              </div>
           </div>
        </div>

        {/* Input Area Ghost */}
        <div className="p-4 sm:px-8 pb-6 flex-shrink-0">
           <div className="h-16 w-full max-w-4xl mx-auto bg-layer-2 border border-border rounded-xl animate-pulse flex items-center px-4 justify-between">
                <div className="w-6 h-6 bg-layer-3 rounded-md animate-pulse" />
                <div className="w-8 h-8 bg-layer-3 rounded-lg animate-pulse" />
           </div>
           <div className="h-3 w-48 mx-auto mt-3 bg-layer-2 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
