import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  DocumentReference,
} from "firebase/firestore";

// Типы данных

type DriverCampaignData = {
  campaignId: DocumentReference;
  bagsCount: number;
  bagsDelivered: number;
  bagsFailed: number;
  potentialEarnings: number;
  status: string;
};

type CampaignData = {
  userAdId: DocumentReference;
  nation?: boolean;
  states?: string[];
  zipCodes?: string[];
};

type AdData = {
  logo: string;
  companyName: string;
};

type ScreenData = {
  logo: string;
  companyName: string;
  area: string;
  bagsCount: number;
  status: string;
  driverCampaignId: string;
};

const calculateTargetObjective = (bagsCount: number): number => {
  if (bagsCount === 25) return 23;
  if (bagsCount === 50) return 46;
  if (bagsCount === 100) return 92;
  if (bagsCount === 200) return 184;
  if (bagsCount === 500) return 470;
  return Math.floor(bagsCount * 0.92);
};



const DriverCampaignScreen: React.FC = () => {
  const { driverCampaignId } = useLocalSearchParams<{ driverCampaignId: string }>();
  const router = useRouter();
  const db = getFirestore();

  const [data, setData] = useState<ScreenData | null>(null);
  const [driverCampaignData, setDriverCampaignData] = useState<DriverCampaignData | null>(null);
  const [targetObjective, setTargetObjective] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchData = async () => {
    if (!driverCampaignId) return;
    try {
      setLoading(true);
      const driverCampaignRef = doc(db, "driver_campaigns", driverCampaignId);
      const driverCampaignSnap = await getDoc(driverCampaignRef);
      if (!driverCampaignSnap.exists()) return;
  
      const driverCampaign = driverCampaignSnap.data() as DriverCampaignData;
      setDriverCampaignData(driverCampaign);
      setTargetObjective(calculateTargetObjective(driverCampaign.bagsCount));
  
      const campaignSnap = await getDoc(driverCampaign.campaignId);
      if (!campaignSnap.exists()) return;
  
      const campaignData = campaignSnap.data() as CampaignData;
      const adSnap = await getDoc(campaignData.userAdId);
      if (!adSnap.exists()) return;
  
      const adData = adSnap.data() as AdData;
  
      let area = "";
      if (campaignData.nation) area = "Nationwide";
      else if (campaignData.states?.length) area = campaignData.states.join(", ");
      else if (campaignData.zipCodes?.length) area = campaignData.zipCodes.join(", ");
  
      setData({
        logo: adData.logo?.startsWith("http") ? adData.logo : `https:${adData.logo}`,
        companyName: adData.companyName,
        area,
        bagsCount: driverCampaign.bagsCount,
        status: driverCampaign.status,
        driverCampaignId,
      });
    } catch (e) {
      console.error("🔥 Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [driverCampaignId]);

  if (loading || !data || !driverCampaignData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  const { potentialEarnings, bagsDelivered, bagsFailed, bagsCount } = driverCampaignData;

  const handleNavigateScanBag = () => {
    router.push({ pathname: "/drops/scan-bag", params: { driverCampaignId: data.driverCampaignId } });
  };

  const handleNavigateReassign = () => {
    router.push({ pathname: "/drops/reassign-campaign", params: { driverCampaignId: data.driverCampaignId } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={{ uri: data.logo }} style={styles.logo} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{data.companyName}</Text>
          <Text style={styles.text}><Text style={styles.label}>Area:</Text> {data.area}</Text>
          <Text style={styles.text}><Text style={styles.label}>Bags Count:</Text> {bagsCount}</Text>
          <Text style={styles.text}><Text style={styles.label}>Status:</Text> {data.status}</Text>
        </View>
      </View>
  
      <Text style={styles.text}><Text style={styles.label}>Potential Earnings:</Text> ${potentialEarnings.toFixed(2)}</Text>
      <Text style={styles.text}><Text style={styles.label}>Missions Completed:</Text> {bagsDelivered}</Text>
      <Text style={styles.text}><Text style={styles.label}>Missions Failed:</Text> {bagsFailed}</Text>
      <Text style={styles.text}><Text style={styles.label}>Missions Remaining:</Text> {bagsCount - bagsDelivered - bagsFailed}</Text>
  
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.text}><Text style={styles.label}>Target Objective:</Text> {targetObjective}</Text>
        <TouchableOpacity onPress={() => setShowTooltip(true)} style={{ marginLeft: 5 }}>
          <Text style={{ fontSize: 18 }}>❓</Text>
        </TouchableOpacity>
      </View>
      {showTooltip && (
        <Text style={styles.tooltip}>
          Bags you need to deliver in order to get the highest reward per campaign.
        </Text>
      )}
  
      <TouchableOpacity
        style={[styles.button, { marginTop: 10, backgroundColor: "#d9534f" }]}
        onPress={() => setShowCompletePopup(true)}
      >
        <Text style={styles.buttonText}>Complete Case</Text>
      </TouchableOpacity>
  
      {showCompletePopup && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>
            {bagsDelivered < targetObjective
              ? `If you complete the mission now, the amount of earnings will be halved.\nUncompleted missions will go to the failed status.\n\nYou’ll earn $${(potentialEarnings / 2).toFixed(2)}`
              : "If you complete the mission now, uncompleted missions will go to the failed status."}
          </Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: 15 }]}
            onPress={async () => {
              const newStatus = "completed";
              const failed = bagsCount - bagsDelivered;
              const earnings = bagsDelivered < targetObjective ? potentialEarnings / 2 : potentialEarnings;
              await updateDoc(doc(db, "driver_campaigns", driverCampaignId), {
                status: newStatus,
                bagsFailed: failed,
                potentialEarnings: earnings,
              });
              setData((prev) => prev && { ...prev, status: newStatus });
              await fetchData();
              setShowCompletePopup(false);
            }}
          >
            <Text style={styles.buttonText}>Complete Case</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: "#aaa" }]}
            onPress={() => setShowCompletePopup(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
  
      <TouchableOpacity style={styles.button} onPress={handleNavigateScanBag}>
        <Text style={styles.buttonText}>Bag an item</Text>
      </TouchableOpacity>
  
      <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={handleNavigateReassign}>
        <Text style={styles.buttonText}>Reassign campaign</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DriverCampaignScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 15,
    flexShrink: 1,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
  label: {
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#FFA500",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  popup: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 10,           // для Android
    zIndex: 10,              // для iOS
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },  
  popupText: {
    fontSize: 16,
    textAlign: "center",
  },
  tooltip: {
    backgroundColor: "#eee",
    padding: 10,
    marginTop: 5,
    borderRadius: 8,
    fontSize: 14,
  },
});
