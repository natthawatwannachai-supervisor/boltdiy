import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken } from './api/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * ขอสิทธิ์แจ้งเตือนและบันทึก Expo push token
 * ใช้ส่งข้อความ เช่น "🎬 วิดีโอ 'การเกิดฝน' สร้างเสร็จแล้ว" เมื่องานเบื้องหลังทำเสร็จ
 */
export const registerForPushNotifications = async (userId: string) => {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'การแจ้งเตือนทั่วไป',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#1D4ED8',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

  await registerPushToken(userId, token, Platform.OS);

  return token;
};

export const disableNotifications = async () => {
  await Notifications.setBadgeCountAsync(0);
  await Notifications.dismissAllNotificationsAsync();
};
