import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Link } from "expo-router";
import BurgerMenu from "../../../components/ui/BurgerMenu";
import GoldButton from "../../../components/ui/GoldButton";
import ContainerInfoMain from "../../../components/ui/ContainerInfoMain";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { BACKGROUND1_DARK_MAIN, ACCENT1_LIGHT } from "../../../constants/Colors";

interface UserAdData {
  companyName?: string;
  logo?: string;
}

const OrderBagsScreen = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userZipStrings, setUserZipStrings] = useState<Set<string>>(new Set());
  const [userStates, setUserStates] = useState<Set<string>>(new Set());
  const db = getFirestore();
  const auth = getAuth();
  const router = useRouter();

  // Получение ZIP-кодов и штатов пользователя
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userRef = doc(db, "users_driver", userId);
    return onSnapshot(userRef, (userSnap) => {
      if (userSnap.exists()) {
        const zipCodeObjects: { key: string; state: string }[] =
          userSnap.data()?.zipCodes || [];

        const newUserStates = new Set<string>();
        const newUserZipStrings = new Set<string>();

        for (const zip of zipCodeObjects) {
          if (zip.state) newUserStates.add(zip.state);
          if (zip.key) newUserZipStrings.add(zip.key);
        }

        setUserStates(newUserStates);
        setUserZipStrings(newUserZipStrings);
      }
    });
  }, []);

  // Отслеживание кампаний в реальном времени
  useEffect(() => {
    const campaignsQuery = query(
      collection(db, "campaigns"),
      orderBy("startDate", "desc")
    );

    const unsubscribe = onSnapshot(campaignsQuery, async (snapshot) => {
      try {
        // Обновляем список всех кампаний
        const allFiltered = await Promise.all(
          snapshot.docs.map(async (campaignDoc) => {
            const data = campaignDoc.data();
            const campaignId = campaignDoc.id;

            const matchesNation = data.nation === true;
            const matchesZip = data.zipCodes?.some((zip: string) =>
              userZipStrings.has(zip)
            );
            const matchesState = data.states?.some((state: string) =>
              userStates.has(state)
            );

            if (matchesNation || matchesZip || matchesState) {
              let companyName = null;
              let logo = null;

              const userAdRef = data.userAdId;
              if (userAdRef) {
                const userAdSnap = await getDoc(userAdRef);
                if (userAdSnap.exists()) {
                  const userAdData = userAdSnap.data() as UserAdData;
                  companyName = userAdData?.companyName || null;
                  logo = userAdData?.logo || null;

                  if (logo && logo.startsWith("//")) {
                    logo = "https:" + logo;
                  }
                }
              }

              return {
                id: campaignId,
                ...data,
                companyName,
                logo,
                userAdId: userAdRef?.id,
              };
            }
            return null;
          })
        );

        // Фильтруем null значения и обновляем состояние
        setCampaigns(allFiltered.filter(Boolean));
        setLoading(false);
      } catch (error) {
        console.error("Error processing campaigns:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userZipStrings, userStates]);

  const handleOrderBags = (campaign: any) => {
    router.push(
      `/available-qwests/order-bags?campaignId=${campaign.id}&userAdId=${campaign.userAdId}`
    );
  };

  const handleNavigation = (route: string) => {
    switch (route) {
      case 'home':
        router.push('/(driver)/home');
        break;
      case 'my-qwests':
        router.push('/(driver)/my-qwests');
        break;
      case 'profile':
        router.push('/(driver)/profile');
        break;
      case 'rewards':
        router.push('/(driver)/profile/rewards');
        break;
      case 'logout':
        // Обработка выхода
        router.replace('/');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BACKGROUND1_DARK_MAIN }}>
        <ActivityIndicator size="large" color={ACCENT1_LIGHT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND1_DARK_MAIN }}>
      <View style={{ padding: 20, flex: 1 }}>
        {campaigns.length > 0 ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: ACCENT1_LIGHT }}>
              Good news! There are available campaigns in your preferred areas.
              Choose one and order bags.
            </Text>

            <FlatList
              data={campaigns}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{ marginBottom: 20 }}>
                  <ContainerInfoMain minHeight={200} padding={40}>
                    <TouchableOpacity
                      onPress={() => handleOrderBags(item)}
                      style={{
                        width: "100%",
                      }}
                    >
                      {item.logo && (
                        <Image
                          source={{ uri: item.logo }}
                          style={{
                            width: 80,
                            height: 80,
                            resizeMode: "contain",
                            marginBottom: 10,
                          }}
                        />
                      )}
                      {item.companyName && (
                        <Text
                          style={{ fontSize: 16, fontWeight: "700", marginBottom: 5, color: ACCENT1_LIGHT }}
                        >
                          {item.companyName}
                        </Text>
                      )}
                      {typeof item.remainingBags === "number" &&
                        typeof item.bagsCount === "number" && (
                          <Text style={{ marginBottom: 5, color: ACCENT1_LIGHT }}>
                            Remaining bags: {item.remainingBags} / {item.bagsCount}
                          </Text>
                        )}
                      <Text style={{ color: ACCENT1_LIGHT }}>
                        Area:{" "}
                        {item.nation
                          ? "Nationwide"
                          : item.states?.length
                          ? item.states.join(", ")
                          : item.zipCodes?.length
                          ? item.zipCodes.join(", ")
                          : "Unknown"}
                      </Text>
                    </TouchableOpacity>
                  </ContainerInfoMain>
                </View>
              )}
            />
          </>
        ) : (
          <View>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10, color: ACCENT1_LIGHT }}>
              There are no campaigns available in your area yet.
            </Text>
            <Text style={{ marginBottom: 5, color: ACCENT1_LIGHT }}>Don't you worry!</Text>
            <Text style={{ marginBottom: 15, color: ACCENT1_LIGHT }}>
              We're coming to your area soon! :)
            </Text>
            <GoldButton
              title="Would you like to choose a different area?"
              onPress={() => router.push("/(driver)/profile/location")}
              width={300}
              height={60}
            />
          </View>
        )}
      </View>
      
      {/* BurgerMenu внизу */}
      <BurgerMenu onNavigate={handleNavigation} />
    </View>
  );
};

export default OrderBagsScreen;
