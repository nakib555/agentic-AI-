/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const LoadingDots = () => (
    <div className="flex gap-1 items-center">
        <motion.div className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 bg-slate-400 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
    </div>
);

const ResultDisplay: React.FC<{ text: string, type: 'success' | 'error' }> = ({ text, type }) => {
    const Icon = type === 'success' 
      ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-green-400"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
      : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-red-400"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg text-sm text-slate-300"
        >
          {Icon}
          <p>{text}</p>
        </motion.div>
    );
}

export const LocationPermissionRequest: React.FC<{ 
    text: string;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
}> = ({ text, sendMessage }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultText, setResultText] = useState('');

  const handleGrantPermission = () => {
    setStatus('loading');
    if (!navigator.geolocation) {
      setResultText("Geolocation is not supported by your browser.");
      setStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `User granted location access. Current location: Latitude ${latitude.toFixed(4)}, Longitude ${longitude.toFixed(4)}`;
        setResultText("Location access granted. The AI will now use your location to continue.");
        setStatus('success');
        // Send a hidden message with the location back to the AI to continue the workflow.
        sendMessage(locationString, undefined, { isHidden: true, isThinkingModeEnabled: true });
      },
      (error) => {
        let message: string;
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = "You denied the request for Geolocation. The AI cannot proceed with location-based tasks.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
          default:
            message = "An unknown error occurred while trying to get your location.";
            break;
        }
        setResultText(message);
        setStatus('error');
        // Also inform the AI that the request failed.
        sendMessage(`User denied location access: ${message}`, undefined, { isHidden: true, isThinkingModeEnabled: true });
      }
    );
  };

  return (
    <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-sm space-y-3">
        <p className="text-indigo-200">{text}</p>
        
        {status === 'idle' && (
            <button 
                onClick={handleGrantPermission} 
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-colors text-xs"
            >
                Grant Location Access
            </button>
        )}

        {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-indigo-300">
                <span>Requesting permission</span>
                <LoadingDots />
            </div>
        )}

        {status === 'success' && <ResultDisplay text={resultText} type="success" />}
        {status === 'error' && <ResultDisplay text={resultText} type="error" />}
    </div>
  );
};
