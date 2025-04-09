import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import * as Location from 'expo-location';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { getFirestore, doc, updateDoc, GeoPoint } from 'firebase/firestore';
import { app } from '../../../firebaseConfig';

const db = getFirestore(app);

type CompleteDropProps = {
  missionId: string;
};

const CompleteDrop: React.FC<CompleteDropProps> = ({ missionId }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const cameraRef = useRef<CameraView | null>(null); 

  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, [permission]);

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhoto(photo);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  const handleSubmit = async () => {
    if (!photo || !location) {
      Alert.alert('Error', 'Please take a picture and ensure location is available');
      return;
    }

    setIsSubmitting(true);
    try {
      const photoBlob = await fetch(photo.uri)
        .then((res) => res.blob())
        .catch((error) => {
          console.error('Error converting photo to Blob:', error);
          throw new Error('Failed to convert photo to Blob');
        });

      const formData = new FormData();
      formData.append('file', photoBlob);
      formData.append('upload_preset', 'your_cloudinary_preset');

      const uploadResponse = await axios.post('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', formData);
      const photoUrl = uploadResponse.data.secure_url;

      const missionRef = doc(db, 'driver_missions', missionId);
      await updateDoc(missionRef, {
        status: 'completed',
        endMission: new GeoPoint(location.coords.latitude, location.coords.longitude),
        photo: photoUrl,
      });

      Alert.alert('Success', 'Mission completed successfully');
      router.push('/drops');
    } catch (error) {
      console.error('Error completing mission:', error);
      Alert.alert('Error', 'There was an issue completing the mission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a picture of the bag at the drop-off location</Text>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef} 
        />
      </View>

      {photo && (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          <Text>Looks good?</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!photo ? (
          <TouchableOpacity onPress={handleTakePhoto} style={styles.button}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={handleRetake} style={styles.button}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.button}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {isSubmitting && <Text>Submitting...</Text>}
    </View>
  );
};

export default CompleteDrop;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 10,
  },
  camera: {
    flex: 1,
    borderRadius: 10,
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '25%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});
