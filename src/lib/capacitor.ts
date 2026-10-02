import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';

export const isNative = Capacitor.isNativePlatform();

/**
 * Initializes native Android device features (Status bar, splash screen, network listeners, deep links)
 */
export const initCapacitor = async (
  onNetworkChange?: (connected: boolean) => void,
  onDeepLink?: (url: string) => void
) => {
  if (!isNative) return;

  try {
    // 1. Configure Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1e3a8a' });
  } catch (err) {
    console.warn('StatusBar init warning:', err);
  }

  try {
    // 2. Hide Splash Screen after launch
    await SplashScreen.hide();
  } catch (err) {
    console.warn('SplashScreen hide warning:', err);
  }

  try {
    // 3. Monitor Network Status
    const status = await Network.getStatus();
    if (!status.connected && onNetworkChange) {
      onNetworkChange(false);
    }

    Network.addListener('networkStatusChange', (netStatus) => {
      if (onNetworkChange) {
        onNetworkChange(netStatus.connected);
      }
    });
  } catch (err) {
    console.warn('Network listener warning:', err);
  }

  try {
    // 4. Handle Deep Links for Supabase Auth Callbacks
    CapApp.addListener('appUrlOpen', (event) => {
      if (event.url && onDeepLink) {
        onDeepLink(event.url);
      }
    });
  } catch (err) {
    console.warn('AppUrlOpen listener warning:', err);
  }
};

/**
 * Android Back Button handler registration
 */
export const registerBackButtonListener = (handler: () => boolean | void) => {
  if (!isNative) return () => {};

  const listenerPromise = CapApp.addListener('backButton', () => {
    const handled = handler();
    if (!handled) {
      // If nothing left in stack, exit app
      CapApp.exitApp();
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove());
  };
};

/**
 * Handles CSV export across platforms:
 * - On Native Android: Writes file via Filesystem and opens Android Share / Save dialog
 * - On Web: Falls back to standard browser Blob download
 */
export const saveOrShareCSV = async (
  filename: string,
  csvContent: string
): Promise<boolean> => {
  if (isNative) {
    try {
      // Write CSV to cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: '\uFEFF' + csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // Open Android Share / Save sheet
      await Share.share({
        title: 'Export Applications to CSV',
        text: 'Job & Internship Applications Report',
        url: result.uri,
        dialogTitle: 'Share or Save CSV',
      });
      return true;
    } catch (err) {
      console.warn('Capacitor Share/Filesystem error, falling back to web download:', err);
    }
  }

  // Web Browser Fallback
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
