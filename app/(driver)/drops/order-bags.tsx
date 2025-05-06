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
  onSnapshot,
  deleteDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { TextInput, ScrollView } from "react-native";

type AddressType = {
  id: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  isPrimary: boolean;
};

export default function OrderBags() {
  const { campaignId, userAdId } = useLocalSearchParams();
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [uncompletedMissionsCount, setUncompletedMissionsCount] =
    useState<number>(0);
  const [selectedBags, setSelectedBags] = useState<number | null>(null);
  const [deliveryOption] = useState<"mail">("mail");
  const [remainingBags, setRemainingBags] = useState<number | null>(null);
  const [bagsCount, setBagsCount] = useState<number | null>(null);

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [primaryAddressId, setPrimaryAddressId] = useState<string | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(
    null
  );

  const db = getFirestore();
  const auth = getAuth();
  const router = useRouter();

  const rankLimits: Record<string, number[]> = {
    Recruit: [25],
    Sergeant: [25, 50, 100],
    Captain: [25, 50, 100, 200],
    General: [25, 50, 100, 200, 500],
  };

  const fetchAddresses = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const addressesRef = collection(db, "users_driver", userId, "addresses");
    onSnapshot(addressesRef, (snapshot) => {
      const fetchedAddresses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AddressType[];
      setAddresses(fetchedAddresses);
    });
  };

  const handleSaveAddress = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (editingAddress) {
        // Редактирование
        const ref = doc(
          db,
          "users_driver",
          userId,
          "addresses",
          editingAddress.id
        );
        await updateDoc(ref, { addressLine1, addressLine2, city, state, zip });
      } else {
        // Добавление
        await addDoc(collection(db, "users_driver", userId, "addresses"), {
          addressLine1,
          addressLine2,
          city,
          state,
          zip,
          isPrimary: false,
        });
      }

      Alert.alert(
        "Success",
        editingAddress ? "Address updated" : "Address added"
      );
      setAddressModalVisible(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save address");
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      "Confirm delete",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const userId = auth.currentUser?.uid;
            if (!userId) return;
            try {
              await deleteDoc(doc(db, "users_driver", userId, "addresses", id));
              fetchAddresses();
            } catch (error) {
              console.error("Error deleting address:", error);
            }
          },
        },
      ]
    );
  };

  const handleSetPrimaryAddress = async (addressId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const addressesRef = collection(db, "users_driver", userId, "addresses");
    const snapshot = await getDocs(addressesRef);

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      const isPrimary = docSnap.id === addressId;
      batch.update(docSnap.ref, { isPrimary });
    });

    try {
      await batch.commit();
      fetchAddresses(); // refresh UI
      Alert.alert("Success", "Primary address updated.");
    } catch (error) {
      console.error("Error setting primary address:", error);
      Alert.alert("Error", "Failed to set primary address.");
    }
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

  useEffect(() => {
    fetchAddresses();
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
  
      // Get current remainingBags
      const campaignSnap = await getDoc(campaignRef);
      const campaignData = campaignSnap.data();
      const currentRemaining = campaignData?.remainingBags ?? 0;
  
      if (selectedBags > currentRemaining) {
        Alert.alert(
          "Not enough bags",
          `Only ${currentRemaining} bags are left in the campaign. Please select a smaller amount.`
        );
        return;
      }
  
      // Get primary address
      const primary = addresses.find((a) => a.isPrimary);
      if (!primary) {
        Alert.alert("Missing address", "Please set a primary shipping address.");
        return;
      }
  
      const updatedRemaining = currentRemaining - selectedBags;
  
      await updateDoc(campaignRef, {
        remainingBags: updatedRemaining,
      });
  
      await addDoc(collection(db, "driver_campaigns"), {
        bagsCount: selectedBags,
        campaignId: campaignRef,
        userDriverId: userDriverRef,
        status: "on the way",
        deliveryType: deliveryOption,
        bagsDelivered: 0,
        potentialEarnings: 0,
        shippingAddress: {
          addressLine1: primary.addressLine1,
          addressLine2: primary.addressLine2,
          city: primary.city,
          state: primary.state,
          zip: primary.zip,
        },
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
    <ScrollView contentContainerStyle={{ padding: 20 }}>
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

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>
        Delivery method: Mail it to me
      </Text>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
      >
        <Text style={{ fontSize: 16 }}>Shipping address:</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingAddress(null);
            setAddressLine1("");
            setAddressLine2("");
            setCity("");
            setState("");
            setZip("");
            setAddressModalVisible(true);
          }}
        >
          <Text style={{ color: "blue", marginLeft: 10 }}>Add new</Text>
        </TouchableOpacity>
      </View>

      {addresses.map((address) => (
        <View
          key={address.id}
          style={{
            padding: 15,
            marginVertical: 8,
            borderWidth: 1,
            borderColor: address.isPrimary ? "#4CAF50" : "#BDBDBD",
            borderRadius: 10,
            backgroundColor: address.isPrimary ? "#E8F5E9" : "#F5F5F5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4 }}>
            {address.addressLine1}
          </Text>
          {address.addressLine2 ? (
            <Text style={{ fontSize: 14, color: "#616161" }}>
              {address.addressLine2}
            </Text>
          ) : null}
          <Text style={{ fontSize: 14, color: "#616161" }}>
            {address.city}, {address.state} {address.zip}
          </Text>

          {address.isPrimary && (
            <Text
              style={{
                color: "#388E3C",
                marginTop: 6,
                fontWeight: "bold",
                fontSize: 13,
              }}
            >
              Primary Address
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              gap: 16,
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setEditingAddress(address);
                setAddressLine1(address.addressLine1);
                setAddressLine2(address.addressLine2);
                setCity(address.city);
                setState(address.state);
                setZip(address.zip);
                setAddressModalVisible(true);
              }}
            >
              <Text style={{ color: "#1976D2", fontWeight: "500" }}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDeleteAddress(address.id)}>
              <Text style={{ color: "#D32F2F", fontWeight: "500" }}>
                Delete
              </Text>
            </TouchableOpacity>

            {!address.isPrimary && (
              <TouchableOpacity
                onPress={() => handleSetPrimaryAddress(address.id)}
              >
                <Text style={{ color: "#388E3C", fontWeight: "500" }}>
                  Set as Primary
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={handleAddCampaign}
        disabled={!selectedBags || addresses.length === 0}
        style={{
          marginTop: 30,
          padding: 15,
          backgroundColor:
            selectedBags && addresses.length > 0 ? "#2196F3" : "#ccc",
          borderRadius: 10,
        }}
      >
        <Text
          style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}
        >
          Create Case
        </Text>
      </TouchableOpacity>

      <Modal visible={addressModalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 25,
              borderRadius: 12,
              width: "90%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}
            >
              {editingAddress ? "Edit Address" : "Add New Address"}
            </Text>

            <TextInput
              placeholder="Address Line 1"
              value={addressLine1}
              onChangeText={setAddressLine1}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
            <TextInput
              placeholder="Address Line 2"
              value={addressLine2}
              onChangeText={setAddressLine2}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
            <TextInput
              placeholder="City"
              value={city}
              onChangeText={setCity}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
            <TextInput
              placeholder="State"
              value={state}
              onChangeText={setState}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />
            <TextInput
              placeholder="ZIP"
              value={zip}
              onChangeText={setZip}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 8,
                marginBottom: 20,
              }}
            />

            <TouchableOpacity
              onPress={handleSaveAddress}
              style={{
                backgroundColor: "#388E3C",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {editingAddress ? "Save Changes" : "Add Address"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAddressModalVisible(false);
                setEditingAddress(null);
              }}
              style={{
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#757575" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
