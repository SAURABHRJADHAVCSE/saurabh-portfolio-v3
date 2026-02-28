/**
 * Firebase Messaging Service Worker
 *
 * Handles FCM push notifications when the app is in the background
 * or closed.  This file MUST live at the root of /public/ so it can
 * be registered with the correct scope.
 *
 * SETUP:
 *   1. Replace the firebaseConfig values below with your project's
 *      public Firebase config (same values as NEXT_PUBLIC_FIREBASE_*).
 *   2. Set NEXT_PUBLIC_FIREBASE_UAT_VAPID_KEY in .env
 *   3. Register the service worker in your app and request notification
 *      permission.
 *
 * These config values are SAFE to hardcode — they're already public
 * in the client bundle. They are NOT secret keys.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// ⬇️ Replace with YOUR Firebase project config (public values only)
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  const data = payload.data || {};
  const notificationTitle = payload.notification?.title || data.title || 'DevStudio';
  const notificationOptions = {
    body: payload.notification?.body || data.body || '',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    data: {
      clickAction: data.clickAction || '/',
    },
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the relevant page
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus an existing tab if one is open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(clickAction);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(clickAction);
    }),
  );
});
