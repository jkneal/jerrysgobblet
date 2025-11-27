import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for playing sound effects in the game
 * Manages audio instances and provides a simple API for playing sounds
 * Handles Safari iOS audio restrictions by preloading on user interaction
 */
const useSound = () => {
    const audioRefs = useRef({
        select: null,
        place: null,
        gobble: null,
        opponent: null,
        victory: null
    });

    const audioUnlocked = useRef(false);

    // Preload and unlock audio on first user interaction (for Safari iOS)
    const unlockAudio = useCallback(() => {
        if (audioUnlocked.current) return;

        // Create and attempt to play all sounds to unlock audio context
        Object.keys(audioRefs.current).forEach(soundName => {
            try {
                const audio = new Audio(`/sounds/${soundName}.mp3`);
                audio.volume = soundName === 'victory' ? 0.75 : 0.5;
                // Safari requires play() to be called during user interaction
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => {
                    // Ignore errors during unlock
                });
                audioRefs.current[soundName] = audio;
            } catch (error) {
                console.warn(`Failed to preload sound: ${soundName}`, error);
            }
        });

        audioUnlocked.current = true;
    }, []);

    // Set up unlock listeners
    useEffect(() => {
        const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];

        events.forEach(event => {
            document.addEventListener(event, unlockAudio, { once: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, unlockAudio);
            });
        };
    }, [unlockAudio]);

    const initAudio = useCallback((soundName) => {
        if (!audioRefs.current[soundName]) {
            const audio = new Audio(`/sounds/${soundName}.mp3`);
            // Set volume based on sound type
            audio.volume = soundName === 'victory' ? 0.75 : 0.5;
            // Preload the audio
            audio.load();
            audioRefs.current[soundName] = audio;
        }
        return audioRefs.current[soundName];
    }, []);

    const playSound = useCallback((soundName) => {
        try {
            const audio = initAudio(soundName);

            // For Safari, clone the audio element if it's still playing
            // This allows overlapping sounds
            if (!audio.paused && audio.currentTime > 0) {
                const clone = audio.cloneNode();
                clone.volume = audio.volume;
                clone.play().catch(err => {
                    console.warn(`Could not play cloned sound: ${soundName}`, err);
                });
                return;
            }

            // Reset to beginning if already played
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
