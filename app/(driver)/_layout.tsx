import { Tabs } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { Platform, Alert } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  doc,
  onSnapshot,
  query,
  collection,
  orderBy,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import {
  sendLocalNotification,
  configurePushNotifications,
} from "@/utils/notifications";
import * as Notifications from "expo-notifications";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  const notificationSentRef = useRef<boolean>(false);
  const [userZipStrings, setUserZipStrings] = useState<Set<string>>(new Set());
  const [userStates, setUserStates] = useState<Set<string>>(new Set());

  // Функция для проверки и сохранения информации о показанном уведомлении
  const checkAndSaveNotification = async (
    campaignId: string,
    userId: string
  ) => {
    const notificationRef = doc(
      db,
      `users_driver/${userId}/campaign_notifications/${campaignId}`
    );
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      await setDoc(notificationRef, {
        shownAt: new Date(),
      });
      return true;
    }
    return false;
  };

  // Инициализация уведомлений при запуске
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const permissionStatus = await configurePushNotifications();
        console.log("Push notification permission status:", permissionStatus);

        if (!permissionStatus) {
          Alert.alert(
            "Notifications Disabled",
            "Please enable notifications in your device settings to receive important updates"
          );
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    initNotifications();
  }, []);

  // Отслеживание статуса пользователя и его местоположения
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, "users_driver", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, async (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            const newStatus = userData.status;
            const hasReceivedActivationNotification =
              userData.hasReceivedActivationNotification;
            const zipCodeObjects = userData.zipCodes || [];

            console.log("Status changed:", {
              previous: previousStatusRef.current,
              new: newStatus,
            });
            setUserStatus(newStatus);

            // Обновляем ZIP-коды и штаты пользователя
            const newUserStates = new Set<string>();
            const newUserZipStrings = new Set<string>();

            for (const zip of zipCodeObjects) {
              if (zip.state) newUserStates.add(zip.state);
              if (zip.key) newUserZipStrings.add(zip.key);
            }

            setUserStates(newUserStates);
            setUserZipStrings(newUserZipStrings);

            // Отправляем уведомление об активации аккаунта
            if (
              previousStatusRef.current !== newStatus &&
              newStatus === "active" &&
              !hasReceivedActivationNotification
            ) {
              try {
                const { status } = await Notifications.getPermissionsAsync();
                console.log("Current notification permission status:", status);

                if (status === "granted") {
                  await sendLocalNotification(
                    "Account Activated",
                    "Your account has been successfully activated! You can now accept orders."
                  );
                  // Сохраняем информацию о том, что уведомление было отправлено
                  await updateDoc(userRef, {
                    hasReceivedActivationNotification: true,
                  });
                  console.log("Activation notification sent and status saved");
                }
              } catch (error) {
                console.error("Error sending notification:", error);
              }
            }
            previousStatusRef.current = newStatus;
          }
        });

        // Отслеживание новых кампаний
        const campaignsQuery = query(
          collection(db, "campaigns"),
          orderBy("startDate", "desc")
        );

        const unsubscribeCampaigns = onSnapshot(
          campaignsQuery,
          async (snapshot) => {
            for (const change of snapshot.docChanges()) {
              if (change.type === "added") {
                const data = change.doc.data();
                const campaignId = change.doc.id;

                const matchesNation = data.nation === true;
                const matchesZip = data.zipCodes?.some((zip: string) =>
                  userZipStrings.has(zip)
                );
                const matchesState = data.states?.some((state: string) =>
                  userStates.has(state)
                );

                if (matchesNation || matchesZip || matchesState) {
                  const shouldShowNotification = await checkAndSaveNotification(
                    campaignId,
                    user.uid
                  );
                  if (shouldShowNotification) {
                    const { status } =
                      await Notifications.getPermissionsAsync();
                    if (status === "granted") {
                      await sendLocalNotification(
                        "New Campaign Available!",
                        "A new campaign has appeared in your area. Check it out!"
                      );
                    }
                  }
                }
              }
            }
          }
        );

        return () => {
          unsubscribeSnapshot();
          unsubscribeCampaigns();
        };
      } else {
        setUserStatus(null);
        previousStatusRef.current = null;
        notificationSentRef.current = false;
        setUserStates(new Set());
        setUserZipStrings(new Set());
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Слушатель для отображения уведомлений
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
        tabBarItemStyle: {
          opacity: userStatus !== "active" ? 0.5 : 1,
        },
      }}
    >
      <Tabs.Screen
        name="my-qwests"
        options={{
          title: "My Qwests",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bag" color={color} />
          ),
          tabBarButton: (props) => (
            <HapticTab
              {...props}
              onPress={(e) => {
                if (userStatus !== "active") {
                  return;
                }
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="available-qwests"
        options={{
          title: "Available Qwests",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
          tabBarButton: (props) => (
            <HapticTab
              {...props}
              onPress={(e) => {
                if (userStatus !== "active") {
                  return;
                }
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
