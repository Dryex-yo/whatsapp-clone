import React, { useState, useEffect, useMemo, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility untuk menggabungkan class Tailwind (seperti fungsi cn Anda)
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface VideoMaskedTextProps {
    src: string;
    children: string; // Teks yang akan ditampilkan
    className?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    preload?: "auto" | "metadata" | "none";
    fontSize?: string | number;
    fontWeight?: string | number;
    textAnchor?: string;
    dominantBaseline?: string;
    fontFamily?: string;
}

const VideoMaskedText: React.FC<VideoMaskedTextProps> = ({
    src,
    children,
    className = "",
    autoPlay = true,
    muted = true,
    loop = true,
    preload = "auto",
    fontSize = 20,
    fontWeight = "bold",
    textAnchor = "middle",
    dominantBaseline = "middle",
    fontFamily = "sans-serif",
}) => {
    const [svgMask, setSvgMask] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);

    // Menghitung Data URL untuk Masking
    const dataUrlMask = useMemo(() => {
        return `url("data:image/svg+xml,${encodeURIComponent(svgMask)}")`;
    }, [svgMask]);

    const updateSvgMask = () => {
    // Jika fontSize adalah angka, kita buat dia responsif (vw). Jika string, pakai apa adanya.
    const finalSize = typeof fontSize === "number" ? `${fontSize}vw` : fontSize;
        
        const svg = `
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
                <text 
                    x='50' 
                    y='50' 
                    font-size='${finalSize}' 
                    font-weight='${fontWeight}' 
                    font-family='${fontFamily}'
                    text-anchor='middle' 
                    dominant-baseline='central'
                    fill='white'
                >
                    ${children}
                </text>
            </svg>
        `.trim();

        setSvgMask(svg);
    };

    // Update mask saat properti berubah
    useEffect(() => {
        updateSvgMask();
        window.addEventListener("resize", updateSvgMask);
        
        return () => {
            window.removeEventListener("resize", updateSvgMask);
        };
    }, [children, fontSize, fontWeight, textAnchor, dominantBaseline, fontFamily]);

    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                        maskImage: dataUrlMask,
                        WebkitMaskImage: dataUrlMask,
                        maskSize: 'cover', 
                        WebkitMaskSize: 'cover',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                    }}
            >
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay={autoPlay}
                    muted={muted}
                    loop={loop}
                    preload={preload}
                    playsInline
                >
                    <source src={src} />
                    Your browser does not support the video tag.
                </video>
            </div>
            
            {/* Untuk aksesibilitas (SEO) */}
            <span className="sr-only">{children}</span>
        </div>
    );
};

export default VideoMaskedText;