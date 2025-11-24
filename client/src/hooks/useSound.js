import { useRef, useCallback } from 'react';

/**
 * Custom hook for playing sound effects in the game
 * Manages audio instances and provides a simple API for playing sounds
 */
const useSound = () => {
    const audioRefs = useRef({
        select: null,
        place: null,
        opponent: null,
        victory: null
    });

    const initAudio = useCallback((soundName) => {
        if (!audioRefs.current[soundName]) {
            const audio = new Audio(`/sounds/${soundName}.mp3`);
            // Set volume based on sound type
            audio.volume = soundName === 'victory' ? 0.75 : 0.5;
            audioRefs.current[soundName] = audio;
        }
        return audioRefs.current[soundName];
    }, []);

    const playSound = useCallback((soundName) => {
        try {
            const audio = initAudio(soundName);
            // Reset to beginning if already playing
            audio.currentTime = 0;
            audio.play().catch(err => {
                // Silently fail if autoplay is blocked
                console.warn(`Could not play sound: ${soundName}`, err);
            });
        } catch (error) {
            console.warn(`Error playing sound: ${soundName}`, error);
        }
    }, [initAudio]);

    const stopSound = useCallback((soundName) => {
        try {
            const audio = audioRefs.current[soundName];
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        } catch (error) {
            console.warn(`Error stopping sound: ${soundName}`, error);
        }
    }, []);

    const stopAllSounds = useCallback(() => {
        Object.keys(audioRefs.current).forEach(soundName => {
            stopSound(soundName);
        });
    }, [stopSound]);

    return { playSound, stopSound, stopAllSounds };
};

export default useSound;
