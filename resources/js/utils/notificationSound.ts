/**
 * Notification Sound Generator
 * 
 * Generates a pleasant notification ping tone using the Web Audio API
 * Uses the AudioContext to create a simple two-tone alert sound
 * Fallback for when notification-ping.mp3 is not available
 */

/**
 * Generate a simple notification ping tone using Web Audio API
 * Creates a pleasant "ping" sound similar to WhatsApp notifications
 */
export function generateNotificationTone(): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const sampleRate = audioContext.sampleRate;
            const duration = 0.5; // 500ms
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            // Create a simple two-note ping: first note goes up, second comes down
            // First note: 800Hz for 250ms
            const freq1 = 800;
            const dur1 = 0.25;
            const endpoint1 = sampleRate * dur1;

            // Second note: 600Hz for 250ms
            const freq2 = 600;
            const dur2 = 0.25;
            const endpoint2 = sampleRate * dur2;

            // Generate first note with envelope
            for (let i = 0; i < endpoint1; i++) {
                const t = i / sampleRate;
                const phase = 2 * Math.PI * freq1 * t;
                // Add envelope: fade in and out
                const envelope = Math.sin((Math.PI * i) / endpoint1);
                data[i] = Math.sin(phase) * 0.3 * envelope;
            }

            // Generate second note with envelope
            for (let i = 0; i < endpoint2; i++) {
                const t = i / sampleRate;
                const phase = 2 * Math.PI * freq2 * t;
                // Add envelope: fade in and out
                const envelope = Math.sin((Math.PI * i) / endpoint2);
                data[endpoint1 + i] = Math.sin(phase) * 0.3 * envelope;
            }

            // Convert buffer to WAV and create blob
            const wav = encodeWAV(buffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            resolve(blob);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Encode audio buffer to WAV format
 */
function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const channelData: Float32Array[] = [];
    for (let i = 0; i < numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
    }

    const interleaved = interleave(channelData);
    const dataLength = interleaved.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    const writeFloat32 = (offset: number, input: number) => {
        view.setFloat32(offset, input, true);
    };

    const writeInt16 = (offset: number, input: number) => {
        view.setInt16(offset, input, true);
    };

    const writeInt32 = (offset: number, input: number) => {
        view.setInt32(offset, input, true);
    };

    // WAV file header
    writeString(0, 'RIFF');
    writeInt32(4, 36 + dataLength);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    writeInt32(16, 16);
    writeInt16(20, format);
    writeInt16(22, numberOfChannels);
    writeInt32(24, sampleRate);
    writeInt32(28, sampleRate * blockAlign);
    writeInt16(32, blockAlign);
    writeInt16(34, bitDepth);

    // data sub-chunk
    writeString(36, 'data');
    writeInt32(40, dataLength);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
        writeInt16(offset, interleaved[i] < 0 ? interleaved[i] * 0x8000 : interleaved[i] * 0x7fff);
        offset += 2;
    }

    return buffer;
}

/**
 * Interleave multichannel audio into single array
 */
function interleave(channelData: Float32Array[]): Float32Array {
    const channels = channelData.length;
    const length = channelData[0].length;
    const result = new Float32Array(length * channels);

    let index = 0;
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < channels; j++) {
            result[index++] = channelData[j][i];
        }
    }

    return result;
}

/**
 * Create and cache notification sound
 */
let notificationSoundCache: Blob | null = null;

export async function getNotificationSound(): Promise<Blob> {
    if (notificationSoundCache) {
        return notificationSoundCache;
    }

    try {
        notificationSoundCache = await generateNotificationTone();
        return notificationSoundCache;
    } catch (error) {
        console.warn('Failed to generate notification tone:', error);
        // Return a silent blob as fallback
        return new Blob([''], { type: 'audio/wav' });
    }
}

/**
 * Play notification tone using Web Audio API
 */
export async function playNotificationTone(): Promise<void> {
    try {
        const sound = await getNotificationSound();
        const url = URL.createObjectURL(sound);
        const audio = new Audio(url);
        audio.volume = 0.3;
        await audio.play();
    } catch (error) {
        console.warn('Failed to play notification tone:', error);
    }
}
