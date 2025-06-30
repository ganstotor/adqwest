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
  collection,
  getDocs,
  query,
  where,
  GeoPoint,
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

type DriverMission = {
  id: string;
  recipientName: string;
  startMission: GeoPoint;
  endMission: GeoPoint;
  status: "active" | "completed";
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
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [missions, setMissions] = useState<DriverMission[]>([]);

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

  useEffect(() => {
    if (!driverCampaignId) return;
    const loadMissions = async () => {
      try {
        const driverCampaignRef = doc(db, "driver_campaigns", driverCampaignId);
        const q = query(
          collection(db, "driver_missions"),
          where("driverCampaignId", "==", driverCampaignRef)
        );
        const snapshot = await getDocs(q);
        const items: DriverMission[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            recipientName: data.recipientName,
            startMission: data.startMission,
            endMission: data.endMission,
            status: data.status,
          };
        });
        // Сортируем миссии: сначала активные, потом завершенные
        const sortedMissions = items.sort((a, b) => {
          if (a.status === "active" && b.status !== "active") return -1;
          if (a.status !== "active" && b.status === "active") return 1;
          return 0;
        });
        setMissions(sortedMissions);
      } catch (error) {
        // Ошибки можно обработать по-другому, если нужно
      }
    };
    loadMissions();
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

  const renderMission = (item: DriverMission) => (
    <ContainerInfoSimple padding={12} style={{ marginBottom: 16 }} key={item.id}>
      {item.startMission ? (
        <Text style={styles.missionText}>
          📍 From: {item.startMission.latitude.toFixed(4)}, {item.startMission.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.missionText}>📍 From: Unknown location</Text>
      )}
      {item.endMission ? (
        <Text style={styles.missionText}>
          🎯 To: {item.endMission.latitude.toFixed(4)}, {item.endMission.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.missionText}>🎯 To: Unknown location</Text>
      )}
      <Text style={styles.missionText}>👤 Recipient: {item.recipientName}</Text>
      {item.status === "active" ? (
        <GoldButton
          title="Complete Drop"
          onPress={() =>
            router.push({
              pathname: "/my-qwests/complete-drop",
              params: { missionId: item.id },
            })
          }
          width={200}
          height={50}
          style={{ marginTop: 8 }}
        />
      ) : (
        <Text style={styles.completedText}>✅ Completed</Text>
      )}
    </ContainerInfoSimple>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ContainerInfoMain minHeight={200} padding={30}>
        <View style={styles.headerContainer}>
          <Image source={{ uri: data.logo }} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{data.companyName}</Text>
            </View>
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
          <TouchableOpacity
            style={styles.menuButtonAbsolute}
            onPress={() => setShowMenuPopup(true)}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
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

      {showMenuPopup && (
        <View style={styles.menuPopup}>
          <View style={styles.menuPopupContent}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setShowMenuPopup(false)}
            >
              <Text style={styles.closeIconText}>×</Text>
            </TouchableOpacity>
            <BlueButton
              title="Complete Case"
              onPress={() => {
                setShowMenuPopup(false);
                setShowCompletePopup(true);
              }}
              width={300}
              height={60}
              style={{ marginBottom: 15 }}
            />

            <GoldButton
              title="Bag an item"
              onPress={() => {
                setShowMenuPopup(false);
                handleNavigateScanBag();
              }}
              width={300}
              height={60}
              style={{ marginBottom: 15 }}
            />

            <GreenButton
              title="Reassign campaign"
              onPress={() => {
                setShowMenuPopup(false);
                handleNavigateReassign();
              }}
              width={300}
              height={60}
              style={{ marginBottom: 15 }}
            />
          </View>
        </View>
      )}

      {showCompletePopup && (
        <View style={styles.popup}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => setShowCompletePopup(false)}
          >
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity>
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
        </View>
      )}

      {/* Миссии под кампанией */}
      <Text style={styles.missionsTitle}>Qwests</Text>
      {missions.length === 0 ? (
        <Text style={styles.missionText}>No Qwests found for this campaign.</Text>
      ) : (
        missions.map(renderMission)
      )}
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
  menuButton: {
    padding: 5,
    marginLeft: 10,
  },
  menuButtonAbsolute: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 10,
    zIndex: 2,
  },
  menuButtonText: {
    fontSize: 20,
    color: ACCENT1_LIGHT,
  },
  menuPopup: {
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
  menuPopupContent: {
    // Add any necessary styles for the menu popup content
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeIcon: {
    alignSelf: "flex-end",
    zIndex: 10,
    padding: 5,
  },
  closeIconText: {
    fontSize: 28,
    color: ACCENT1_LIGHT,
    fontWeight: "bold",
  },
  missionsTitle: {
    color: ACCENT1_LIGHT,
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 32,
    marginBottom: 12,
  },
  missionText: {
    color: ACCENT1_LIGHT,
    fontSize: 16,
    marginBottom: 4,
  },
  completedText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
});
