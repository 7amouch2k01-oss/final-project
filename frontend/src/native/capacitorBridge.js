import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Check if running inside native Android or iOS container
 */
export const isNative = Capacitor.isNativePlatform();

/**
 * Get dynamic backend API base URL
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback when environment variable is not explicitly provided
  if (isNative || window.location.protocol === 'capacitor:') {
    return 'http://localhost:5000/api';
  }
  return '/api';
};

/**
 * Get dynamic Socket.IO base URL
 */
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (isNative || window.location.protocol === 'capacitor:') {
    return 'http://localhost:5000';
  }
  return window.location.origin;
};

/**
 * Initialize native device capabilities on app startup
 */
export const initNativeFeatures = async (navigate) => {
  if (!isNative) return;

  try {
    // 1. Configure Android Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0B0C10' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('[Native] StatusBar setup:', err);
  }

  try {
    // 2. Hide Native Splash Screen
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.warn('[Native] SplashScreen hide:', err);
  }

  try {
    // 3. Android Hardware Back Button Navigation Handler
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        if (navigate) {
          navigate(-1);
        } else {
          window.history.back();
        }
      } else {
        CapApp.exitApp();
      }
    });
  } catch (err) {
    console.warn('[Native] BackButton listener setup:', err);
  }
};

/**
 * Trigger subtle haptic tactile feedback on mobile
 */
export const triggerHaptic = async (style = ImpactStyle.Light) => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style });
  } catch {}
};
