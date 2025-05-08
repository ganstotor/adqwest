import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { doc, updateDoc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";

const QRScanScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
  
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
  
      const campaignId = data.startsWith('REASSIGN_') ? data.replace('REASSIGN_', '') : data;
      const campaignRef = doc(db, 'campaigns', campaignId);
      const userDriverRef = doc(db, 'users_driver', user.uid);
      const driverCampaignRef = doc(db, 'driver_campaigns', campaignId);
  
      const [driverCampaignSnap, userDriverSnap] = await Promise.all([
        getDoc(driverCampaignRef),
        getDoc(userDriverRef),
      ]);
  
      if (!userDriverSnap.exists()) {
        Alert.alert('Error', 'Driver profile not found');
        return;
      }
  
      const userData = userDriverSnap.data();
      if (
        userData.uncompletedMissionsCount > 2 &&
        userData.rank === 'Recruit'
      ) {
        Alert.alert(
          'Finish Current Missions',
          'Please complete the deliveries from your previous Case before activating a new one.'
        );
        setScanned(false);
        return;
      }
  
      if (!driverCampaignSnap.exists()) {
        Alert.alert(
          'Activate Campaign',
          'Are you sure you want to create a Driver Case with status active?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setScanned(false),
            },
            {
              text: 'Activate',
              onPress: async () => {
                await addDoc(collection(db, 'driver_campaigns'), {
                  bagsCount: 25,
                  campaignId: campaignRef,
                  userDriverId: userDriverRef,
                  status: 'active',
                  deliveryType: 'personal',
                  bagsDelivered: 0,
                  potentialEarnings: 0,
                  currentEarnings: 0,
                  shippingAddress: {},
                });
                Alert.alert('Success', 'Driver Case has been created and activated');
              },
            },
          ]
        );
        return;
      }
  
      if (data.startsWith('REASSIGN_')) {
        await updateDoc(driverCampaignRef, {
          userId: user.uid,
          reassignedAt: new Date(),
        });
        Alert.alert('Success', `Campaign ${campaignId} reassigned to you`);
      } else {
        await updateDoc(driverCampaignRef, {
          status: 'active',
          activatedAt: new Date(),
        });
        Alert.alert('Success', `Driver campaign ${data} is now Active`);
      }
  
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process QR code');
    }
  };
  
  if (!permission?.granted) {
    return <Text>Requesting camera permission...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Scan the QR code on the bag to activate or receive a campaign
      </Text>

      <View style={styles.scannerBox}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default QRScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  scannerBox: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
