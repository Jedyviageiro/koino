import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const CHANNEL_ID = 'koino-updates';

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function notificationsModule() {
  return import('expo-notifications');
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
  if (isExpoGo()) throw new Error(portuguese ? 'As notificações exigem uma build de desenvolvimento ou o APK.' : 'Notifications require a development build or the APK.');
  const Notifications = await notificationsModule();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Koino updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#E9900C',
      sound: 'default',
    });
  }
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
