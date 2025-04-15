import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getFirestore,
  doc,
  updateDoc,
  GeoPoint,
  getDoc,
} from "firebase/firestore";
import { app } from "../../../firebaseConfig";

const db = getFirestore(app);

const CompleteDrop = () => {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, [permission]);

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const takenPhoto = await cameraRef.current.takePictureAsync();
      setPhoto(takenPhoto);
    }
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  const handleSubmit = async () => {
    if (!photo || !photo.uri || !location || !missionId) {
      Alert.alert("Error", "Please take a picture and ensure location is available.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Загрузить фото в Cloudinary
      const formData = new FormData();
      formData.append("file", {
        uri: photo.uri,
        name: "drop_photo.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("upload_preset", "drop_photos");

      const uploadResponse = await axios.post(
        "https://api.cloudinary.com/v1_1/dae8c4cok/image/upload",
        formData,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const photoUrl = uploadResponse.data.secure_url;
      if (!photoUrl) throw new Error("No photo URL returned");

      // 2. Получить ссылку на миссию и её данные
      const missionRef = doc(db, "driver_missions", missionId);
      const missionSnap = await getDoc(missionRef);
      if (!missionSnap.exists()) throw new Error("Mission not found");

      const missionData = missionSnap.data();
      const driverCampaignRef = missionData.driverCampaignId;

      if (!driverCampaignRef?.id) throw new Error("driverCampaignId missing in mission");

      // 3. Обновить Firestore
      await updateDoc(missionRef, {
        status: "completed",
        endMission: new GeoPoint(
          location.coords.latitude,
          location.coords.longitude
        ),
        photo: photoUrl,
      });

      Alert.alert("Success", "Mission completed successfully");

      // 4. Навигация с передачей campaignId
      router.push({
        pathname: "/drops/missions",
        params: { driverCampaignId: driverCampaignRef.id },
      });
    } catch (error: any) {
      console.error("Error completing mission:", error);
      Alert.alert(
        "Error",
        error.message || "There was an issue completing the mission."
      );
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

      {!photo ? (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={cameraRef} />
        </View>
      ) : (
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cameraContainer: {
    width: "100%",
    height: 300,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  photoPreviewContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    minWidth: "30%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
});
