/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// Check for SpeechRecognition API and its vendor prefixes
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

type UseVoiceInputProps = {
    onTranscriptUpdate: (transcript: string) => void;
};

export const useVoiceInput = ({ onTranscriptUpdate }: UseVoiceInputProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any | null>(null);
    // Use a ref to hold the callback to avoid re-running the effect with stale closures
    const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
    onTranscriptUpdateRef.current = onTranscriptUpdate;

    useEffect(() => {
        if (!isSpeechRecognitionSupported) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening even after a pause
        recognition.interimResults = true; // Get results as they are recognized
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            // Update the input with both final and interim results for real-time feedback
            onTranscriptUpdateRef.current(finalTranscript + interimTranscript);
        };
        
        // When recognition service ends, we need to update our state
        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
             // Provide user feedback for common errors.
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert("Microphone access was denied. Please allow it in your browser settings to use voice input.");
            } else if (event.error === 'audio-capture') {
                alert("Could not capture audio. Please ensure your microphone is working and not being used by another application.");
            } else {
                alert(`An unexpected voice input error occurred: ${event.error}`);
            }
            setIsRecording(false);
        };
        
        recognitionRef.current = recognition;

        // Cleanup: stop recognition when the component unmounts
        return () => {
            recognition.stop();
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount

    const startRecording = useCallback(() => {
        if (!isSpeechRecognitionSupported) {
            alert("Sorry, voice input is not supported on your browser.");
            return;
        }
        if (isRecording || !recognitionRef.current) return;
        
        // Defensively abort any lingering session before starting a new one.
        // This can help prevent 'audio-capture' errors if the previous session
        // did not terminate cleanly.
        recognitionRef.current?.abort();
        
        // Request microphone permission before starting
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                setIsRecording(true);
                recognitionRef.current?.start();
            })
            .catch((err) => {
                console.error("Microphone access denied:", err);
                alert("Microphone access is required for voice input. Please allow it in your browser settings.");
            });
    }, [isRecording]);

    const stopRecording = useCallback(() => {
        if (!isRecording || !recognitionRef.current) return;
        
        // The `onend` event handler will set isRecording to false
        recognitionRef.current.stop();
    }, [isRecording]);

    return { isRecording, startRecording, stopRecording, isSupported: isSpeechRecognitionSupported };
};