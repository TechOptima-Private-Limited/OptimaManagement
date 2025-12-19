/* eslint-disable no-restricted-globals */

// This service worker handles web push notifications
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[Service Worker] Push Data:', data);
            const options = {
                body: data.body,
                icon: data.icon || '/logo192.png',
                badge: data.badge || '/logo192.png',
                data: {
                    url: data.url || '/'
                }
            };

            event.waitUntil(
                self.registration.showNotification(data.head || 'New Notification', options)
            );
        } catch (e) {
            console.error('[Service Worker] Error parsing push data:', e);
        }
    } else {
        console.warn('[Service Worker] Push event but no data.');
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
