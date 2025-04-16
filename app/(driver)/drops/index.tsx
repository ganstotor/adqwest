import React, { useEffect, useState } from "react";
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
  logo: string;
  companyName: string;
  states: string[];
  status: string;
  bagsCount: number;
};

type CampaignDoc = {
  userAdId: DocumentReference;
  states: string[];
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

  useEffect(() => {
    const fetchDriverCampaigns = async () => {
      const user = auth.currentUser;

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
              logo: adData.logo?.startsWith("http") ? adData.logo : `https:${adData.logo}`,
              companyName: adData.companyName,
              states: campaignData.states,
              status: data.status,
              bagsCount: data.bagsCount,
            };
          })
        );

        // фильтруем null если что-то пошло не так
        const filteredCampaigns = campaignList.filter(
          Boolean
        ) as DriverCampaign[];

        setDriverCampaigns(filteredCampaigns);
      } catch (error) {
        console.error("🔥 Error fetching driver campaigns:", error);
      }
    };

    fetchDriverCampaigns();
  }, []);

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
      pathname: '/drops/driver-campaign',
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

      <Text style={styles.sectionTitle}>Your Campaigns:</Text>

      {driverCampaigns.map((campaign) => (
        <View key={campaign.id} style={styles.card}>
          <Image source={{ uri: campaign.logo }} style={styles.logo} />
          <View style={styles.details}>
            <Text style={styles.text}>
              <Text style={styles.label}>Company:</Text> {campaign.companyName}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>States:</Text>{" "}
              {campaign.states.join(", ")}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Status:</Text> {campaign.status}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Bags Count:</Text> {campaign.bagsCount}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleViewMissions(campaign.id)}
            style={styles.missionButton}
          >
            <Text style={styles.missionText}>📦 View Missions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDriverCampaignDetails(campaign)}
            style={[styles.missionButton, { backgroundColor: "#FFA500" }]}
          >
            <Text style={styles.missionText}>📋 View Campaign</Text>
          </TouchableOpacity>
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
    width: "100%",
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
  logo: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
  details: {
    width: "100%",
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
  },
  missionButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  missionText: {
    color: "#fff",
  },
});
