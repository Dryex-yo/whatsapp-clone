import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
    src: string;
    fileName: string;
    duration?: number;
    fileSize?: string;
    isOwn?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    src,
    fileName,
    duration,
    fileSize,
    isOwn = false,
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    // Handle audio metadata loaded
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setTotalDuration(audioRef.current.duration);
        }
    };

    // Handle time update
    const handleTimeUpdate = () => {
        if (audioRef.current && !isSeeking) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    // Handle play/pause
    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    // Handle seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const handleSeekStart = () => {
        setIsSeeking(true);
    };

    const handleSeekEnd = () => {
        setIsSeeking(false);
    };

    // Handle audio end
    const handleAudioEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (seconds: number): string => {
        if (!seconds || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const displayDuration = duration || totalDuration || 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg p-3 max-w-xs ${
                isOwn
                    ? 'bg-gradient-to-br from-[#005c4b] to-[#004538]'
                    : 'bg-gradient-to-br from-[#2a3f3a] to-[#1f2937]'
            }`}
        >
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={src}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Player Controls */}
            <div className="flex items-center gap-3 mb-2">
                {/* Play/Pause Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayPause}
                    className={`flex-shrink-0 p-2 rounded-full transition ${
                        isOwn
                            ? 'bg-white/20 hover:bg-white/30'
                            : 'bg-[#005c4b]/30 hover:bg-[#005c4b]/50'
                    } text-white`}
                    type="button"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                    ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                </motion.button>

                {/* Volume Icon */}
                <Volume2 className="w-4 h-4 text-white/60 flex-shrink-0" />

                {/* Seekbar */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <input
                        type="range"
                        min="0"
                        max={totalDuration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        onMouseDown={handleSeekStart}
                        onMouseUp={handleSeekEnd}
                        onTouchStart={handleSeekStart}
                        onTouchEnd={handleSeekEnd}
                        className="flex-1 h-1 cursor-pointer accent-[#00d084]"
                        style={{
                            background: `linear-gradient(to right, 
                                #00d084 0%, 
                                #00d084 ${totalDuration ? (currentTime / totalDuration) * 100 : 0}%, 
                                ${isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,208,132,0.2)'} 
                                ${totalDuration ? (currentTime / totalDuration) * 100 : 0}%, 
                                ${isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,208,132,0.2)'} 100%)`,
                        }}
                    />

                    {/* Time Display */}
                    <span className="text-xs text-white/70 whitespace-nowrap font-mono">
                        {formatTime(currentTime)} / {formatTime(displayDuration)}
                    </span>
                </div>

                {/* Download Button */}
                <motion.a
                    href={src}
                    download={fileName}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 p-1.5 rounded-full transition ${
                        isOwn
                            ? 'text-white/70 hover:text-white'
                            : 'text-white/60 hover:text-white'
                    }`}
                    aria-label="Download"
                    title="Download audio"
                >
                    <Download className="w-4 h-4" />
                </motion.a>
            </div>

            {/* File Info */}
            <div className="space-y-1">
                <p className="text-xs text-white/80 truncate font-medium">
                    {fileName}
                </p>
                {fileSize && (
                    <p className="text-xs text-white/60">
                        {fileSize}
                    </p>
                )}
            </div>
        </motion.div>
    );
};
