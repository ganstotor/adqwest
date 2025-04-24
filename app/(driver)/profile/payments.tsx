import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // Путь к вашему файлу конфигурации Firebase

// Типы данных
interface BankInfo {
  routing: string;
  account: string;
}

export default function PaymentsScreen() {
  const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [savedBankInfo, setSavedBankInfo] = useState<null | { routing: string; account: string }>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Получаем текущего пользователя из Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserUID(user.uid);
        loadBankInfo(user.uid); // Загружаем банковскую информацию пользователя
      } else {
        setCurrentUserUID(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadBankInfo = async (uid: string) => {
    try {
      // Получаем документ пользователя из Firestore
      const docRef = doc(db, 'users_driver', uid); // Коллекция 'users_driver', документ с UID пользователя
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSavedBankInfo(data?.bankInfo || null);
      }
    } catch (error) {
      console.error('Error loading bank info', error);
    }
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
    if (!validateBankInfo() || !currentUserUID) return;

    const newBankInfo = {
      routing: routingNumber,
      account: accountNumber,
    };

    try {
      // Сохраняем данные в Firestore в коллекцию 'users_driver', документ с UID текущего пользователя
      await setDoc(doc(db, 'users_driver', currentUserUID), {
        bankInfo: newBankInfo
      }, { merge: true });

      // Обновляем локальный стейт
      setSavedBankInfo(newBankInfo);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving bank info', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setRoutingNumber(savedBankInfo?.routing || '');
    setAccountNumber(savedBankInfo?.account || '');
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>

      {savedBankInfo && !isEditing ? (
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Bank Account Info</Text>
          <Text style={styles.text}>Routing Number: {savedBankInfo.routing}</Text>
          <Text style={styles.text}>Account Number: {savedBankInfo.account}</Text>
          <Button title="Edit" onPress={handleEdit} />
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
          <Button title="Save Bank Info" onPress={handleSaveBankInfo} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
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
    alignItems: 'center',
    marginTop: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
