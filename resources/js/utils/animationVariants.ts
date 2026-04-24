import { motion } from 'framer-motion';

/**
 * Fade-in animation variants for Framer Motion
 * Provides smooth transition effects for UI elements
 */
export const fadeInVariants = {
    hidden: {
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.4,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Slide-in animation variants (left to right)
 */
export const slideInVariants = {
    hidden: {
        opacity: 0,
        x: 20,
        transition: {
            duration: 0.2,
        },
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
        },
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Scale and fade animation variants
 * Perfect for modals and pop-ups
 */
export const scaleInVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2,
        },
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Chat window slide animation (bottom to top for mobile)
 */
export const slideUpVariants = {
    hidden: {
        opacity: 0,
        y: 400,
        transition: {
            duration: 0.2,
        },
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            damping: 30,
            stiffness: 200,
        },
    },
    exit: {
        opacity: 0,
        y: 400,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Stagger animation for lists
 */
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
        },
    },
};
