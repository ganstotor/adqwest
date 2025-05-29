import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Конфигурация уведомлений для приложения
export async function configurePushNotifications() {
  // Запрашиваем разрешение на отправку уведомлений
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  // Настраиваем обработку уведомлений
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Получаем токен для push-уведомлений
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: "e8843650-d61f-4805-a308-b51d1e90d2ff", // Ваш projectId из app.json
  });

  // Дополнительные настройки для Android
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token.data;
}

// Функция для отправки локального уведомления
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null, // Отправить немедленно
  });
}
