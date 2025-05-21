import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, "users_driver", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserStatus(doc.data().status);
          }
        });
        return unsubscribeSnapshot;
      } else {
        setUserStatus(null);
      }
    });

    return () => unsubscribeAuth();
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
