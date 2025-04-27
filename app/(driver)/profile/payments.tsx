import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface Payment {
  id: string;
  amount: number;
  date: string;
}

export default function PaymentsScreen() {
  const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [earnings, setEarnings] = useState<number>(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUserUID(user.uid);
        await loadUserData(user.uid);
        await loadPayments(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    const ref = doc(db, 'users_driver', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setRoutingNumber(data.routing || '');
      setAccountNumber(data.account || '');
      setEarnings(data.earnings || 0);
    }
  };

  const loadPayments = async (uid: string) => {
    const ref = doc(db, 'users_driver', uid);
    const q = query(collection(db, 'payment'), where('userDriverId', '==', ref));
    const querySnapshot = await getDocs(q);

    const result: Payment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      result.push({
        id: doc.id,
        amount: data.amount || 0,
        date: data.date || '—',
      });
    });

    setPayments(result);
  };

  const validateBankInfo = () => {
    if (routingNumber.length !== 9) {
      Alert.alert('Invalid Routing Number', 'Routing number must be 9 digits.');
      return false;
    }
    if (accountNumber.length < 6 || accountNumber.length > 17) {
      Alert.alert('Invalid Account Number', 'Account number must be between 6 and 17 digits.');
      return false;
    }
    return true;
  };

  const handleSaveBankInfo = async () => {
    if (accountNumber.length < 6) {
      alert('Account Number must be at least 6 digits long');
      return;
    }
    if (!validateBankInfo() || !currentUserUID) return;

    try {
      await setDoc(doc(db, 'users_driver', currentUserUID), {
        routing: routingNumber,
        account: accountNumber,
      }, { merge: true });

      setIsEditing(false);
      Alert.alert('Saved', 'Bank information updated successfully.');
    } catch (error) {
      console.error('Error saving bank info', error);
      Alert.alert('Error', 'Failed to save bank information.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Info</Text>

      <View style={styles.earningsBox}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsValue}>$ {earnings.toFixed(2)}</Text>
      </View>

      {!isEditing ? (
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Bank Info</Text>
          <Text style={styles.text}>Routing Number: {routingNumber}</Text>
          <Text style={styles.text}>Account Number: {accountNumber}</Text>
          <View style={styles.editButtonContainer}>
            <Button title="Edit" onPress={() => setIsEditing(true)} />
          </View>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Routing Number"
            keyboardType="numeric"
            value={routingNumber}
            onChangeText={setRoutingNumber}
            style={styles.input}
            maxLength={9}
          />
          <TextInput
            placeholder="Account Number"
            keyboardType="numeric"
            value={accountNumber}
            onChangeText={setAccountNumber}
            style={styles.input}
            maxLength={17}
          />
          <View style={styles.saveButtonContainer}>
            <Button title="Save" onPress={handleSaveBankInfo} />
          </View>
        </View>
      )}

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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
  },
  earningsBox: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#666',
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00aa00',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  text: {
    marginBottom: 8,
    fontSize: 15,
  },
  editButtonContainer: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  saveButtonContainer: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  paymentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
});
