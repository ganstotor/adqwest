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
    <View style={styles.container}>
      <Text style={styles.title}>Payment Info</Text>

      <View style={styles.earningsBox}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsValue}>$ {earnings.toFixed(2)}</Text>
        <Text style={styles.potentialText}>
          Potential: $ {potentialEarnings.toFixed(2)}
        </Text>
      </View>

      <View style={styles.stripeSection}>
        {stripeConnected ? (
          <View>
            <View style={styles.connectedStatus}>
              <Text style={styles.connectedText}>✓ Connected to Stripe</Text>
            </View>
            {stripeRestricted && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Your Stripe account is connected but not fully verified. You
                  won't be able to receive payouts until verification is
                  complete.
                </Text>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleStripeConnect}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      Complete Verification
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleStripeConnect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.connectButtonText}>
                Connect Stripe Account
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.subTitle}>Payment History</Text>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.paymentItem}>
            <Text style={styles.paymentAmount}>$ {item.amount.toFixed(2)}</Text>
            <Text style={styles.paymentDate}>Date: {item.date}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No payments yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 10,
  },
  earningsBox: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 16,
    color: "#666",
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00aa00",
  },
  paymentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentDate: {
    fontSize: 14,
    color: "#666",
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  potentialText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  stripeSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
  },
  connectedStatus: {
    padding: 10,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    alignItems: "center",
  },
  connectedText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  connectButton: {
    backgroundColor: "#6772e5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  warningBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderColor: "#ffeeba",
    borderWidth: 1,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    marginBottom: 10,
  },
  verifyButton: {
    backgroundColor: "#ff9900",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
