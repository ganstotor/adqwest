import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFirestore, doc, getDoc, DocumentReference } from 'firebase/firestore';

type DriverCampaignData = {
  campaignId: DocumentReference;
  bagsCount: number;
  status: string;
};

type CampaignData = {
  userAdId: DocumentReference;
  nation?: boolean;
  states?: string[];
  zipCodes?: string[];
};

type AdData = {
  logo: string;
  companyName: string;
};

type ScreenData = {
  logo: string;
  companyName: string;
  area: string;
  bagsCount: number;
  status: string;
  driverCampaignId: string;
};

const DriverCampaignScreen: React.FC = () => {
  const { driverCampaignId } = useLocalSearchParams<{ driverCampaignId: string }>();
  const router = useRouter();
  const db = getFirestore();

  const [data, setData] = useState<ScreenData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!driverCampaignId) return;

      try {
        const driverCampaignRef = doc(db, 'driver_campaigns', driverCampaignId);
        const driverCampaignSnap = await getDoc(driverCampaignRef);

        if (!driverCampaignSnap.exists()) {
          console.warn('Driver campaign not found');
          return;
        }

        const driverCampaignData = driverCampaignSnap.data() as DriverCampaignData;

        const campaignSnap = await getDoc(driverCampaignData.campaignId);
        if (!campaignSnap.exists()) {
          console.warn('Campaign not found');
          return;
        }

        const campaignData = campaignSnap.data() as CampaignData;

        const adSnap = await getDoc(campaignData.userAdId);
        if (!adSnap.exists()) {
          console.warn('Ad user not found');
          return;
        }

        const adData = adSnap.data() as AdData;

        // Определение area
        let area = '';
        if (campaignData.nation) {
          area = 'Nationwide';
        } else if (campaignData.states && campaignData.states.length > 0) {
          area = campaignData.states.join(', ');
        } else if (campaignData.zipCodes && campaignData.zipCodes.length > 0) {
          area = campaignData.zipCodes.join(', ');
        }

        setData({
          logo: adData.logo,
          companyName: adData.companyName,
          area,
          bagsCount: driverCampaignData.bagsCount,
          status: driverCampaignData.status,
          driverCampaignId,
        });
      } catch (error) {
        console.error('🔥 Error fetching campaign data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [driverCampaignId]);

  if (loading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  const handleNavigateScanBag = () => {
    router.push({
        pathname: '/drops/scan-bag',
        params: { driverCampaignId: data.driverCampaignId },
      });
  };

  const handleNavigateReassign = () => {
    router.push({
        pathname: '/drops/reassign-campaign',
        params: { driverCampaignId: data.driverCampaignId },
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: data.logo }} style={styles.logo} />
      <Text style={styles.title}>{data.companyName}</Text>

      <Text style={styles.text}><Text style={styles.label}>Area:</Text> {data.area}</Text>
      <Text style={styles.text}><Text style={styles.label}>Bags Count:</Text> {data.bagsCount}</Text>
      <Text style={styles.text}><Text style={styles.label}>Status:</Text> {data.status}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleNavigateScanBag()}
      >
        <Text style={styles.buttonText}>Bag an item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { marginTop: 10 }]}
        onPress={() => handleNavigateReassign()}
      >
        <Text style={styles.buttonText}>Reassign campaign</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DriverCampaignScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
  label: {
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
