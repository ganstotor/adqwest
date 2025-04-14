import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

const ReassignCampaignScreen: React.FC = () => {
  const { driverCampaignId } = useLocalSearchParams<{ driverCampaignId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Let the other user scan the code to receive your unused bags
      </Text>

      {driverCampaignId ? (
        <View style={styles.qrContainer}>
          <QRCode value={`REASSIGN_${driverCampaignId}`} size={250} />
        </View>
      ) : (
        <Text style={styles.error}>Driver campaign ID is missing</Text>
      )}
    </View>
  );
};

export default ReassignCampaignScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});
