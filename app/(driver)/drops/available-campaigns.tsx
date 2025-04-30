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
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";

const OrderBagsScreen = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    interface UserAdData {
      companyName: string | null;
      logo: string | null;
    }

    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Получаем zipCodes пользователя
        const userSnap = await getDoc(doc(db, "users_driver", userId));
        const zipCodeObjects: { key: string; state: string }[] =
          userSnap.data()?.zipCodes || [];

        const userStates = new Set<string>();
        const userZipStrings = new Set<string>();

        for (const zip of zipCodeObjects) {
          if (zip.state) userStates.add(zip.state);
          if (zip.key) userZipStrings.add(zip.key);
        }

        // Получаем кампании и фильтруем
        const campaignsSnap = await getDocs(collection(db, "campaigns"));
        const filtered: any[] = [];

        for (const campaignDoc of campaignsSnap.docs) {
          const data = campaignDoc.data();

          const matchesNation = data.nation === true;
          const matchesZip = data.zipCodes?.some((zip: string) =>
            userZipStrings.has(zip)
          );
          const matchesState = data.states?.some((state: string) =>
            userStates.has(state)
          );

          if (matchesNation || matchesZip || matchesState) {
            const campaignId = campaignDoc.id;
            let companyName = null;
            let logo = null;

            const userAdRef = data.userAdId;
            if (userAdRef) {
              // Получаем документ по ссылке
              const userAdSnap = await getDoc(userAdRef); // Используем ссылку, а не только ID
              if (userAdSnap.exists()) {
                const userAdData = userAdSnap.data() as UserAdData; // Явное указание типа данных
                companyName = userAdData?.companyName || null;
                logo = userAdData?.logo || null;

                // Проверка и корректировка пути к логотипу
                if (logo && logo.startsWith("//")) {
                  logo = "https:" + logo; // Добавление https:// если это необходимо
                }
              }
            }

            filtered.push({
              id: campaignId,
              ...data,
              companyName,
              logo,
              userAdId: userAdRef?.id,
            });
          }
        }

        setCampaigns(filtered);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleOrderBags = (campaign: any) => {
    router.push(
      `/drops/order-bags?campaignId=${campaign.id}&userAdId=${campaign.userAdId}`
    );
  };

  return (
    <View style={{ padding: 20 }}>
      {campaigns.length > 0 ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Good news! There are available campaigns in your preferred areas.
            Choose one and order bags.
          </Text>

          <FlatList
            data={campaigns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleOrderBags(item)}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderRadius: 8,
                  marginBottom: 10,
                  backgroundColor: "#f9f9f9",
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
                    style={{ fontSize: 16, fontWeight: "700", marginBottom: 5 }}
                  >
                    {item.companyName}
                  </Text>
                )}
                {typeof item.remainingBags === "number" &&
                  typeof item.bagsCount === "number" && (
                    <Text style={{ marginBottom: 5 }}>
                      Remaining bags: {item.remainingBags} / {item.bagsCount}
                    </Text>
                  )}
                <Text>
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
            )}
          />
        </>
      ) : (
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            There are no campaigns available in your area yet.
          </Text>
          <Text style={{ marginBottom: 5 }}>Don’t you worry!</Text>
          <Text style={{ marginBottom: 15 }}>
            We’re coming to your area soon! :)
          </Text>
          <Link href="/location" asChild>
            <TouchableOpacity
              style={{
                padding: 10,
                backgroundColor: "#007aff",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "white", textAlign: "center" }}>
                Would you like to choose a different area?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </View>
  );
};

export default OrderBagsScreen;
