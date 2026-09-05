'use client';
/**
 * useFCM.js
 * Drop-in wrapper exporting native FCM push notifications.
 */
export { useNativePush as useFCM, registerDeviceTokenOnServer as registerPushToken, requestNativePushPermission } from './useNativePush';
