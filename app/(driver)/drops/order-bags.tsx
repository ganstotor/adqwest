import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function OrderBags() {
  const { campaignId, userAdId } = useLocalSearchParams();
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [uncompletedMissionsCount, setUncompletedMissionsCount] =
    useState<number>(0);
  const [selectedBags, setSelectedBags] = useState<number | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<
    "pickup" | "mail" | null
  >(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [remainingBags, setRemainingBags] = useState<number | null>(null);
  const [bagsCount, setBagsCount] = useState<number | null>(null);

  const db = getFirestore();
  const auth = getAuth();
  const router = useRouter();

  const rankLimits: Record<string, number[]> = {
    Recruit: [25, 50],
    Sergeant: [25, 50, 100],
    Captain: [25, 50, 100, 200],
    General: [25, 50, 100, 200, 500],
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId || !userAdId || !auth.currentUser) return;
      const userId = auth.currentUser.uid;

      const adSnap = await getDoc(doc(db, "users_ad", String(userAdId)));
      const adData = adSnap.data();
      if (adData?.logo)
        setLogo(
          adData.logo.startsWith("http") ? adData.logo : `https:${adData.logo}`
        );
      if (adData?.companyName) setCompanyName(adData.companyName);

      const campaignSnap = await getDoc(
        doc(db, "campaigns", String(campaignId))
      );
      const campaign = campaignSnap.data();
      if (campaign?.nation) setArea("Nationwide");
      else if (campaign?.states?.length) setArea(campaign.states.join(", "));
      else if (campaign?.zipCodes?.length)
        setArea(campaign.zipCodes.join(", "));

      if (campaign?.remainingBags !== undefined)
        setRemainingBags(campaign.remainingBags);
      if (campaign?.bagsCount !== undefined) setBagsCount(campaign.bagsCount);

      const driverSnap = await getDoc(doc(db, "users_driver", userId));
      const driver = driverSnap.data();
      setRank(driver?.rank || null);
      setUncompletedMissionsCount(driver?.uncompletedMissionsCount || 0);
    };

    fetchData();
  }, []);

  const maxBags = () => {
    if (!rank) return 0;
    const limits = rankLimits[rank] || [];
    return Math.max(...limits) - uncompletedMissionsCount;
  };

  const handleAddCampaign = async () => {
    const userId = auth.currentUser?.uid;
    if (!selectedBags || !userId || !campaignId || !deliveryOption) return;

    try {
      const campaignRef = doc(db, "campaigns", String(campaignId));
      const userDriverRef = doc(db, "users_driver", userId);

      // Получаем текущие remainingBags
      const campaignSnap = await getDoc(campaignRef);
      const campaignData = campaignSnap.data();
      const currentRemaining = campaignData?.remainingBags ?? 0;

      // Проверяем, достаточно ли сумок осталось
      if (selectedBags > currentRemaining) {
        Alert.alert(
          "Not enough bags",
          `Only ${currentRemaining} bags are left in the campaign. Please select a smaller amount.`
        );
        return;
      }      

      const updatedRemaining = currentRemaining - selectedBags;

      // Обновляем remainingBags
      await updateDoc(campaignRef, {
        remainingBags: updatedRemaining,
      });

      // Создаём новую запись в driver_campaigns
      await addDoc(collection(db, "driver_campaigns"), {
        bagsCount: selectedBags,
        campaignId: campaignRef,
        userDriverId: userDriverRef,
        status: "on the way",
        deliveryType: deliveryOption,
        bagsDelivered: 0,
      });

      await updateDoc(userDriverRef, {
        uncompletedMissionsCount: uncompletedMissionsCount + selectedBags,
      });

      Alert.alert("Success", "Campaign updated successfully!");
      router.replace("/drops");
    } catch (error) {
      console.error("Error adding campaign:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {logo && (
        <Image
          source={{ uri: logo }}
          style={{ width: 100, height: 100, resizeMode: "contain" }}
        />
      )}
      {companyName && (
        <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}>
          {companyName}
        </Text>
      )}
      {remainingBags !== null && bagsCount !== null && (
        <Text style={{ marginTop: 5, fontWeight: "bold" }}>
          Remaining bags: {remainingBags} / {bagsCount}
        </Text>
      )}

      {area && <Text style={{ marginTop: 5 }}>{area}</Text>}

      <Text style={{ marginTop: 20 }}>Choose number of bags:</Text>
      {rank && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginVertical: 10,
          }}
        >
          {[25, 50, 100, 200, 500].map((num) => {
            const rankValues = rankLimits[rank] || [];
            const maxAllowed = Math.max(...rankValues);
            const remainingByRank = maxAllowed - uncompletedMissionsCount;
            const isWithinRank =
              rankValues.includes(num) && num <= remainingByRank;
            const isWithinCampaign =
              remainingBags !== null && num <= remainingBags;
            const isAvailable = isWithinRank && isWithinCampaign;
            const isSelected = selectedBags === num;

            const handlePress = () => {
              if (!isAvailable) {
                let reason = "";
                if (!isWithinRank) {
                  reason = `Your current limit is ${remainingByRank} bags`;
                } else if (!isWithinCampaign) {
                  reason = `Only ${remainingBags} bags are left in the campaign`;
                }
                Alert.alert("Unavailable", reason);
              } else {
                setSelectedBags(num);
              }
            };            

            return (
              <TouchableOpacity
                key={num}
                onPress={handlePress}
                style={{
                  padding: 12,
                  margin: 5,
                  backgroundColor: !isAvailable
                    ? "#ccc"
                    : isSelected
                    ? "#388E3C"
                    : "#A5D6A7",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>{num}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={{ fontWeight: "bold", marginTop: 15 }}>
        You’re a Golden Warrior!
      </Text>
      <Text>
        Your current limit is {maxBags()} bags. You currently have{" "}
        {uncompletedMissionsCount} undelivered bags
      </Text>

      <TouchableOpacity onPress={() => setPopupVisible(true)}>
        <Text style={{ color: "#007AFF", marginVertical: 10 }}>
          View delivery info
        </Text>
      </TouchableOpacity>

      <Modal transparent visible={popupVisible} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              width: "80%",
            }}
          >
            <TouchableOpacity
              onPress={() => setPopupVisible(false)}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={{ fontSize: 18 }}>✖</Text>
            </TouchableOpacity>
            <Text>Delivery instructions go here...</Text>
          </View>
        </View>
      </Modal>

      <Text style={{ marginTop: 20 }}>Delivery method:</Text>
      {[
        { label: "Local pickup", value: "pickup" },
        { label: "Mail it to me", value: "mail" },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => setDeliveryOption(option.value as any)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 5,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#000",
              marginRight: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {deliveryOption === option.value && (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#FF9800",
                }}
              />
            )}
          </View>
          <Text>{option.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={handleAddCampaign}
        disabled={!selectedBags || !deliveryOption}
        style={{
          marginTop: 30,
          padding: 15,
          backgroundColor: selectedBags && deliveryOption ? "#2196F3" : "#ccc",
          borderRadius: 10,
        }}
      >
        <Text
          style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}
        >
          Confirm Campaign
        </Text>
      </TouchableOpacity>
    </View>
  );
}
