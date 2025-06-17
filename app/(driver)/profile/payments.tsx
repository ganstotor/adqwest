import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import Typography from '../../../components/ui/Typography';
import GoldButton from '../../../components/ui/GoldButton';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ACCENT1_LIGHT, ACCENT2_LIGHT, BACKGROUND1_LIGHT, WHITE } from '../../../constants/Colors';

interface Payment {
  id: string;
  amount: number;
  date: string;
}

export default function PaymentsScreen() {
  const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<number>(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [potentialEarnings, setPotentialEarnings] = useState<number>(0);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stripeRestricted, setStripeRestricted] = useState<boolean>(false);

  const loadPotentialEarningsFromCampaigns = async (uid: string) => {
    const userRef = doc(db, "users_driver", uid);
    const q = query(
      collection(db, "driver_campaigns"),
      where("userDriverId", "==", userRef)
    );

    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.potentialEarnings === "number") {
        total += data.potentialEarnings;
      }
    });

    setPotentialEarnings(total);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (currentUserUID) {
        loadUserData(currentUserUID); // это обновит stripeConnected
      }
    }, [currentUserUID])
  );

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserUID(user.uid);
        await loadUserData(user.uid);
        await loadPayments(user.uid);
        await loadPotentialEarningsFromCampaigns(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    const ref = doc(db, "users_driver", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setEarnings(data.currentEarnings || 0);
      const stripeId = data.stripeId;
      const isConnected = !!stripeId;
      setStripeConnected(isConnected);

      if (isConnected) {
        try {
          const response = await fetch(
            "https://us-central1-deployed-c1878.cloudfunctions.net/stripeOAuth/check-account-status",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stripeId }),
            }
          );
          if (!response.ok) {
            const text = await response.text();
            console.error("Ошибка от сервера:", response.status, text);
            throw new Error(`Server returned status ${response.status}`);
          }
          const result = await response.json();
          const isRestricted = !result.payouts_enabled;
          setStripeRestricted(isRestricted);
          console.log("Stripe restricted:", isRestricted);
        } catch (err) {
          console.warn("Unable to verify Stripe account:", err);
        }
      }
    }
  };

  const loadPayments = async (uid: string) => {
    const ref = doc(db, "users_driver", uid);
    const q = query(
      collection(db, "payment"),
      where("userDriverId", "==", ref)
    );
    const querySnapshot = await getDocs(q);

    const result: Payment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      result.push({
        id: doc.id,
        amount: data.amount || 0,
        date: data.date || "—",
      });
    });

    setPayments(result);
  };

  const handleStripeConnect = async () => {
    if (!currentUserUID) return;

    setLoading(true);
    try {
      const response = await fetch("https://us-central1-deployed-c1878.cloudfunctions.net/stripeOAuth/create-oauth-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: currentUserUID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        await Linking.openURL(data.url);
      } else {
        console.error("No URL in response:", data);
        Alert.alert("Error", "Failed to get Stripe URL");
      }
    } catch (error) {
      console.error("Stripe connection error:", error);
      Alert.alert(
        "Error",
        "Unable to connect to Stripe. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#02010C" />
            <Stop offset="100%" stopColor="#08061A" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" />
      </Svg>

      <View style={styles.container}>
        <Typography variant="h4" style={styles.title}>Payment Info</Typography>

        <View style={styles.earningsBox}>
          <Typography variant="body2" style={styles.earningsLabel}>Total Earnings</Typography>
          <Typography variant="h2" style={styles.earningsValue}>$ {earnings.toFixed(2)}</Typography>
          <Typography variant="caption" style={styles.potentialText}>
            Potential: $ {potentialEarnings.toFixed(2)}
          </Typography>
        </View>

        <View style={styles.stripeSection}>
          {stripeConnected ? (
            <View>
              <View style={styles.connectedStatus}>
                <Typography variant="body2" style={styles.connectedText}>✓ Connected to Stripe</Typography>
              </View>
              {stripeRestricted && (
                <View style={styles.warningBox}>
                  <Typography variant="body2" style={styles.warningText}>
                    Your Stripe account is connected but not fully verified. You
                    won't be able to receive payouts until verification is
                    complete.
                  </Typography>
                  <GoldButton
                    title={loading ? "Loading..." : "Complete Verification"}
                    onPress={handleStripeConnect}
                    style={styles.verifyButton}
                  />
                </View>
              )}
            </View>
          ) : (
            <GoldButton
              title={loading ? "Loading..." : "Connect Stripe Account"}
              onPress={handleStripeConnect}
              style={styles.connectButton}
            />
          )}
        </View>

        <Typography variant="h5" style={styles.subTitle}>Payment History</Typography>
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.paymentItem}>
              <Typography variant="h6" style={styles.paymentAmount}>$ {item.amount.toFixed(2)}</Typography>
              <Typography variant="body2" style={styles.paymentDate}>Date: {item.date}</Typography>
            </View>
          )}
          ListEmptyComponent={
            <Typography variant="body2" style={styles.empty}>No payments yet.</Typography>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    color: WHITE,
    marginBottom: 15,
  },
  subTitle: {
    color: WHITE,
    marginTop: 30,
    marginBottom: 10,
  },
  earningsBox: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: BACKGROUND1_LIGHT,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  earningsLabel: {
    color: WHITE,
  },
  earningsValue: {
    color: ACCENT1_LIGHT,
  },
  paymentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT2_LIGHT,
    backgroundColor: BACKGROUND1_LIGHT,
    borderRadius: 10,
    marginBottom: 10,
  },
  paymentAmount: {
    color: ACCENT1_LIGHT,
  },
  paymentDate: {
    color: WHITE,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: WHITE,
  },
  potentialText: {
    color: WHITE,
    marginTop: 4,
  },
  stripeSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: BACKGROUND1_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  connectedStatus: {
    padding: 10,
    backgroundColor: ACCENT2_LIGHT,
    borderRadius: 8,
    alignItems: "center",
  },
  connectedText: {
    color: BACKGROUND1_LIGHT,
  },
  warningBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: BACKGROUND1_LIGHT,
    borderRadius: 8,
    borderColor: ACCENT1_LIGHT,
    borderWidth: 1,
  },
  warningText: {
    color: WHITE,
    marginBottom: 10,
  },
  verifyButton: {
    marginTop: 10,
  },
  connectButton: {
    marginTop: 10,
  },
});
