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
import GoldButton from "../../../components/ui/GoldButton";
import BlueButton from "../../../components/ui/BlueButton";
import ContainerInfoMain from "../../../components/ui/ContainerInfoMain";
import { BACKGROUND1_DARK_MAIN, ACCENT1_LIGHT, ACCENT1_DARK, ACCENT2_DARK } from "../../../constants/Colors";
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from "react-native-svg";

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
  const [selectedBags, setSelectedBags] = useState<number>(25);
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
    Page: [25],
    Squire: [25, 50],
    Knight: [25, 50, 100],
    Lord: [25, 50, 100, 200],
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
        status: "requested",
        deliveryType: deliveryOption,
        bagsDelivered: 0,
        potentialEarnings: 0,
        currentEarnings: 0,
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
      router.replace("/");
    } catch (error) {
      console.error("Error adding campaign:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };  

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND1_DARK_MAIN }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        {/* Блок с логотипом и информацией о кампании */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          {logo && (
            <Image
              source={{ uri: logo }}
              style={{ 
                width: 80, 
                height: 80, 
                resizeMode: "cover",
                borderRadius: 40,
                marginRight: 15
              }}
            />
          )}
          <View style={{ flex: 1 }}>
            {companyName && (
              <Text style={{ fontSize: 18, fontWeight: "bold", color: ACCENT1_LIGHT, marginBottom: 5 }}>
                {companyName}
              </Text>
            )}
            {remainingBags !== null && bagsCount !== null && (
              <Text style={{ fontWeight: "bold", color: ACCENT1_LIGHT, marginBottom: 3 }}>
                Remaining bags: {remainingBags} / {bagsCount}
              </Text>
            )}
            {area && <Text style={{ color: ACCENT1_LIGHT, fontSize: 14 }}>{area}</Text>}
          </View>
        </View>

        <Text style={{ marginTop: 20, color: ACCENT1_LIGHT }}>Choose number of bags:</Text>
        
        {/* Стилизованный блок выбора количества сумок - адаптивный */}
        <View style={{ marginVertical: 10 }}>
          <Svg width="100%" height="117" viewBox="0 0 521 117" style={{ width: "100%", height: 117 }}>
            <Path d="M24.5208 1L1 25.3121V93.2315L23.364 116H497.25L520 92.8456V24.9262L496.094 1H24.5208Z" stroke="#F1AF07"/>
            <Path d="M27.9913 7.94629L8.71191 27.2416V90.1443L27.6057 109.054H493.78L512.288 90.1443V27.6275L493.009 7.94629H27.9913Z" stroke="#F1AF07" strokeWidth="2"/>
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
            {rank && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "space-around",
                  paddingHorizontal: 10,
                  width: "100%",
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
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: ACCENT2_DARK,
                        borderRadius: 16,
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {isSelected && (
                          <Svg width="100%" height="100%" viewBox="0 0 50 50" style={{ width: '100%', height: '100%' }} fill="none">
                            <Defs>
                              <RadialGradient
                                id={`paint0_radial_${num}`}
                                cx="0.5"
                                cy="0.5"
                                r="0.5"
                                gradientUnits="objectBoundingBox"
                              >
                                <Stop offset="0" stopColor="#106D68" />
                                <Stop offset="1" stopColor="#00030F" />
                              </RadialGradient>
                            </Defs>
                            <Rect x="0" y="0" width="50" height="50" rx="25" fill={`url(#paint0_radial_${num})`} />
                          </Svg>
                        )}
                        <View style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                        }}>
                          <Text style={{ 
                            color: isAvailable ? ACCENT1_DARK : '#666',
                            fontWeight: "bold",
                            fontSize: 14,
                          }}>
                            {num}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <Text style={{ fontWeight: "bold", marginTop: 15, color: ACCENT1_LIGHT }}>
          You're a Golden Warrior!
        </Text>
        <Text style={{ color: ACCENT1_LIGHT }}>
          Your current limit is {maxBags()} bags. You currently have{" "}
          {uncompletedMissionsCount} undelivered bags
        </Text>

        <Text style={{ marginTop: 20, fontWeight: "bold", color: ACCENT1_LIGHT }}>
          Delivery method: Deliver it to me
        </Text>

        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
        >
          <Text style={{ fontSize: 16, color: ACCENT1_LIGHT }}>Shipping address:</Text>
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
            <Text style={{ color: ACCENT1_LIGHT, marginLeft: 10 }}>Add new</Text>
          </TouchableOpacity>
        </View>

        {addresses.map((address) => (
          <View key={address.id} style={{ marginVertical: 8 }}>
            <ContainerInfoMain minHeight={150} padding={40}>
              <View style={{ width: "100%" }}>
                <Text style={{ fontSize: 16, fontWeight: "500", marginBottom: 4, color: ACCENT1_LIGHT }}>
                  {address.addressLine1}
                </Text>
                {address.addressLine2 ? (
                  <Text style={{ fontSize: 14, color: ACCENT1_LIGHT }}>
                    {address.addressLine2}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 14, color: ACCENT1_LIGHT }}>
                  {address.city}, {address.state} {address.zip}
                </Text>

                {address.isPrimary && (
                  <Text
                    style={{
                      color: ACCENT1_LIGHT,
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
                    <Text style={{ color: ACCENT1_LIGHT, fontWeight: "500" }}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDeleteAddress(address.id)}>
                    <Text style={{ color: ACCENT1_LIGHT, fontWeight: "500" }}>
                      Delete
                    </Text>
                  </TouchableOpacity>

                  {!address.isPrimary && (
                    <TouchableOpacity
                      onPress={() => handleSetPrimaryAddress(address.id)}
                    >
                      <Text style={{ color: ACCENT1_LIGHT, fontWeight: "500" }}>
                        Set as Primary
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ContainerInfoMain>
          </View>
        ))}

        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <GoldButton
            title="Create Case"
            onPress={handleAddCampaign}
            width={300}
            height={60}
            style={{ opacity: (!selectedBags || addresses.length === 0) ? 0.5 : 1 }}
          />
        </View>

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
                backgroundColor: BACKGROUND1_DARK_MAIN,
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
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, color: ACCENT1_LIGHT }}
              >
                {editingAddress ? "Edit Address" : "Add New Address"}
              </Text>

              <TextInput
                placeholder="Address Line 1"
                placeholderTextColor="#666"
                value={addressLine1}
                onChangeText={setAddressLine1}
                style={{
                  borderWidth: 1,
                  borderColor: ACCENT1_LIGHT,
                  padding: 10,
                  borderRadius: 100,
                  marginBottom: 10,
                  color: ACCENT1_LIGHT,
                  backgroundColor: 'transparent',
                }}
              />
              <TextInput
                placeholder="Address Line 2"
                placeholderTextColor="#666"
                value={addressLine2}
                onChangeText={setAddressLine2}
                style={{
                  borderWidth: 1,
                  borderColor: ACCENT1_LIGHT,
                  padding: 10,
                  borderRadius: 100,
                  marginBottom: 10,
                  color: ACCENT1_LIGHT,
                  backgroundColor: 'transparent',
                }}
              />
              <TextInput
                placeholder="City"
                placeholderTextColor="#666"
                value={city}
                onChangeText={setCity}
                style={{
                  borderWidth: 1,
                  borderColor: ACCENT1_LIGHT,
                  padding: 10,
                  borderRadius: 100,
                  marginBottom: 10,
                  color: ACCENT1_LIGHT,
                  backgroundColor: 'transparent',
                }}
              />
              <TextInput
                placeholder="State"
                placeholderTextColor="#666"
                value={state}
                onChangeText={setState}
                style={{
                  borderWidth: 1,
                  borderColor: ACCENT1_LIGHT,
                  padding: 10,
                  borderRadius: 100,
                  marginBottom: 10,
                  color: ACCENT1_LIGHT,
                  backgroundColor: 'transparent',
                }}
              />
              <TextInput
                placeholder="ZIP"
                placeholderTextColor="#666"
                value={zip}
                onChangeText={setZip}
                style={{
                  borderWidth: 1,
                  borderColor: ACCENT1_LIGHT,
                  padding: 10,
                  borderRadius: 100,
                  marginBottom: 20,
                  color: ACCENT1_LIGHT,
                  backgroundColor: 'transparent',
                }}
              />

              <View style={{ alignItems: 'center' }}>
                <GoldButton
                  title={editingAddress ? "Save Changes" : "Add Address"}
                  onPress={handleSaveAddress}
                  width={250}
                  height={50}
                />

                <BlueButton
                  title="Cancel"
                  onPress={() => {
                    setAddressModalVisible(false);
                    setEditingAddress(null);
                  }}
                  width={250}
                  height={50}
                  style={{ marginTop: 12 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
