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
import {
  BACKGROUND1_DARK_MAIN,
  ACCENT1_LIGHT,
} from "../../../constants/Colors";
import GoldButton from "../../../components/ui/GoldButton";
import BlueButton from "../../../components/ui/BlueButton";
import GreenButton from "../../../components/ui/GreenButton";
import ContainerInfoSimple from "../../../components/ui/ContainerInfoSimple";
import ContainerInfoMain from "../../../components/ui/ContainerInfoMain";

// Типы данных

type DriverCampaignData = {
  campaignId: DocumentReference;
  bagsCount: number;
  bagsDelivered: number;
  bagsFailed: number;
  currentEarnings: number;
  potentialEarnings: number;
  status: string;
  shippingAddress?: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
  };
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
  const { driverCampaignId } = useLocalSearchParams<{
    driverCampaignId: string;
  }>();
  const router = useRouter();
  const db = getFirestore();

  const [data, setData] = useState<ScreenData | null>(null);
  const [driverCampaignData, setDriverCampaignData] =
    useState<DriverCampaignData | null>(null);
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
      else if (campaignData.states?.length)
        area = campaignData.states.join(", ");
      else if (campaignData.zipCodes?.length)
        area = campaignData.zipCodes.join(", ");

      setData({
        logo: adData.logo?.startsWith("http")
          ? adData.logo
          : `https:${adData.logo}`,
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

  const {
    currentEarnings,
    potentialEarnings,
    bagsDelivered,
    bagsFailed,
    bagsCount,
  } = driverCampaignData;

  const handleNavigateScanBag = () => {
    router.push({
      pathname: "/my-qwests/scan-bag",
      params: { driverCampaignId: data.driverCampaignId },
    });
  };

  const handleNavigateReassign = () => {
    router.push({
      pathname: "/my-qwests/reassign-campaign",
      params: { driverCampaignId: data.driverCampaignId },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ContainerInfoMain minHeight={200} padding={30}>
        <View style={styles.headerContainer}>
          <Image source={{ uri: data.logo }} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{data.companyName}</Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Area:</Text> {data.area}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Bags Count:</Text> {bagsCount}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.label}>Status:</Text> {data.status}
            </Text>
          </View>
        </View>

        <Text style={styles.text}>
          <Text style={styles.label}>Current Earnings:</Text> $
          {currentEarnings.toFixed(2)}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Potential Earnings:</Text> $
          {potentialEarnings.toFixed(2)}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Missions Completed:</Text> {bagsDelivered}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Missions Failed:</Text> {bagsFailed}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Missions Remaining:</Text>{" "}
          {bagsCount - bagsDelivered - bagsFailed}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.text}>
            <Text style={styles.label}>Target Objective:</Text>{" "}
            {targetObjective}
          </Text>
          <TouchableOpacity
            onPress={() => setShowTooltip(true)}
            style={{ marginLeft: 5 }}
          >
            <Text style={{ fontSize: 18, color: ACCENT1_LIGHT }}>❓</Text>
          </TouchableOpacity>
        </View>
        <View>
          {driverCampaignData.shippingAddress && (
            <>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.text}>
                {`${driverCampaignData.shippingAddress.addressLine1} ${driverCampaignData.shippingAddress.addressLine2}, ${driverCampaignData.shippingAddress.city}, ${driverCampaignData.shippingAddress.state} ${driverCampaignData.shippingAddress.zip}`}
              </Text>
            </>
          )}
        </View>
        {showTooltip && (
          <Text style={styles.tooltip}>
            Bags you need to deliver in order to get the highest reward per
            campaign.
          </Text>
        )}
      </ContainerInfoMain>

      <BlueButton
        title="Complete Case"
        onPress={() => setShowCompletePopup(true)}
        width={350}
        height={70}
        style={{ marginTop: 20 }}
      />

      {showCompletePopup && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>
            {bagsDelivered < targetObjective
              ? `If you complete the mission now, the amount of earnings will be halved.\nUncompleted missions will go to the failed status.\n\nYou'll earn $${(
                  potentialEarnings / 2
                ).toFixed(2)}`
              : "If you complete the mission now, uncompleted missions will go to the failed status."}
          </Text>
          <BlueButton
            title="Complete Case"
            onPress={async () => {
              const newStatus = "completed";
              const failed = bagsCount - bagsDelivered;
              const earnings =
                bagsDelivered < targetObjective
                  ? potentialEarnings / 2
                  : potentialEarnings;
              await updateDoc(doc(db, "driver_campaigns", driverCampaignId), {
                status: newStatus,
                bagsFailed: failed,
                potentialEarnings: earnings,
              });
              setData((prev) => prev && { ...prev, status: newStatus });
              await fetchData();
              setShowCompletePopup(false);
            }}
            width={300}
            height={70}
            style={{ marginTop: 15 }}
          />
          <TouchableOpacity
            style={[styles.cancelButton, { marginTop: 10 }]}
            onPress={() => setShowCompletePopup(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <GoldButton
        title="Bag an item"
        onPress={handleNavigateScanBag}
        width={350}
        height={70}
        style={{ marginTop: 20 }}
      />

      <GreenButton
        title="Reassign campaign"
        onPress={handleNavigateReassign}
        width={350}
        height={70}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
};

export default DriverCampaignScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: BACKGROUND1_DARK_MAIN,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: BACKGROUND1_DARK_MAIN,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 15,
    flexShrink: 1,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: ACCENT1_LIGHT,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
    color: ACCENT1_LIGHT,
  },
  label: {
    fontWeight: "600",
    color: ACCENT1_LIGHT,
  },
  popup: {
    backgroundColor: BACKGROUND1_DARK_MAIN,
    padding: 20,
    borderRadius: 10,
    elevation: 10, // для Android
    zIndex: 10, // для iOS
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: ACCENT1_LIGHT,
  },
  popupText: {
    fontSize: 16,
    textAlign: "center",
    color: ACCENT1_LIGHT,
  },
  tooltip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    marginTop: 5,
    borderRadius: 8,
    fontSize: 14,
    color: ACCENT1_LIGHT,
    borderWidth: 1,
    borderColor: ACCENT1_LIGHT,
  },
  cancelButton: {
    backgroundColor: "#666",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
