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
    router.push("/drops/scan-case");
  };

  const handleOrderBags = () => {
    router.push("/drops/available-campaigns");
  };

  const handleViewMissions = (campaignId: string) => {
    router.push({
      pathname: "/drops/missions",
      params: { driverCampaignId: campaignId },
    });
  };

  const handleDriverCampaignDetails = (campaign: DriverCampaign) => {
    router.push({
      pathname: "/drops/driver-campaign",
      params: {
        driverCampaignId: campaign.id,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Already have a case? Click “Scan Case”</Text>
      <Text style={styles.title}>
        Don’t have a case yet? Click “Order Bags”
      </Text>
      <View style={styles.topButtons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#90EE90" }]}
          onPress={handleScanCase}
        >
          <Text style={styles.buttonText}>Scan Case</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FFA500" }]}
          onPress={handleOrderBags}
        >
          <Text style={styles.buttonText}>Order Bags</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Your Campaigns:</Text>

      {Object.entries(groupedCampaigns).map(([campaignId, group]) => (
        <View key={campaignId} style={styles.card}>
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
                  <TouchableOpacity
                    onPress={() => handleViewMissions(campaign.id)}
                    style={[
                      styles.missionButton,
                      { backgroundColor: "#007AFF" },
                    ]}
                  >
                    <Text style={styles.missionText}>📦 View Missions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDriverCampaignDetails(campaign)}
                    style={[
                      styles.missionButton,
                      { backgroundColor: "#FFA500" },
                    ]}
                  >
                    <Text style={styles.missionText}>📋 View Campaign</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {idx !== group.campaigns.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 20,
  },
  button: {
    marginTop: 15,
    padding: 15,
    borderRadius: 8,

    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 3,
  },
  label: {
    fontWeight: "bold",
  },
  missionButton: {
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
  },
  missionText: {
    color: "#fff",
  },
});
