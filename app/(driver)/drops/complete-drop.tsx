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
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { app } from "../../../firebaseConfig";
import stateAbbrMap from "../../../utils/stateAbbreviations";

const db = getFirestore(app);

const CompleteDrop = () => {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
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
      Alert.alert(
        "Error",
        "Please take a picture and ensure location is available."
      );
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

      // 2. Получить данные миссии
      const missionRef = doc(db, "driver_missions", missionId);
      const missionSnap = await getDoc(missionRef);
      if (!missionSnap.exists()) throw new Error("Mission not found");
      const missionData = missionSnap.data();
      const driverCampaignRef = missionData.driverCampaignId;
      const userDriverRef = missionData.userDriverId;
      const campaignRef = missionData.campaignId;
      const campaignSnap = await getDoc(campaignRef);
      if (!campaignSnap.exists()) throw new Error("Campaign not found");

      const campaign = campaignSnap.data() as {
        nation?: boolean;
        states?: string[];
        zipCodes?: string[];
      };

      // Получаем геокод по координатам
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const geo = reverseGeocode[0];
      const currentState = geo?.region?.trim(); // Пример: 'New York'
      const currentAbbr = currentState
        ? stateAbbrMap[currentState].toUpperCase()
        : null;

      const currentZip = geo?.postalCode; // Пример: '90210'

      // Проверка условий
      if (!campaign.nation) {
        if (campaign.states && campaign.states.length > 0) {
          if (!currentAbbr || !campaign.states.includes(currentAbbr)) {
            Alert.alert(
              "Error",
              `You are not in the allowed state area (${campaign.states.join(
                ", "
              )})`
            );
            setIsSubmitting(false);
            return;
          }
        } else if (campaign.zipCodes && campaign.zipCodes.length > 0) {
          if (!currentZip || !campaign.zipCodes.includes(currentZip)) {
            Alert.alert(
              "Error",
              `You are not in the allowed ZIP area (${campaign.zipCodes.join(
                ", "
              )})`
            );
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (!driverCampaignRef?.id || !userDriverRef?.id)
        throw new Error("Missing references in mission");

      // 3. Обновить статус миссии
      await updateDoc(missionRef, {
        status: "completed",
        endMission: new GeoPoint(
          location.coords.latitude,
          location.coords.longitude
        ),
        photo: photoUrl,
      });

      // 🔁 Увеличить bagsDelivered на 1 в driver_campaigns
      const driverCampaignSnap = await getDoc(driverCampaignRef);
      if (driverCampaignSnap.exists()) {
        const campaignData = driverCampaignSnap.data() as {
          bagsDelivered?: number;
        };
        const currentDelivered = campaignData.bagsDelivered ?? 0;

        await updateDoc(driverCampaignRef, {
          bagsDelivered: currentDelivered + 1,
        });
      }

      // 4. Получить и обновить статистику водителя
      const userDriverSnap = await getDoc(userDriverRef);
      if (!userDriverSnap.exists()) throw new Error("Driver not found");

      const userDriverData = userDriverSnap.data() as {
        completedMissionsCount: number;
        uncompletedMissionsCount: number;
        potentialEarnings: number;
        rank: string;
      };

      const {
        completedMissionsCount = 0,
        uncompletedMissionsCount = 0,
        potentialEarnings = 0,
        rank = "Recruit",
      } = userDriverData;

      const newCompleted = completedMissionsCount + 1;
      const newUncompleted = Math.max(uncompletedMissionsCount - 1, 0);
      const newEarnings = potentialEarnings + 1;

      let newRank = rank;

      const checkRankUpgrade = async () => {
        const rankConditions = {
          Recruit: { next: "Sergeant", required: 500, maxFailed: 9 },
          Sergeant: { next: "Captain", required: 1000, maxFailed: 4 },
          Captain: { next: "General", required: 5000, maxFailed: 4 },
        } as const;

        const condition = rankConditions[rank as keyof typeof rankConditions];
        if (!condition) return;

        if (newCompleted > condition.required) {
          const missionsQuerySnap = await getDocs(
            query(
              collection(db, "driver_missions"),
              where("userDriverId", "==", userDriverRef),
              orderBy("timestamp", "desc"),
              limit(100)
            )
          );

          const last100 = missionsQuerySnap.docs.map((doc) => doc.data());
          const failedCount = last100.filter(
            (m) => m.status === "failed"
          ).length;

          if (failedCount <= condition.maxFailed) {
            newRank = condition.next;
          }
        }
      };

      await checkRankUpgrade();

      await updateDoc(userDriverRef, {
        completedMissionsCount: newCompleted,
        uncompletedMissionsCount: newUncompleted,
        potentialEarnings: newEarnings,
        rank: newRank,
      });

      Alert.alert("Success", "Mission completed successfully");

      // 5. Навигация
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
      <Text style={styles.title}>
        Take a picture of the bag at the drop-off location
      </Text>

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
