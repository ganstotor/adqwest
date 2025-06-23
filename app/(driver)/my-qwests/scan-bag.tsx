import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  GeoPoint,
  DocumentReference,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import * as Location from "expo-location";
import { getAuth } from "firebase/auth";
import GoldButton from "../../../components/ui/GoldButton";
import CustomInput from "../../../components/ui/CustomInput";
import ContainerInfoSimple from "../../../components/ui/ContainerInfoSimple";
import {
  BACKGROUND1_DARK_MAIN,
  ACCENT1_LIGHT,
} from "../../../constants/Colors";

const ScanBagScreen: React.FC = () => {
  const router = useRouter();
  const { driverCampaignId } = useLocalSearchParams<{
    driverCampaignId: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [geoLocationName, setGeoLocationName] = useState("");
  const [showInputs, setShowInputs] = useState(false);
  const [campaignRef, setCampaignRef] = useState<DocumentReference | null>(
    null
  );
  const [driverCampaignRef, setDriverCampaignRef] =
    useState<DocumentReference | null>(null);

  useEffect(() => {
    // Запрашиваем разрешение при монтировании
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    const fetchDriverCampaign = async () => {
      if (!driverCampaignId) return;

      const driverCampaignDocRef = doc(
        db,
        "driver_campaigns",
        driverCampaignId
      );
      setDriverCampaignRef(driverCampaignDocRef);

      const driverCampaignSnap = await getDoc(driverCampaignDocRef);
      const campaignReference = driverCampaignSnap.data()
        ?.campaignId as DocumentReference;
      setCampaignRef(campaignReference);
    };

    fetchDriverCampaign();
  }, [driverCampaignId]);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned || !campaignRef) return;
    setScanned(true);

    const scannedId = data.trim();

    if (campaignRef.id === scannedId) {
      setShowInputs(true);
    } else {
      Alert.alert("Invalid Bag", "This bag does not match your campaign.");
    }
  };

  const handleStartMission = async () => {
    if (
      !recipientName ||
      !geoLocationName ||
      !campaignRef ||
      !driverCampaignRef
    )
      return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location access is required.");
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    const geoPoint = new GeoPoint(coords.latitude, coords.longitude);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("User not authenticated");
      return;
    }

    const userDriverRef = doc(db, "users_driver", currentUser.uid);

    await addDoc(collection(db, "driver_missions"), {
      campaignId: campaignRef,
      driverCampaignId: driverCampaignRef,
      startMission: geoPoint,
      recipientName: recipientName.trim(),
      status: "active",
      startLocationName: geoLocationName.trim(),
      userDriverId: userDriverRef,
    });

    router.push({
      pathname: "/my-qwests/missions",
      params: { driverCampaignId },
    });
  };

  // 🔽 Вариант при неизвестном статусе (еще не проверено)
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Checking camera permission...</Text>
      </View>
    );
  }

  // 🔽 Вариант при отказе в разрешении
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          We need access to your camera to scan the bag.
        </Text>
        <GoldButton
          title="Grant Camera Permission"
          onPress={requestPermission}
          width={300}
          height={50}
        />
      </View>
    );
  }

  // 🔽 Если разрешение получено
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Please scan your bag to start mission</Text>

      {!showInputs && (
        <View style={styles.scannerBox}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        </View>
      )}

      {showInputs && (
        <>
          <CustomInput
            label="Where did you pick up the order from? (required)"
            placeholder="Recipient Name"
            value={recipientName}
            onChangeText={setRecipientName}
            containerStyle={{ marginBottom: 15 }}
          />

          <CustomInput
            label="What is the first name of the individual you picked up for? (required)"
            placeholder="Start Geo"
            value={geoLocationName}
            onChangeText={setGeoLocationName}
            containerStyle={{ marginBottom: 20 }}
          />
        </>
      )}

      {showInputs && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <GoldButton
            title="Start mission"
            onPress={handleStartMission}
            width={350}
            height={70}
            style={{
              opacity: !(recipientName && geoLocationName) ? 0.5 : 1,
              borderRadius: 20,
            }}
          />
        </View>
      )}
    </View>
  );
};

export default ScanBagScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: BACKGROUND1_DARK_MAIN,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: ACCENT1_LIGHT,
  },
  scannerBox: {
    height: 250,
    overflow: "hidden",
    borderRadius: 12,
    marginBottom: 20,
  },
});
