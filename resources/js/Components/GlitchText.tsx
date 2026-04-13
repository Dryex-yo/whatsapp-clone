import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility untuk menggabungkan class */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlitchTextProps {
    text: string;
    speed?: number;
    enableShadows?: boolean;
    enableOnHover?: boolean;
    className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({
    text = "",
    speed = 0.5,
    enableShadows = true,
    enableOnHover = false,
    className = "",
}) => {
    // Menghitung variabel dinamis (sebagai pengganti v-bind Vue)
    const glitchStyles = {
        '--after-duration': `${speed * 3}s`,
        '--before-duration': `${speed * 2}s`,
        '--after-shadow': enableShadows ? "-5px 0 red" : "none",
        '--before-shadow': enableShadows ? "5px 0 cyan" : "none",
    } as React.CSSProperties;

    return (
        <>
            <div
                data-text={text}
                style={glitchStyles}
                className={cn(
                    "glitch-container",
                    enableOnHover ? "enable-on-hover" : "",
                    className
                )}
            >
                {text}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .glitch-container {
                    color: #fff;
                    font-size: clamp(2rem, 10vw, 6rem);
                    white-space: nowrap;
                    font-weight: 900;
                    position: relative;
                    margin: 0 auto;
                    user-select: none;
                    cursor: pointer;
                }

                .glitch-container::after,
                .glitch-container::before {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    color: #fff;
                    /* Ganti background-color: #060606; menjadi transparan */
                    background-color: transparent; 
                    overflow: hidden;
                    clip-path: inset(0 0 0 0);
                }

                /* Default State (Bukan Hover) */
                .glitch-container:not(.enable-on-hover)::after {
                    left: 10px;
                    text-shadow: var(--after-shadow);
                    animation: animate-glitch var(--after-duration) infinite linear alternate-reverse;
                }
                .glitch-container:not(.enable-on-hover)::before {
                    left: -10px;
                    text-shadow: var(--before-shadow);
                    animation: animate-glitch var(--before-duration) infinite linear alternate-reverse;
                }

                /* Enable On Hover State */
                .glitch-container.enable-on-hover::after,
                .glitch-container.enable-on-hover::before {
                    opacity: 0;
                }

                .glitch-container.enable-on-hover:hover::after {
                    opacity: 1;
                    left: 10px;
                    text-shadow: var(--after-shadow);
                    animation: animate-glitch var(--after-duration) infinite linear alternate-reverse;
                }
                .glitch-container.enable-on-hover:hover::before {
                    opacity: 1;
                    left: -10px;
                    text-shadow: var(--before-shadow);
                    animation: animate-glitch var(--before-duration) infinite linear alternate-reverse;
                }

                @keyframes animate-glitch {
                    0% { clip-path: inset(20% 0 50% 0); }
                    20% { clip-path: inset(30% 0 40% 0); }
                    40% { clip-path: inset(25% 0 35% 0); }
                    60% { clip-path: inset(15% 0 55% 0); }
                    80% { clip-path: inset(20% 0 50% 0); }
                    100% { clip-path: inset(30% 0 40% 0); }
                }
            `}} />
        </>
    );
};

export default GlitchText;