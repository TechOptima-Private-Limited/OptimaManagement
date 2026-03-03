/**
 * Utility for handling web push notification registration and subscription
 */

import api from '../services/api';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID_PUBLIC_KEY is not defined in environment variables!');
}

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported by this browser');
        return null;
    }

    try {
        // First register the service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered with scope:', registration.scope);

        // Wait for it to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        return readyRegistration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

/**
 * Subscribe the user to push notifications
 */
export const subscribeUser = async (registration) => {
    try {
        let activeVapidKey = VAPID_PUBLIC_KEY;

        if (!activeVapidKey) {
            console.log('VAPID_PUBLIC_KEY missing in env, fetching from backend...');
            try {
                // Use our standard api service which handles baseURL and Auth headers
                const response = await api.get('/notifications/vapid-public-key/');
                if (response.data && response.data.public_key) {
                    activeVapidKey = response.data.public_key;
                    console.log('Successfully fetched VAPID key from backend');
                }
            } catch (fetchError) {
                console.error('Failed to fetch VAPID key from backend:', fetchError);
            }
        }

        if (!activeVapidKey) {
            throw new Error('VAPID_PUBLIC_KEY is missing (checked env and backend)');
        }

        if (!registration.pushManager) {
            throw new Error('Push Manager not supported by your browser');
        }

        console.log('Using VAPID Public Key:', activeVapidKey);
        const applicationServerKey = urlBase64ToUint8Array(activeVapidKey);

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Check if the applicationServerKey matches (roughly, by comparing vs provided one)
            // If it doesn't match or is old, we should unsubscribe and re-subscribe
            console.log('Existing subscription found');
            return subscription;
        }

        console.log('Subscribing user...');
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        console.log('User is subscribed successfully:', subscription);
        return subscription;
    } catch (error) {
        console.error('Failed to subscribe the user:', error);
        if (error.name === 'AbortError') {
            const details = 'This often means a network issue, the push service is blocked by a VPN/Proxy, or you are in an Incognito/Private window where Push may be disabled.';
            console.error(`AbortError: ${details}`);
            throw new Error(`Push registration failed: ${details}`);
        }
        throw error;
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
