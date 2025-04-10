import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  DocumentReference,
  GeoPoint,
} from 'firebase/firestore';
import { app } from '../../../firebaseConfig';

const db = getFirestore(app);

// Типы
type DriverMission = {
  id: string;
  recipientName: string;
  startMission: GeoPoint;
  endMission: GeoPoint;
  status: 'active' | 'completed';
};

type Campaign = {
  userAdId: DocumentReference;
  states: string[];
};

type UserAd = {
  logo: string;
  companyName: string;
};

const MissionPage = () => {
  const { driverCampaignId } = useLocalSearchParams<{ driverCampaignId: string }>();
  const [missions, setMissions] = useState<DriverMission[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [logo, setLogo] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!driverCampaignId) return;

    const loadData = async () => {
      try {
        const driverCampaignRef = doc(db, 'driver_campaigns', driverCampaignId);
        const driverCampaignSnap = await getDoc(driverCampaignRef);
        if (!driverCampaignSnap.exists()) return;

        const { campaignId } = driverCampaignSnap.data() as { campaignId: DocumentReference };

        const campaignSnap = await getDoc(campaignId);
        if (!campaignSnap.exists()) return;

        const { userAdId, states } = campaignSnap.data() as Campaign;

        const adSnap = await getDoc(userAdId);
        if (!adSnap.exists()) return;

        const { logo, companyName } = adSnap.data() as UserAd;

        setCampaignName(companyName || 'Campaign');
        setLogo(logo || '');

        // Загружаем миссии
        const q = query(
          collection(db, 'driver_missions'),
          where('driverCampaignId', '==', driverCampaignRef)
        );
        const snapshot = await getDocs(q);

        const items: DriverMission[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            recipientName: data.recipientName,
            startMission: data.startMission,
            endMission: data.endMission,
            status: data.status,
          };
        });

        // Сортируем миссии: сначала активные, потом завершенные
        const sortedMissions = items.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return 0; // Если оба статуса одинаковые, не меняем порядок
        });

        setMissions(sortedMissions);
      } catch (error) {
        console.error('Failed to load missions:', error);
      }
    };

    loadData();
  }, [driverCampaignId]);

  const renderMission = ({ item }: { item: DriverMission }) => (
    <View style={styles.missionCard}>
      <Text style={styles.missionText}>
        📍 From: {item.startMission.latitude.toFixed(4)}, {item.startMission.longitude.toFixed(4)}
      </Text>
      <Text style={styles.missionText}>
        🎯 To: {item.endMission.latitude.toFixed(4)}, {item.endMission.longitude.toFixed(4)}
      </Text>
      <Text style={styles.missionText}>👤 Recipient: {item.recipientName}</Text>
      {item.status === 'active' ? (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() =>
            router.push({ pathname: '/drops/complete-drop', params: { missionId: item.id } })
          }
        >
          <Text style={styles.buttonText}>Complete Drop</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.completedText}>✅ Completed</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {logo ? <Image source={{ uri: logo }} style={styles.logo} /> : null}
        <Text style={styles.title}>{campaignName}</Text>
      </View>

      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        renderItem={renderMission}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default MissionPage;

// Стили
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 100,
  },
  missionCard: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  missionText: {
    fontSize: 14,
    marginBottom: 6,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  completedText: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 8,
  },
});
