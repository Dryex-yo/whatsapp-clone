/**
 * Generates a consistent, unique color for a user based on their ID
 * Uses a palette of vibrant, distinguishable colors
 */

const colorPalette = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B88B', // Peach
    '#AED6F1', // Sky Blue
    '#F5B7B1', // Light Red
    '#D5A6BD', // Lavender
    '#82E0AA', // Light Green
    '#FAD7A0', // Light Orange
    '#A3E4D7', // Aqua
    '#F9E79F', // Pale Yellow
];

/**
 * Get a unique color for a user based on their ID
 * @param userId The user ID
 * @returns A hex color string
 */
export function getUserColor(userId: number): string {
    return colorPalette[userId % colorPalette.length];
}

/**
 * Get initials from a name
 * @param name The full name
 * @returns Two-character initials
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Get lighter shade of a color (for hover states)
 * @param color Hex color string
 * @param percent Lighten percent (0-100)
 * @returns Lighter hex color
 */
export function lightenColor(color: string, percent: number = 20): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    )
        .toString(16)
        .slice(1);
}
