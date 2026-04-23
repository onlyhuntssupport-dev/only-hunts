importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCL1Z5FW0CZ_NAX2lfkUVYW8DSL62jbts8",
  authDomain: "studio-7444078196-d8a54.firebaseapp.com",
  projectId: "studio-7444078196-d8a54",
  storageBucket: "studio-7444078196-d8a54.firebasestorage.app",
  messagingSenderId: "776444474583",
  appId: "1:776444474583:web:a4e2d40c62446bfd71ec92",
});

const messaging = firebase.messaging();

// Firebase automatically handles the display of the notification.
// We only use this listener to log the event or handle invisible 'data-only' payloads.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background payload received: ', payload);
});