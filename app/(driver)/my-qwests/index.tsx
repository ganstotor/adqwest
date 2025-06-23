import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import BurgerMenu from "../../../components/ui/BurgerMenu";
import BlueButton from "../../../components/ui/BlueButton";
import GoldButton from "../../../components/ui/GoldButton";
import GreenButton from "../../../components/ui/GreenButton";
import ContainerInfoMain from "../../../components/ui/ContainerInfoMain";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  DocumentReference,
} from "firebase/firestore";
import { BACKGROUND1_DARK_MAIN, ACCENT1_LIGHT } from "../../../constants/Colors";

type DriverCampaign = {
  id: string;
  campaignId: string;
  logo: string;
  companyName: string;
  states: string[];
  status: string;
  bagsCount: number;
  bagsDelivered: number;
  startDate: string;
  endDate: string;
};

type CampaignDoc = {
  userAdId: DocumentReference;
  states: string[];
  startDate?: any; // Firestore Timestamp
  endDate?: any;
};

type AdDoc = {
  logo: string;
  companyName: string;
};

const MainPage: React.FC = () => {
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  const [driverCampaigns, setDriverCampaigns] = useState<DriverCampaign[]>([]);

  //Группировка:
  const groupedCampaigns = driverCampaigns.reduce(
    (acc, item) => {
      if (!acc[item.campaignId]) {
        acc[item.campaignId] = {
          logo: item.logo,
          companyName: item.companyName,
          states: item.states,
          startDate: item.startDate,
          endDate: item.endDate,
          campaigns: [],
        };
      }
      acc[item.campaignId].campaigns.push(item);
      return acc;
    },
    {} as Record<
      string,
      {
        logo: string;
        companyName: string;
        states: string[];
        startDate: string;
        endDate: string;
        campaigns: DriverCampaign[];
      }
    >
  );

  useFocusEffect(
    useCallback(() => {
      const fetchDriverCampaigns = async () => {
        const user = auth.currentUser;
        const statusOrder = {
          active: 0,
          "on the way": 1,
          completed: 2,
        };

        if (!user) {
          return;
        }

        try {
          const userDriverRef = doc(db, "users_driver", user.uid);

          const q = query(
            collection(db, "driver_campaigns"),
            where("userDriverId", "==", userDriverRef)
          );
          const snapshot = await getDocs(q);

          const campaignList: (DriverCampaign | null)[] = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();

              const campaignRef = data.campaignId as DocumentReference;

              const campaignSnap = await getDoc(campaignRef);
              if (!campaignSnap.exists()) {
                return null;
              }

              const campaignData = campaignSnap.data() as CampaignDoc;

              const adRef = campaignData.userAdId;
              const adSnap = await getDoc(adRef);

              if (!adSnap.exists()) {
                return null;
              }

              const adData = adSnap.data() as AdDoc;

              return {
                id: docSnap.id,
                campaignId: campaignRef.id,
                logo: adData.logo?.startsWith("http")
                  ? adData.logo
                  : `https:${adData.logo}`,
                companyName: adData.companyName,
                states: campaignData.states,
                status: data.status,
                bagsCount: data.bagsCount,
                bagsDelivered: data.bagsDelivered ?? 0,
                startDate:
                  campaignData.startDate?.toDate?.().toLocaleDateString() || "",
                endDate:
                  campaignData.endDate?.toDate?.().toLocaleDateString() || "",
              };
            })
          );

          const filteredCampaigns = campaignList.filter(
            Boolean
          ) as DriverCampaign[];

          const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
            return (
              (statusOrder[a.status as keyof typeof statusOrder] ?? 99) -
              (statusOrder[b.status as keyof typeof statusOrder] ?? 99)
            );
          });

          setDriverCampaigns(sortedCampaigns);
        } catch (error) {
          console.error("🔥 Error fetching driver campaigns:", error);
        }
      };

      fetchDriverCampaigns();
    }, [])
  );

  const handleScanCase = () => {
    router.push("/my-qwests/scan-case");
  };

  const handleViewMissions = (campaignId: string) => {
    router.push({
      pathname: "/my-qwests/missions",
      params: { driverCampaignId: campaignId },
    });
  };

  const handleDriverCampaignDetails = (campaign: DriverCampaign) => {
    router.push({
      pathname: "/my-qwests/driver-campaign",
      params: {
        driverCampaignId: campaign.id,
      },
    });
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

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND1_DARK_MAIN }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Already have a case? Click "Scan Case"</Text>
        <View style={styles.topButtons}>
          <BlueButton
            title="Scan Case"
            onPress={handleScanCase}
            width={200}
            height={60}
          />
        </View>

        {driverCampaigns.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Don't have a case yet? Click "Order Bags"</Text>
            <GoldButton
              title="Order Bags"
              onPress={() => router.push("/(driver)/available-qwests")}
              width={200}
              height={60}
            />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Campaigns:</Text>
            {Object.entries(groupedCampaigns).map(([campaignId, group]) => (
              <View key={campaignId} style={styles.campaignWrapper}>
                <ContainerInfoMain minHeight={200} padding={40}>
                  <View style={styles.campaignContainer}>
                    <View style={styles.campaignHeader}>
                      <Image source={{ uri: group.logo }} style={styles.logo} />
                      <View style={styles.campaignInfo}>
                        <Text style={styles.text}>
                          <Text style={styles.label}>Company:</Text> {group.companyName}
                        </Text>
                        <Text style={styles.text}>
                          <Text style={styles.label}>Area:</Text>{" "}
                          {group.states.join(", ")}
                        </Text>
                        <Text style={styles.text}>
                          <Text style={styles.label}>Start:</Text> {group.startDate}
                        </Text>
                        <Text style={styles.text}>
                          <Text style={styles.label}>End:</Text> {group.endDate}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.caseText}>Cases</Text>
                    {/* ❗️ Теперь ниже — driver_campaigns */}
                    {group.campaigns.map((campaign, idx) => (
                      <View key={campaign.id}>
                        <View style={styles.driverCampaignRow}>
                          <View style={styles.driverInfo}>
                            <Text style={styles.text}>
                              <Text style={styles.label}>Status:</Text> {campaign.status}
                            </Text>
                            <Text style={styles.text}>
                              <Text style={styles.label}>Bags delivered:</Text>{" "}
                              {campaign.bagsDelivered}/{campaign.bagsCount}
                            </Text>
                          </View>
                          <View style={styles.driverButtons}>
                            {campaign.status !== "on the way" && (
                              <GreenButton
                                title="📦 View Missions"
                                onPress={() => handleViewMissions(campaign.id)}
                                width={150}
                                height={50}
                              />
                            )}
                            <GoldButton
                              title="📋 View Campaign"
                              onPress={() => handleDriverCampaignDetails(campaign)}
                              width={150}
                              height={50}
                            />
                          </View>
                        </View>
                        {idx !== group.campaigns.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </View>
                    ))}
                  </View>
                </ContainerInfoMain>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      
      {/* BurgerMenu внизу */}
      <BurgerMenu onNavigate={handleNavigation} />
    </View>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: BACKGROUND1_DARK_MAIN,
    alignItems: "center",
  },
  campaignWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  campaignContainer: {
    width: "100%",
  },
  topButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 20,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    color: ACCENT1_LIGHT,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
    color: ACCENT1_LIGHT,
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flexDirection: "column",
    alignItems: "center",
  },
  details: {
    width: "100%",
  },
  campaignCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  campaignHeader: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  campaignInfo: {
    marginLeft: 15,
    flex: 1,
  },
  driverCampaignRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    width: "100%",
  },
  driverInfo: {
    flex: 1,
  },
  driverButtons: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  caseText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
    color: ACCENT1_LIGHT,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 3,
    color: ACCENT1_LIGHT,
  },
  label: {
    fontWeight: "bold",
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: ACCENT1_LIGHT,
  },
});
