
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import type { Model } from '../../services/modelService';
import type { MemoryFile } from '../../hooks/useMemory';
import type { Theme } from '../../hooks/useTheme';

// Lazy load modals to reduce initial bundle size
const SettingsModal = React.lazy(() => import('../Settings/SettingsModal').then(module => ({ default: module.SettingsModal })));
const MemoryModal = React.lazy(() => import('../Settings/MemoryModal').then(module => ({ default: module.MemoryModal })));
const MemoryConfirmationModal = React.lazy(() => import('../Settings/MemoryConfirmationModal').then(module => ({ default: module.MemoryConfirmationModal })));
const ImportChatModal = React.lazy(() => import('../Settings/ImportChatModal').then(module => ({ default: module.ImportChatModal })));
const ConfirmationModal = React.lazy(() => import('../UI/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));

type AppModalsProps = {
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
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  // Confirmation Modal
  confirmation: { prompt: string; onConfirm: () => void; onCancel?: () => void; destructive?: boolean } | null;
  onConfirm: () => void;
  onCancel: () => void;
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
    <div className="bg-black/10 backdrop-blur-[1px] absolute inset-0" />
    <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-2xl relative z-10">
        <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
  </div>
);

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen, onRunTests,
    availableModels, availableImageModels, availableVideoModels, activeModel,
    onModelChange, modelsLoading, clearAllChats, aboutUser, setAboutUser,
    aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens,
    setMaxTokens, imageModel, onImageModelChange, videoModel, onVideoModelChange,
    defaultTemperature, defaultMaxTokens, isMemoryEnabled,
    setIsMemoryEnabled, memoryContent, memoryFiles, clearMemory, updateBackendMemory, updateMemoryFiles, isConfirmationOpen,
    memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate, ttsVoice,
    setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled, onManageMemory,
    apiKey, onSaveApiKey, isImportModalOpen, setIsImportModalOpen, handleFileUploadForImport,
    onDownloadLogs, onShowDataStructure, confirmation, onConfirm, onCancel,
    theme, setTheme
  } = props;

  // Nothing to render if no modal is active
  if (!isSettingsOpen && !isMemoryModalOpen && !isImportModalOpen && !isConfirmationOpen && !confirmation) {
    return null;
  }

  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          models={availableModels}
          imageModels={availableImageModels}
          videoModels={availableVideoModels}
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
          defaultTemperature={defaultTemperature}
          defaultMaxTokens={defaultMaxTokens}
          isMemoryEnabled={isMemoryEnabled}
          setIsMemoryEnabled={setIsMemoryEnabled}
          onManageMemory={onManageMemory}
          ttsVoice={ttsVoice}
          setTtsVoice={setTtsVoice}
          isAutoPlayEnabled={isAutoPlayEnabled}
          setIsAutoPlayEnabled={setIsAutoPlayEnabled}
          theme={theme}
          setTheme={setTheme}
        />
      )}
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
  );
};
