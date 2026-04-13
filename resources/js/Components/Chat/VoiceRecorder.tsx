import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onSend,
    onCancel,
    isSubmitting = false,
}) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);

    const timerIntervalRef = useRef<NodeJS.Timeout>();
    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    // Initialize microphone access
    useEffect(() => {
        const initMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                // Set up MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus',
                });

                mediaRecorderRef.current = mediaRecorder;

                // Set up audio context for waveform visualization
                const audioContext = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);

                source.connect(analyser);
                analyser.fftSize = 256;

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                setPermissionGranted(true);

                // Handle recording data
                mediaRecorder.ondataavailable = (event) => {
                    chunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(chunksRef.current, {
                        type: 'audio/webm',
                    });
                    setRecordedAudio(audioBlob);
                    chunksRef.current = [];
                    stream.getTracks().forEach((track) => track.stop());
                };
            } catch (error: any) {
                setMicError(
                    error.name === 'NotAllowedError'
                        ? 'Microphone permission denied'
                        : 'Failed to access microphone'
                );
            }
        };

        initMicrophone();

        return () => {
            if (mediaRecorderRef.current?.stream) {
                mediaRecorderRef.current.stream
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, []);

    // Draw waveform visualization
    useEffect(() => {
        if (!isRecording || !canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#202c33';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bufferLength;
            let x = 0;

            // Draw bars with gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#00d084');
            gradient.addColorStop(1, '#005c4b');

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

                x += barWidth;
            }
        };

        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecording]);

    const handleStartRecording = async () => {
        if (!mediaRecorderRef.current || !permissionGranted) return;

        chunksRef.current = [];
        setRecordedAudio(null);
        setRecordingTime(0);
        setIsRecording(true);

        mediaRecorderRef.current.start();

        // Start timer
        timerIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);
    };

    const handleStopRecording = () => {
        if (!mediaRecorderRef.current) return;

        setIsRecording(false);
        mediaRecorderRef.current.stop();

        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
    };

    const handleSendAudio = () => {
        if (recordedAudio) {
            onSend(recordedAudio);
        }
    };

    const handlePlayPreview = () => {
        if (!recordedAudio) return;

        if (isPlaying) {
            if (audioElementRef.current) {
                audioElementRef.current.pause();
            }
            setIsPlaying(false);
        } else {
            const url = URL.createObjectURL(recordedAudio);
            const audio = new Audio(url);

            audioElementRef.current = audio;
            audio.play();
            setIsPlaying(true);

            audio.onended = () => {
                setIsPlaying(false);
            };
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (micError) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="px-4 py-3 bg-[#202c33] border-t border-[#1f2937]"
            >
                <div className="flex items-center justify-between bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <div className="flex-1">
                        <p className="text-red-400 text-sm font-medium">{micError}</p>
                        <p className="text-red-300 text-xs mt-1">
                            Please check your microphone permissions in browser settings
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-red-400 hover:text-red-300 ml-3 flex-shrink-0"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-3 bg-gradient-to-r from-[#202c33] to-[#1a2332] border-t border-[#1f2937]"
        >
            <AnimatePresence mode="wait">
                {!recordedAudio ? (
                    <motion.div
                        key="recording"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                    >
                        {/* Recording Controls */}
                        <div className="flex items-center gap-3">
                            {isRecording && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="flex-shrink-0"
                                >
                                    <Mic className="w-5 h-5 text-red-500" />
                                </motion.div>
                            )}

                            <div className="flex-1">
                                {/* Waveform Canvas */}
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={60}
                                    className="w-full h-12 rounded-lg bg-[#101828] border border-[#1f2937]"
                                    style={{ display: isRecording ? 'block' : 'none' }}
                                />

                                {!isRecording && (
                                    <p className="text-gray-400 text-sm">
                                        Click the microphone button to start recording
                                    </p>
                                )}
                            </div>

                            {/* Timer */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-mono text-[#00d084]">
                                    {formatTime(recordingTime)}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={
                                    isRecording
                                        ? handleStopRecording
                                        : handleStartRecording
                                }
                                disabled={!permissionGranted}
                                className={`flex-shrink-0 p-3 rounded-full transition ${
                                    isRecording
                                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                        : 'bg-[#005c4b] hover:bg-[#00704d]'
                                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                                type="button"
                            >
                                <Mic className="w-5 h-5" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                className="flex-shrink-0 p-3 rounded-full bg-[#1f2937] hover:bg-[#2a3840] text-gray-400 transition"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                    >
                        {/* Preview Info */}
                        <div className="flex items-center justify-between bg-[#101828] rounded-lg p-3 border border-[#1f2937]">
                            <div>
                                <p className="text-white text-sm font-medium">
                                    Voice Message
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    Duration: {formatTime(recordingTime)}
                                </p>
                            </div>

                            <button
                                onClick={handlePlayPreview}
                                className={`flex-shrink-0 p-2 rounded-full transition ${
                                    isPlaying
                                        ? 'bg-[#005c4b]'
                                        : 'bg-[#1f2937] hover:bg-[#2a3840]'
                                } text-[#00d084]`}
                                type="button"
                            >
                                {isPlaying ? '⏸' : '▶'}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSendAudio}
                                disabled={isSubmitting}
                                className="flex-1 p-3 bg-[#005c4b] hover:bg-[#00704d] text-white rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                type="button"
                            >
                                <Send className="w-5 h-5" />
                                Send
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setRecordedAudio(null);
                                    setRecordingTime(0);
                                }}
                                className="flex-shrink-0 p-3 rounded-full bg-[#1f2937] hover:bg-[#2a3840] text-gray-400 transition"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
