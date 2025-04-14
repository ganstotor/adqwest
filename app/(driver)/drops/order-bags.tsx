// app/drops/order-bags.tsx

import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function OrderBags() {
  const { campaignId, userAdId } = useLocalSearchParams();
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [selectedBags, setSelectedBags] = useState<number | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<
    "pickup" | "mail" | null
  >(null);
  const db = getFirestore();
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    
    if (!campaignId || !userAdId) {
      console.error("Missing campaignId or userAdId");
      return;
    }

    const fetchData = async () => {
      if (!campaignId || !userAdId) return;

      // Fetching user ad data
      const userAdSnap = await getDoc(doc(db, "users_ad", String(userAdId)));
      const userAd = userAdSnap.data();
      setLogo(userAd?.logo || null);
      setCompanyName(userAd?.companyName || null);

      // Fetching campaign data
      const campaignSnap = await getDoc(
        doc(db, "campaigns", String(campaignId))
      );
      const campaign = campaignSnap.data();

      // Determine area
      if (campaign?.nation) {
        setArea("Nationwide");
      } else if (campaign?.states?.length) {
        setArea(campaign.states.join(", "));
      } else if (campaign?.zipCodes?.length) {
        setArea(campaign.zipCodes.join(", "));
      }
    };

    fetchData();
  }, [campaignId, userAdId]);

  const handleAddCampaign = async () => {
    const userId = auth.currentUser?.uid;
    if (!selectedBags || !userId || !campaignId) return;

    try {
      await addDoc(collection(db, "driver_campaigns"), {
        bagsCount: selectedBags,
        campaignId: doc(db, "campaigns", String(campaignId)),
        userDriverId: doc(db, "users_driver", userId),
        status: "on the way",
        deliveryType: deliveryOption,
      });
      Alert.alert("Success", "Campaign added successfully!");
      router.replace("/drops");
    } catch (err) {
      console.error("Error adding campaign:", err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Campaign */}
      {logo && (
        <Image
          source={{ uri: logo }}
          style={{ width: 80, height: 80, resizeMode: "contain" }}
        />
      )}
      {companyName && (
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>{companyName}</Text>
      )}
      {area && <Text style={{ marginVertical: 5 }}>{area}</Text>}

      {/* Choose bags */}
      <Text style={{ marginTop: 20 }}>Choose the amount of bags to deliver:</Text>
      <View style={{ flexDirection: "row", marginVertical: 10, gap: 10 }}>
        {[25, 50].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => {
              setSelectedBags(num);
            }}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: selectedBags === num ? "#4CAF50" : "#A5D6A7",
              alignItems: "center",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {num} bags
            </Text>
          </TouchableOpacity>
        ))}

        {/* Disabled button for 100 bags */}
        <View
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: "#ccc",
            alignItems: "center",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#666" }}>100 bags</Text>
        </View>
      </View>

      {/* Info block */}
      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        You’re a Golden Warrior!
      </Text>
      <Text>
        Your current limit is 200 bags. You currently have 148 undelivered bags.
      </Text>

      {/* Popup trigger */}
      <TouchableOpacity onPress={() => setPopupVisible(true)}>
        <Text style={{ color: "#007AFF", marginVertical: 10 }}>
          Show delivery info
        </Text>
      </TouchableOpacity>

      {/* Popup Modal */}
      <Modal visible={popupVisible} transparent animationType="slide">
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
              width: "80%",
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setPopupVisible(false)}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={{ fontSize: 18 }}>✖</Text>
            </TouchableOpacity>
            <Text>Some delivery info goes here...</Text>
          </View>
        </View>
      </Modal>

      {/* Delivery option */}
      <Text style={{ marginTop: 20 }}>Choose your delivery option:</Text>
      {[
        { value: "pickup", label: "Local pick-up" },
        { value: "mail", label: "Mail it to me" },
      ].map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            setDeliveryOption(opt.value as any);
          }}
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
            {deliveryOption === opt.value && (
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
          <Text>{opt.label}</Text>
        </TouchableOpacity>
      ))}

      {/* Add campaign button */}
      <TouchableOpacity
        onPress={handleAddCampaign}
        disabled={!selectedBags || !deliveryOption}
        style={{
          marginTop: 20,
          backgroundColor: "#FF9800",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
          opacity: selectedBags && deliveryOption ? 1 : 0.5,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Add campaign</Text>
      </TouchableOpacity>
    </View>
  );
}
