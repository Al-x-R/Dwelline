import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { PlannedNotification } from './planNotifications';

const CHANNEL_ID = 'reminders';

export interface NotificationData extends Record<string, unknown> {
  kind: PlannedNotification['kind'];
  journeyId?: string;
}

let configured = false;

// Show reminders even while the app is open, and create the Android channel (Android 13 asks only once one exists).
export async function configureNotifications(channelName: string): Promise<void> {
  if (!configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    configured = true;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: channelName,
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

function isGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  if (Platform.OS === 'ios') {
    const ios = status.ios?.status;
    return ios === Notifications.IosAuthorizationStatus.AUTHORIZED
      || ios === Notifications.IosAuthorizationStatus.PROVISIONAL
      || ios === Notifications.IosAuthorizationStatus.EPHEMERAL;
  }
  return status.granted;
}

// Asks only when the system still allows asking; a denial is final until changed in system settings.
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current)) return true;
  if (!current.canAskAgain) return false;
  return isGranted(await Notifications.requestPermissionsAsync());
}

export async function hasPermission(): Promise<boolean> {
  return isGranted(await Notifications.getPermissionsAsync());
}

// The plan is recomputed from scratch on every change, so replacing everything is simpler than diffing.
export async function replaceScheduled(plan: PlannedNotification[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    const data: NotificationData = {kind: n.kind, ...(n.journeyId ? {journeyId: n.journeyId} : {})};
    await Notifications.scheduleNotificationAsync({
      content: {title: n.title, body: n.body, data},
      trigger: {type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date, channelId: CHANNEL_ID},
    });
  }
}

export function readData(response: Notifications.NotificationResponse): NotificationData | null {
  const data = response.notification.request.content.data as Partial<NotificationData> | undefined;
  return data?.kind ? (data as NotificationData) : null;
}
