/**
 * Notification Service for Phone / Browser Web Push & System Notifications
 * Supports Android PWA, mobile browsers, and desktop notifications.
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export const notificationService = {
  /**
   * Check if the device / browser supports the Web Notification API
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Get the current notification permission state
   */
  getPermission(): NotificationPermissionStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Request permission from the user for system/phone push notifications
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  },

  /**
   * Send a system notification to the user's phone / desktop
   */
  async sendNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      tag?: string;
      badge?: string;
      data?: any;
    } = {}
  ): Promise<boolean> {
    if (!this.isSupported()) return false;

    // If permission not yet decided, attempt to request it
    let perm: NotificationPermissionStatus = Notification.permission;
    if (perm === 'default') {
      perm = await this.requestPermission();
    }

    if (perm !== 'granted') {
      return false;
    }

    const defaultIcon = '/favicon.ico';
    const notifOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || defaultIcon,
      badge: options.badge || defaultIcon,
      tag: options.tag || 'job-tracker-reminder',
      data: options.data,
    };

    // Mobile vibration if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {
        // Ignore vibration errors
      }
    }

    // Try service worker showNotification first (ideal for PWA & Android)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notifOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('Service worker notification failed, falling back to window.Notification:', swErr);
      }
    }

    // Fallback to standard window Notification
    try {
      new Notification(title, notifOptions);
      return true;
    } catch (err) {
      console.warn('Standard notification failed:', err);
      return false;
    }
  },

  /**
   * Send an immediate test notification to verify notifications work on user's phone
   */
  async sendTestNotification(): Promise<boolean> {
    const granted = await this.requestPermission();
    if (granted !== 'granted') return false;

    return this.sendNotification('🔔 Job & Internship Tracker Alert', {
      body: 'Notifications are active on your device! You will receive timely alerts for assessments, interviews, and deadlines.',
      tag: 'test-notification',
    });
  },

  /**
   * Open the user's default email client (Gmail app on phone or desktop)
   * with prefilled reminder subject and body
   */
  openEmailReminder(
    userEmail: string,
    subject: string,
    body: string
  ): void {
    const mailtoUrl = `mailto:${encodeURIComponent(userEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  },

  /**
   * Generate a Google Calendar link that schedules reminders directly to user's phone calendar
   */
  getGoogleCalendarUrl(
    title: string,
    details: string,
    dateStr: string,
    timeStr?: string | null
  ): string {
    const cleanDate = dateStr.replace(/-/g, '');
    let dateParam = `${cleanDate}/${cleanDate}`;

    if (timeStr && timeStr.includes(':')) {
      const [h, m] = timeStr.split(':');
      const startHour = h.padStart(2, '0');
      const startMin = m.padStart(2, '0');
      dateParam = `${cleanDate}T${startHour}${startMin}00/${cleanDate}T${startHour}${startMin}00`;
    }

    const encodedTitle = encodeURIComponent(title);
    const encodedDetails = encodeURIComponent(details);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDetails}&dates=${dateParam}`;
  },
};
