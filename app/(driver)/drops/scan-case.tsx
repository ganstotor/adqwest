import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { getAuth } from 'firebase/auth';

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
      if (data.startsWith('REASSIGN_')) {
        const campaignId = data.replace('REASSIGN_', '');
        const campaignRef = doc(db, 'driver_campaigns', campaignId);
        await updateDoc(campaignRef, {
          userId: user?.uid || null,
          reassignedAt: new Date(),
        });
        Alert.alert('Success', `Campaign ${campaignId} reassigned to you`);
      } else {
        const campaignRef = doc(db, 'driver_campaigns', data);
        await updateDoc(campaignRef, {
          status: 'Active',
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
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
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
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  scannerBox: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
