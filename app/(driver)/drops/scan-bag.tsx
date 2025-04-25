import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, addDoc, collection, GeoPoint, DocumentReference } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';

const ScanBagScreen: React.FC = () => {
  const router = useRouter();
  const { driverCampaignId } = useLocalSearchParams<{ driverCampaignId: string }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [geoLocationName, setGeoLocationName] = useState('');
  const [showInputs, setShowInputs] = useState(false);
  const [campaignRef, setCampaignRef] = useState<DocumentReference | null>(null);
  const [driverCampaignRef, setDriverCampaignRef] = useState<DocumentReference | null>(null);

  useEffect(() => {
    // Запрашиваем разрешение при монтировании
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    const fetchDriverCampaign = async () => {
      if (!driverCampaignId) return;

      const driverCampaignDocRef = doc(db, 'driver_campaigns', driverCampaignId);
      setDriverCampaignRef(driverCampaignDocRef);

      const driverCampaignSnap = await getDoc(driverCampaignDocRef);
      const campaignReference = driverCampaignSnap.data()?.campaignId as DocumentReference;
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
      Alert.alert('Invalid Bag', 'This bag does not match your campaign.');
    }
  };

  const handleStartMission = async () => {
    if (!recipientName || !geoLocationName || !campaignRef || !driverCampaignRef) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is required.');
      return;
    }

    const { coords } = await Location.getCurrentPositionAsync({});
    const geoPoint = new GeoPoint(coords.latitude, coords.longitude);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('User not authenticated');
      return;
    }

    const userDriverRef = doc(db, 'users_driver', currentUser.uid);

    await addDoc(collection(db, 'driver_missions'), {
      campaignId: campaignRef,
      driverCampaignId: driverCampaignRef,
      startMission: geoPoint,
      recipientName: recipientName.trim(),
      status: 'active',
      startLocationName: geoLocationName.trim(),
      userDriverId: userDriverRef,
    });

    router.push({ pathname: '/drops/missions', params: { driverCampaignId } });
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
        <Text style={styles.title}>We need access to your camera to scan the bag.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
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
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        </View>
      )}

      {showInputs && (
        <>
          <Text style={styles.label}>Where did you pick up the order from? (required)</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient Name"
            value={recipientName}
            onChangeText={setRecipientName}
          />

          <Text style={styles.label}>What is the first name of the individual you picked up for? (required)</Text>
          <TextInput
            style={styles.input}
            placeholder="Start Geo"
            value={geoLocationName}
            onChangeText={setGeoLocationName}
          />
        </>
      )}

      {showInputs && (
        <TouchableOpacity
          style={[styles.button, !(recipientName && geoLocationName) && { backgroundColor: 'gray' }]}
          onPress={handleStartMission}
          disabled={!(recipientName && geoLocationName)}
        >
          <Text style={styles.buttonText}>Start mission</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ScanBagScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  scannerBox: {
    height: 250,
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 5,
    borderRadius: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
