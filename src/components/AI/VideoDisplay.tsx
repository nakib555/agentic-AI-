
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { videoStore } from '../../services/videoStore';

type VideoDisplayProps = {
  videoKey: string;
  prompt: string;
};

export const VideoDisplay = ({ videoKey, prompt }: VideoDisplayProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadVideo = async () => {
      try {
        const blob = await videoStore.getVideo(videoKey);
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setVideoUrl(objectUrl);
        } else {
          setError('Video not found in local storage.');
        }
      } catch (err) {
        console.error('Failed to load video from IndexedDB:', err);
        setError('Failed to load video.');
      }
    };

    if (videoKey) {
      loadVideo();
    }

    return () => {
      // Clean up the object URL to prevent memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoKey]);

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
        <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {videoUrl ? (
                <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full"
                    aria-label={prompt || "Generated video"}
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
                        <span>Loading video... This can take a few minutes.</span>
                    </div>
                    )}
                </div>
            )}
        </div>
        {prompt && (
             <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-serif italic text-slate-600 dark:text-slate-400" title={prompt}>
                    {prompt}
                </p>
             </div>
        )}
    </div>
  );
};
