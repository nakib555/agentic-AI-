
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import type { Model } from '../../types';
import type { MemoryFile } from '../../hooks/useMemory';
import type { Theme } from '../../hooks/useTheme';

// Lazy load SettingsModal to optimize main bundle, but ensure instant feel on mobile via skeleton
const SettingsModal = React.lazy(() => import('../Settings/SettingsModal').then(module => ({ default: module.SettingsModal })));

// Lazy load other modals
const MemoryModal = React.lazy(() => import('../Settings/MemoryModal').then(module => ({ default: module.MemoryModal })));
const MemoryConfirmationModal = React.lazy(() => import('../Settings/MemoryConfirmationModal').then(module => ({ default: module.MemoryConfirmationModal })));
const ImportChatModal = React.lazy(() => import('../Settings/ImportChatModal').then(module => ({ default: module.ImportChatModal })));
const ConfirmationModal = React.lazy(() => import('../UI/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));

type AppModalsProps = {
  isDesktop: boolean;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: (isOpen: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (isOpen: boolean) => void;
  handleFileUploadForImport: (file: File) => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  onShowDataStructure: () => void;
  availableModels: Model[];
  availableImageModels: Model[];
  availableVideoModels: Model[];
  availableTtsModels: Model[];
  activeModel: string;
  onModelChange: (modelId: string) => void;
  modelsLoading: boolean;
  clearAllChats: () => void;
  // API Key
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
  // Custom Instructions
  aboutUser: string;
  setAboutUser: (value: string) => void;
  aboutResponse: string;
  setAboutResponse: (value: string) => void;
  // Model Settings
  temperature: number;
  setTemperature: (value: number) => void;
  maxTokens: number;
  setMaxTokens: (value: number) => void;
  imageModel: string;
  onImageModelChange: (modelId: string) => void;
  videoModel: string;
  onVideoModelChange: (modelId: string) => void;
  ttsModel: string;
  onTtsModelChange: (modelId: string) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  // Speech & Memory
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  memoryContent: string;
  memoryFiles: MemoryFile[];
  clearMemory: () => void;
  updateBackendMemory: (content: string) => Promise<void>; 
  updateMemoryFiles: (files: MemoryFile[]) => Promise<void>;
  isConfirmationOpen: boolean;
  memorySuggestions: string[];
  confirmMemoryUpdate: () => void;
  cancelMemoryUpdate: () => void;
  ttsVoice: string;
  setTtsVoice: (value: string) => void;
  // Confirmation Modal
  confirmation: { prompt: string; onConfirm: () => void; onCancel?: () => void; destructive?: boolean } | null;
  onConfirm: () => void;
  onCancel: () => void;
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// A lightweight skeleton that mimics the structure of SettingsModal.
// This ensures the user sees the "shell" of the settings UI immediately on mobile,
// preventing a feeling of sluggishness while the JS chunks load.
const SettingsSkeleton = () => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6">
    <div className="bg-white dark:bg-[#1e1e1e] w-full shadow-2xl rounded-2xl max-w-4xl h-[85vh] max-h-[800px] flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
            <div className="h-6 w-24 bg-slate-200 dark:bg-white/10 rounded"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-white/10 rounded-full"></div>
        </div>
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/50 dark:bg-black/20">
             {/* Nav Skeleton */}
             <div className="flex-shrink-0 p-4 md:border-r border-slate-200 dark:border-white/10 md:w-64 bg-white dark:bg-[#1e1e1e]">
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-24 md:w-full bg-slate-200 dark:bg-white/10 rounded-xl flex-shrink-0"></div>
                    ))}
                </div>
             </div>
             {/* Content Skeleton */}
             <div className="flex-1 p-6 md:p-8">
                 <div className="h-8 w-48 bg-slate-200 dark:bg-white/10 rounded mb-4"></div>
                 <div className="space-y-6">
                     <div className="h-24 w-full bg-slate-200 dark:bg-white/10 rounded-xl"></div>
                     <div className="h-24 w-full bg-slate-200 dark:bg-white/10 rounded-xl"></div>
                 </div>
             </div>
        </div>
    </div>
  </div>
);

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    isDesktop, isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen, onRunTests,
    availableModels, availableImageModels, availableVideoModels, availableTtsModels, activeModel,
    onModelChange, modelsLoading, clearAllChats, aboutUser, setAboutUser,
    aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens,
    setMaxTokens, imageModel, onImageModelChange, videoModel, onVideoModelChange, ttsModel, onTtsModelChange,
    defaultTemperature, defaultMaxTokens, isMemoryEnabled,
    setIsMemoryEnabled, memoryContent, memoryFiles, clearMemory, updateBackendMemory, updateMemoryFiles, isConfirmationOpen,
    memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate, ttsVoice,
    setTtsVoice, onManageMemory,
    apiKey, onSaveApiKey, isImportModalOpen, setIsImportModalOpen, handleFileUploadForImport,
    onDownloadLogs, onShowDataStructure, confirmation, onConfirm, onCancel,
    theme, setTheme
  } = props;

  // Nothing to render if no modal is active
  if (!isSettingsOpen && !isMemoryModalOpen && !isImportModalOpen && !isConfirmationOpen && !confirmation) {
    return null;
  }

  return (
    <>
      <Suspense fallback={!isDesktop ? <SettingsSkeleton /> : null}>
        {isSettingsOpen && (
            <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            models={availableModels}
            imageModels={availableImageModels}
            videoModels={availableVideoModels}
            ttsModels={availableTtsModels}
            selectedModel={activeModel}
            onModelChange={onModelChange}
            disabled={modelsLoading}
            onClearAllChats={clearAllChats}
            onRunTests={onRunTests}
            onDownloadLogs={onDownloadLogs}
            onShowDataStructure={onShowDataStructure}
            apiKey={apiKey}
            onSaveApiKey={onSaveApiKey}
            aboutUser={aboutUser}
            setAboutUser={setAboutUser}
            aboutResponse={aboutResponse}
            setAboutResponse={setAboutResponse}
            temperature={temperature}
            setTemperature={setTemperature}
            maxTokens={maxTokens}
            setMaxTokens={setMaxTokens}
            imageModel={imageModel}
            onImageModelChange={onImageModelChange}
            videoModel={videoModel}
            onVideoModelChange={onVideoModelChange}
            ttsModel={ttsModel}
            onTtsModelChange={onTtsModelChange}
            defaultTemperature={defaultTemperature}
            defaultMaxTokens={defaultMaxTokens}
            isMemoryEnabled={isMemoryEnabled}
            setIsMemoryEnabled={setIsMemoryEnabled}
            onManageMemory={onManageMemory}
            ttsVoice={ttsVoice}
            setTtsVoice={setTtsVoice}
            theme={theme}
            setTheme={setTheme}
            />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isMemoryModalOpen && (
          <MemoryModal
            isOpen={isMemoryModalOpen}
            onClose={() => setIsMemoryModalOpen(false)}
            memoryFiles={memoryFiles}
            onUpdateMemoryFiles={updateMemoryFiles}
          />
        )}
        {isConfirmationOpen && (
          <MemoryConfirmationModal
            isOpen={isConfirmationOpen}
            suggestions={memorySuggestions}
            onConfirm={confirmMemoryUpdate}
            onCancel={cancelMemoryUpdate}
          />
        )}
        {isImportModalOpen && (
          <ImportChatModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onFileUpload={handleFileUploadForImport}
          />
        )}
        {!!confirmation && (
          <ConfirmationModal
            isOpen={!!confirmation}
            prompt={confirmation?.prompt || ''}
            onConfirm={onConfirm}
            onCancel={onCancel}
            destructive={confirmation?.destructive}
          />
        )}
      </Suspense>
    </>
  );
};
