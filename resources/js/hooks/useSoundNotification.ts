import { useEffect, useState, useCallback, useRef } from 'react';
import { playNotificationTone } from '@/utils/notificationSound';

/**
 * useSoundNotification Hook
 * 
 * Manages audio notifications with toggle settings
 * Persists user preference to localStorage
 * Handles audio file loading and playback
 * Uses Web Audio API as fallback if file is unavailable
 */
export function useSoundNotification(soundUrl: string = '/notification-ping.mp3') {
    const [isEnabled, setIsEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const useWebAudioRef = useRef(false);

    // Load sound preference from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('soundNotificationEnabled');
            if (saved !== null) {
                setIsEnabled(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading sound notification preference:', error);
        }

        // Try to create and preload audio element
        try {
            const audio = new Audio(soundUrl);
            audio.preload = 'auto';
            
            // Check if audio can be loaded
            audio.addEventListener('error', () => {
                console.warn(`Audio file not found: ${soundUrl}, using Web Audio API fallback`);
                useWebAudioRef.current = true;
            });
            
            audioRef.current = audio;
            setIsLoading(false);
        } catch (error) {
            console.warn('Error creating audio element, using Web Audio API fallback:', error);
            useWebAudioRef.current = true;
            setIsLoading(false);
        }
    }, [soundUrl]);

    // Save preference to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('soundNotificationEnabled', JSON.stringify(isEnabled));
        } catch (error) {
            console.error('Error saving sound notification preference:', error);
        }
    }, [isEnabled]);

    const playSound = useCallback(async () => {
        if (!isEnabled) {
            return;
        }

        try {
            // Try using Web Audio API if file is not available
            if (useWebAudioRef.current || !audioRef.current) {
                await playNotificationTone();
                return;
            }

            // Reset audio playback
            audioRef.current.currentTime = 0;
            
            // Play with volume optimization
            audioRef.current.volume = 0.3; // Set to 30% volume to avoid being too loud
            await audioRef.current.play();
        } catch (error) {
            // If HTML audio fails, try Web Audio API
            if (!useWebAudioRef.current) {
                useWebAudioRef.current = true;
                try {
                    await playNotificationTone();
                } catch (webAudioError) {
                    console.error('Error playing sound:', webAudioError);
                }
            } else if ((error as Error).name !== 'NotAllowedError') {
                // Suppress autoplay errors which are common in browsers
                console.error('Error playing sound:', error);
            }
        }
    }, [isEnabled]);

    const toggleSound = useCallback(() => {
        setIsEnabled(prev => !prev);
    }, []);

    return {
        isEnabled,
        isLoading,
        playSound,
        toggleSound,
    };
}
