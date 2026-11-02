import { Capacitor, registerPlugin } from '@capacitor/core';

// True inside the iOS (or Android) app shell, false in a normal browser.
export const isNativeApp = () => Capacitor.isNativePlatform();
export const isIOSApp = () => Capacitor.getPlatform() === 'ios';

// Implemented in ios/App/App/NativePrintPlugin.swift. WKWebView ignores window.print(),
// so the app opens the iOS print sheet instead, which also offers "Save to Files" as PDF.
const NativePrint = registerPlugin('NativePrint');

export async function printPage(jobName = 'ProximaStruc') {
  if (!isNativeApp()) { window.print(); return; }
  await NativePrint.printPage({ jobName });
}
