import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Push remoto do Expo não se aplica à Web (a ADR já trata Web como acesso alternativo,
// não como alvo do push) nem a emuladores/simuladores sem hardware de notificação.
// Também exige um projectId de EAS configurado — sem ele, `getExpoPushTokenAsync` lança.
export async function registrarPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[Notificacoes] Nenhum projectId de EAS configurado — pulando registro de push token.');
    return null;
  }

  const { status: statusAtual } = await Notifications.getPermissionsAsync();
  let status = statusAtual;

  if (status !== 'granted') {
    const resultado = await Notifications.requestPermissionsAsync();
    status = resultado.status;
  }

  if (status !== 'granted') {
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (error) {
    console.warn('[Notificacoes] Falha ao obter o push token:', error);
    return null;
  }
}
