/**
 * Notification Testing Utility
 * 
 * Use this in the browser console to test notifications during development
 */

// Export these for use in console
(window as any).testNotifications = {
    /**
     * Test browser notification
     */
    async testBrowserNotification() {
        if (!('Notification' in window)) {
            console.warn('Notification API not supported');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification('Test Notification', {
                body: 'This is a test message from WhatsApp Clone',
                icon: '/logo.png',
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('Test Notification', {
                    body: 'Thank you for enabling notifications!',
                    icon: '/logo.png',
                });
            }
        }
    },

    /**
     * Test sound notification
     */
    async testSoundNotification() {
        try {
            const { playNotificationTone } = await import('@/utils/notificationSound');
            await playNotificationTone();
            console.log('✓ Sound notification played');
        } catch (error) {
            console.error('✗ Error playing sound:', error);
        }
    },

    /**
     * Test favicon badge
     */
    testFaviconBadge(count = 5) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                console.error('Could not get canvas context');
                return;
            }

            // Load favicon
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, 64, 64);

                // Draw red badge
                const badgeSize = 24;
                const badgeX = 64 - badgeSize / 2;
                const badgeY = badgeSize / 2;

                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
                ctx.stroke();

                // Draw text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(count.toString(), badgeX, badgeY);

                // Update favicon
                const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                if (faviconLink) {
                    faviconLink.href = canvas.toDataURL('image/png');
                    console.log(`✓ Favicon badge updated with count: ${count}`);
                }
            };
            img.src = '/favicon.ico';
        } catch (error) {
            console.error('✗ Error updating favicon:', error);
        }
    },

    /**
     * Test all notifications
     */
    async testAll() {
        console.log('Testing all notifications...\n');
        
        console.log('1. Testing browser notification...');
        await this.testBrowserNotification();
        
        console.log('\n2. Testing sound notification...');
        await this.testSoundNotification();
        
        console.log('\n3. Testing favicon badge...');
        this.testFaviconBadge(3);
        
        console.log('\n✓ All notification tests completed!');
    },

    /**
     * Check notification permissions
     */
    checkPermissions() {
        const notifStatus = 'Notification' in window ? Notification.permission : 'Not supported';
        const soundEnabled = localStorage.getItem('soundNotificationEnabled');
        
        console.log('=== Notification Permissions ===');
        console.log(`Browser Notifications: ${notifStatus}`);
        console.log(`Sound Enabled: ${soundEnabled === null ? 'Not set (default: true)' : soundEnabled}`);
    },
};

console.log('💬 Notification testing utilities loaded!');
console.log('Available commands:');
console.log('  - testNotifications.testBrowserNotification()');
console.log('  - testNotifications.testSoundNotification()');
console.log('  - testNotifications.testFaviconBadge(count)');
console.log('  - testNotifications.testAll()');
console.log('  - testNotifications.checkPermissions()');
console.log('\nExample: testNotifications.testAll()');
