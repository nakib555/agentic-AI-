/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { imageStore } from '../../services/imageStore';

type ImageDisplayProps = {
  imageKey: string; // The key to retrieve the image from IndexedDB
  prompt: string;
};

export const ImageDisplay = ({ imageKey, prompt }: ImageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        const blob = await imageStore.getImage(imageKey);
        if (blob) {
          setImageBlob(blob); // Save the blob for downloading
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        } else {
          setError('Image not found in local storage.');
        }
      } catch (err) {
        console.error('Failed to load image from IndexedDB:', err);
        setError('Failed to load image.');
      }
    };

    if (imageKey) {
      loadImage();
    }

    return () => {
      // Clean up the object URL to prevent memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageKey]);

  const handleDownload = () => {
    if (!imageBlob) return;

    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Sanitize prompt for filename, limit length, and provide fallback
    const sanitizedPrompt = prompt.toLowerCase().replace(/[\s\W]+/g, '-').substring(0, 50);
    const filename = `${sanitizedPrompt || 'generated-image'}.png`;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
      <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
            {error ? (
              <span>{error}</span>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading image...</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
        <p className="text-sm italic text-slate-600 dark:text-slate-400" title={prompt}>
          {prompt}
        </p>
        {imageUrl && (
          <button
            onClick={handleDownload}
            className="flex-shrink-0 mt-1 p-1.5 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition-colors"
            title="Download image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            <span className="sr-only">Download</span>
          </button>
        )}
      </div>
    </div>
  );
};