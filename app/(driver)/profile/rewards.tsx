import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';

const RewardsScreen: React.FC = () => {
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  const completedMissions: number = 25;
  const failedMissions: number = 3;
  const nextLevelTarget: number = 500;

  const progress: number = completedMissions / nextLevelTarget;

  const toggleTooltip = (key: string): void => {
    setTooltipVisible(tooltipVisible === key ? null : key);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your current rank is:</Text>

      <View style={styles.rankRow}>
        <Text style={styles.rank}>Recruit</Text>
        <TouchableOpacity onPress={() => toggleTooltip('recruit')}>
          <Ionicons name="help-circle-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {tooltipVisible === 'recruit' && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            You are on probation period.{"\n"}
            Your current supply limit is 50 bags.{"\n"}
            You may not order a new supply shipment until you have completed your current operation.
          </Text>
        </View>
      )}

      <Text style={styles.subTitle}>Your progress to the next rank:</Text>

      <View style={styles.rankRow}>
        <Text style={styles.rank}>Sergeant</Text>
        <TouchableOpacity onPress={() => toggleTooltip('sergeant')}>
          <Ionicons name="help-circle-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {tooltipVisible === 'sergeant' && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            Requirements: No more than 10 failed missions in the last 100 missions.{"\n"}
            Bag Limit: Increased to 100 bags.{"\n"}
            Perks: Can order more bags before completing the current operation.
          </Text>
        </View>
      )}

      <View style={styles.progressInfo}>
        <Text style={styles.completedText}>
          Completed missions: {completedMissions}
        </Text>
      </View>

      <Progress.Bar
        progress={progress}
        width={null}
        color="#4CAF50"
        unfilledColor="#ddd"
        borderRadius={10}
        height={20}
      />

      <Text style={styles.failedText}>Failed missions: {failedMissions}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 10,
    fontWeight: '500',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rank: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 5,
  },
  tooltip: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 5,
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 20,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  failedText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    color: '#d32f2f',
  },
});

export default RewardsScreen;
