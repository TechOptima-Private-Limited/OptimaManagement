/**
 * Utility for handling web push notification registration and subscription
 */

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID_PUBLIC_KEY is not defined in environment variables!');
}

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered with scope:', registration.scope);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }
    return null;
};

/**
 * Subscribe the user to push notifications
 */
export const subscribeUser = async (registration) => {
    try {
        if (!VAPID_PUBLIC_KEY) {
            throw new Error('VAPID_PUBLIC_KEY is missing');
        }

        console.log('Using VAPID Public Key:', VAPID_PUBLIC_KEY);
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        console.log('Converted applicationServerKey (bytes):', applicationServerKey);

        // Clear existing subscription if any to avoid stale state
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log('Unsubscribing from existing subscription...');
            await existingSubscription.unsubscribe();
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        console.log('User is subscribed successfully:', subscription);
        return subscription;
    } catch (error) {
        console.error('Failed to subscribe the user:', error);
        if (error.name === 'AbortError') {
            console.error('AbortError: This often means a network issue or the push service is blocked by a VPN/Proxy.');
        }
        return null;
    }
};

/**
 * Helper to convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
