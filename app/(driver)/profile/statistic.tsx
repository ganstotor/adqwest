import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatisticsScreen: React.FC = () => {
  const campaignCompleted: number = 0;
  const missionsCompleted: number = 5;

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>Campaign Completed:</Text>
        <Text style={styles.value}>{campaignCompleted}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Missions Completed:</Text>
        <Text style={styles.value}>{missionsCompleted}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StatisticsScreen;
