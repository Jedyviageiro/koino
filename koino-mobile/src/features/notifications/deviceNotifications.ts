import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { authenticatedRequest } from '@/services/authenticatedApi';

const CHANNEL_ID = 'koino-updates';

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function notificationsModule() {
  return import('expo-notifications');
}

async function ensureAndroidChannel(Notifications: typeof import('expo-notifications')) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Koino updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#E9900C',
    sound: 'default',
  });
}

export async function registerDevicePushToken() {
  if (Platform.OS === 'web' || isExpoGo()) return;
  const Notifications = await notificationsModule();
  await ensureAndroidChannel(Notifications);
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await authenticatedRequest<void>('/notifications/device-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
}

export async function listenForNotificationResponses(onRoute: (route: string) => void) {
  if (Platform.OS === 'web' || isExpoGo()) return () => {};
  const Notifications = await notificationsModule();
  const open = (response: import('expo-notifications').NotificationResponse | null) => {
    const route = response?.notification.request.content.data?.route;
    if (typeof route === 'string' && route.startsWith('/')) onRoute(route);
  };
  open(await Notifications.getLastNotificationResponseAsync());
  const subscription = Notifications.addNotificationResponseReceivedListener(open);
  return () => subscription.remove();
}

export async function configureNotificationPresentation() {
  if (Platform.OS === 'web' || isExpoGo()) return;
  const Notifications = await notificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function sendDeviceTestNotification(portuguese: boolean) {
  if (Platform.OS === 'web') throw new Error(portuguese ? 'Teste disponível apenas no telemóvel.' : 'This test is only available on a phone.');
  if (isExpoGo()) throw new Error(portuguese ? 'Este teste estará disponível na aplicação Koino instalada.' : 'This test will be available in the installed Koino app.');
  const Notifications = await notificationsModule();
  await ensureAndroidChannel(Notifications);
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error(portuguese ? 'Ative as notificações nas definições do telemóvel.' : 'Enable notifications in your phone settings.');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: portuguese ? 'Notificações Koino ativadas' : 'Koino notifications are ready',
      body: portuguese ? 'As atualizações aparecerão aqui no seu telemóvel.' : 'Updates will appear here on your phone.',
      sound: 'default',
      data: { route: '/notifications' },
    },
    trigger: null,
  });
}
