/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TuniVerse Device & OS Detection Engine
 * 
 * Accurately detects client operating systems (iOS, Android, Windows, Mac, Linux)
 * across Mobile Browsers, WebKit, iPads, and Native Capacitor WebViews.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const isIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  
  // Standard iPhone, iPod, iPad detection
  const isIPhoneOrIPad = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  
  // Modern iPadOS 13+ detection (reports as MacIntel with touch points)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  
  return isIPhoneOrIPad || isIPadOS;
};

export const isAndroid = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  return /android/i.test(ua);
};

export const isMobile = () => {
  return isIOS() || isAndroid();
};

export const getDeviceOS = () => {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'desktop';
};

export const getDeviceOSName = () => {
  const os = getDeviceOS();
  if (os === 'ios') return 'Apple iOS (iPhone / iPad)';
  if (os === 'android') return 'Android';
  return 'Desktop / Laptop';
};
