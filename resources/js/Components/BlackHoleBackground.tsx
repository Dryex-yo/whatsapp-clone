import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Disc {
    p: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Point {
    x: number;
    y: number;
}

interface Particle {
    x: number;
    sx: number;
    dx: number;
    y: number;
    vy: number;
    p: number;
    r: number;
    c: string;
}

interface Clip {
    disc?: Disc;
    i?: number;
    path?: Path2D;
}

interface State {
    discs: Disc[];
    lines: Point[][];
    particles: Particle[];
    clip: Clip;
    startDisc: Disc;
    endDisc: Disc;
    rect: { width: number; height: number };
    render: { width: number; height: number; dpi: number };
    particleArea: {
        sw?: number;
        ew?: number;
        h?: number;
        sx?: number;
        ex?: number;
    };
    linesCanvas?: HTMLCanvasElement;
}

interface Props {
    strokeColor?: string;
    numberOfLines?: number;
    numberOfDiscs?: number;
    particleRGBColor?: [number, number, number];
    className?: string;
    children?: React.ReactNode;
}

const BlackHoleBackground: React.FC<Props> = ({
    strokeColor = "#737373",
    numberOfLines = 50,
    numberOfDiscs = 50,
    particleRGBColor = [255, 255, 255],
    className = "",
    children
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameIdRef = useRef<number>(0);
    const stateRef = useRef<State>({
        discs: [],
        lines: [],
        particles: [],
        clip: {},
        startDisc: { p: 0, x: 0, y: 0, w: 0, h: 0 },
        endDisc: { p: 0, x: 0, y: 0, w: 0, h: 0 },
        rect: { width: 0, height: 0 },
        render: { width: 0, height: 0, dpi: 1 },
        particleArea: {},
    });

    const linear = (p: number) => p;
    const easeInExpo = (p: number) => (p === 0 ? 0 : 2 ** (10 * (p - 1)));

    const tweenValue = (start: number, end: number, p: number, ease: "inExpo" | null = null) => {
        const delta = end - start;
        const easeFn = ease === "inExpo" ? easeInExpo : linear;
        return start + delta * easeFn(p);
    };

    const tweenDisc = (disc: Disc) => {
        const { startDisc, endDisc } = stateRef.current;
        disc.x = tweenValue(startDisc.x, endDisc.x, disc.p);
        disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, "inExpo");
        disc.w = tweenValue(startDisc.w, endDisc.w, disc.p);
        disc.h = tweenValue(startDisc.h, endDisc.h, disc.p);
    };

    const initParticle = (start: boolean = false): Particle => {
        const area = stateRef.current.particleArea;
        const sx = (area.sx || 0) + (area.sw || 0) * Math.random();
        const ex = (area.ex || 0) + (area.ew || 0) * Math.random();
        const dx = ex - sx;
        const y = start ? (area.h || 0) * Math.random() : (area.h || 0);
        const r = 0.5 + Math.random() * 4;
        const vy = 0.5 + Math.random();
        return {
            x: sx, sx, dx, y, vy, p: 0, r,
            c: `rgba(${particleRGBColor[0]}, ${particleRGBColor[1]}, ${particleRGBColor[2]}, ${Math.random()})`,
        };
    };

    const setupScene = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const dpi = window.devicePixelRatio || 1;
        stateRef.current.rect = { width: rect.width, height: rect.height };
        stateRef.current.render = { width: rect.width, height: rect.height, dpi };
        
        canvas.width = rect.width * dpi;
        canvas.height = rect.height * dpi;

        const { width, height } = stateRef.current.rect;
        if (width <= 0 || height <= 0) return;

        // Reset & Set Discs
        stateRef.current.startDisc = { p: 0, x: width * 0.5, y: height * 0.45, w: width * 0.75, h: height * 0.7 };
        stateRef.current.endDisc = { p: 0, x: width * 0.5, y: height * 0.95, w: 0, h: 0 };
        
        stateRef.current.discs = [];
        let prevBottom = height;
        stateRef.current.clip = {};

        for (let i = 0; i < numberOfDiscs; i++) {
            const p = i / numberOfDiscs;
            const disc = { p, x: 0, y: 0, w: 0, h: 0 };
            tweenDisc(disc);
            const bottom = disc.y + disc.h;
            if (bottom <= prevBottom) stateRef.current.clip = { disc: { ...disc }, i };
            prevBottom = bottom;
            stateRef.current.discs.push(disc);
        }

        if (stateRef.current.clip.disc) {
            const clipPath = new Path2D();
            const disc = stateRef.current.clip.disc;
            clipPath.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
            clipPath.rect(disc.x - disc.w, 0, disc.w * 2, disc.y);
            stateRef.current.clip.path = clipPath;
        }

        // Set Lines
        stateRef.current.lines = Array.from({ length: numberOfLines }, () => []);
        const linesAngle = (Math.PI * 2) / numberOfLines;
        
        stateRef.current.discs.forEach((disc) => {
            for (let i = 0; i < numberOfLines; i++) {
                const angle = i * linesAngle;
                stateRef.current.lines[i].push({
                    x: disc.x + Math.cos(angle) * disc.w,
                    y: disc.y + Math.sin(angle) * disc.h,
                });
            }
        });

        // Create Off-canvas for lines
        const offCanvas = document.createElement("canvas");
        offCanvas.width = width;
        offCanvas.height = height;
        const ctx = offCanvas.getContext("2d");
        if (ctx && stateRef.current.clip.path) {
            stateRef.current.lines.forEach((line) => {
                ctx.save();
                let lineIsIn = false;
                line.forEach((p1, j) => {
                    if (j === 0) return;
                    const p0 = line[j - 1];
                    if (!lineIsIn && (ctx.isPointInPath(stateRef.current.clip.path!, p1.x, p1.y))) {
                        lineIsIn = true;
                    } else if (lineIsIn) {
                        ctx.clip(stateRef.current.clip.path!);
                    }
                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
                ctx.restore();
            });
            stateRef.current.linesCanvas = offCanvas;
        }

        // Set Particles
        const disc = stateRef.current.clip.disc;
        if (disc) {
            stateRef.current.particleArea = {
                sw: disc.w * 0.5, ew: disc.w * 2, h: height * 0.85,
                sx: (width - (disc.w * 0.5)) / 2,
                ex: (width - (disc.w * 2)) / 2
            };
            stateRef.current.particles = Array.from({ length: 100 }, () => initParticle(true));
        }
    };

    const tick = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(stateRef.current.render.dpi, stateRef.current.render.dpi);

        // Update logic
        stateRef.current.discs.forEach(d => { d.p = (d.p + 0.001) % 1; tweenDisc(d); });
        stateRef.current.particles.forEach((p, i) => {
            p.p = 1 - p.y / (stateRef.current.particleArea.h || 1);
            p.x = p.sx + p.dx * p.p;
            p.y -= p.vy;
            if (p.y < 0) stateRef.current.particles[i] = initParticle();
        });

        // Draw Discs
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sd = stateRef.current.startDisc;
        ctx.ellipse(sd.x, sd.y, sd.w, sd.h, 0, 0, Math.PI * 2);
        ctx.stroke();

        stateRef.current.discs.forEach((d, i) => {
            if (i % 5 !== 0) return;
            const isClipped = d.w < (stateRef.current.clip.disc?.w || 0) - 5;
            if (isClipped) { ctx.save(); ctx.clip(stateRef.current.clip.path!); }
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, d.w, d.h, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (isClipped) ctx.restore();
        });

        // Draw Lines
        if (stateRef.current.linesCanvas) ctx.drawImage(stateRef.current.linesCanvas, 0, 0);

        // Draw Particles
        ctx.save();
        if (stateRef.current.clip.path) ctx.clip(stateRef.current.clip.path);
        stateRef.current.particles.forEach(p => {
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.rect(p.x, p.y, p.r, p.r);
            ctx.fill();
        });
        ctx.restore();

        ctx.restore();
        animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        setupScene();
        tick();
        window.addEventListener("resize", setupScene);
        return () => {
            window.removeEventListener("resize", setupScene);
            cancelAnimationFrame(animationFrameIdRef.current);
        };
    }, []);

    return (
        <div className={`relative w-full h-full overflow-hidden 
            before:absolute before:top-1/2 before:left-1/2 before:block before:w-[140%] before:h-[140%] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] 
            before:[background:radial-gradient(ellipse_at_50%_55%,transparent_10%,white_50%)] 
            after:absolute after:top-1/2 after:left-1/2 after:z-[5] after:block after:w-full after:h-full after:-translate-x-1/2 after:-translate-y-1/2 after:mix-blend-overlay after:content-[''] 
            after:[background:radial-gradient(ellipse_at_50%_75%,#a900ff_20%,transparent_75%)] 
            dark:before:[background:radial-gradient(ellipse_at_50%_55%,transparent_10%,black_50%)] ${className}`}>
            
            {children}

            <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full opacity-10 dark:opacity-20" />

            <motion.div
                className="absolute top-[-71.5%] left-1/2 z-[3] h-[140%] w-[30%] -translate-x-1/2 rounded-b-full opacity-75 mix-blend-plus-darker blur-3xl dark:mix-blend-plus-lighter"
                style={{
                    background: 'linear-gradient(20deg,#00f8f1,#ffbd1e40_16.5%,#fe848f_33%,#fe848f40_49.5%,#00f8f1_66%,#00f8f180_85.5%,#ffbd1e_100%)',
                    backgroundSize: '100% 200%',
                }}
                animate={{ backgroundPosition: ['0% 100%', '0% 300%'] }}
                transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
            />

            <div className="absolute top-0 left-0 z-[7] w-full h-full opacity-50 mix-blend-overlay dark:[background:repeating-linear-gradient(transparent,transparent_1px,white_1px,white_2px)]" />
        </div>
    );
};

export default BlackHoleBackground;