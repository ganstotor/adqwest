import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';

const RewardsScreen: React.FC = () => {
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<number>(0);
  const [failedMissions, setFailedMissions] = useState<number>(0);
  const [rank, setRank] = useState<string>('Recruit');
  const [nextRank, setNextRank] = useState<string>('Sergeant');
  const [rankImage, setRankImage] = useState<string | null>(null);

  const targetMissions = 500;

  useEffect(() => {
    const fetchMissions = async () => {
      const user = auth.currentUser;

      if (!user) return;

      // Получение завершенных миссий
      const missionsRef = collection(db, "driver_missions");
      const completedQuery = query(
        missionsRef,
        where("userDriverId", "==", doc(db, `users_driver/${user.uid}`)),
        where("status", "==", "completed")
      );
      const completedSnapshot = await getDocs(completedQuery);
      const completedCount = completedSnapshot.size;
      setCompletedMissions(completedCount);

      // Получение неудачных миссий
      const failedQuery = query(
        missionsRef,
        where("userDriverId", "==", doc(db, `users_driver/${user.uid}`)),
        where("status", "==", "failed")
      );
      const failedSnapshot = await getDocs(failedQuery);
      const failedCount = failedSnapshot.size;
      setFailedMissions(failedCount);

      // Определяем ранг и картинку по количеству выполненных миссий
      if (completedCount >= 500) {
        setRank("Sergeant");
        setNextRank("Master");
        setRankImage('https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1744632963112x260922741835636360/chevron.png'); // Картинка для Sergeant
      } else {
        setRank("Recruit");
        setNextRank("Sergeant");
        setRankImage('https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1744632932783x563948893933595460/recruit.png'); // Картинка для Recruit
      }
    };

    fetchMissions();
  }, []);

  const progress = completedMissions / targetMissions;

  const toggleTooltip = (key: string): void => {
    setTooltipVisible(tooltipVisible === key ? null : key);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your current rank is:</Text>

      <View style={styles.rankRow}>
        <Text style={styles.rank}>{rank}</Text>
      </View>

      {rankImage && (
        <Image source={{ uri: rankImage }} style={styles.rankImage} />
      )}

      {tooltipVisible === rank && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {rank === 'Recruit'
              ? 'You are on probation period. Your current supply limit is 50 bags.'
              : 'Requirements: No more than 10 failed missions in the last 100 missions. Bag Limit: Increased to 100 bags.'}
          </Text>
        </View>
      )}

      <Text style={styles.subTitle}>Your progress to the next rank:</Text>

      <View style={styles.rankRow}>
        <Text style={styles.rank}>{nextRank}</Text>
      </View>

      {tooltipVisible === nextRank && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {nextRank === 'Sergeant'
              ? 'Requirements: No more than 10 failed missions in the last 100 missions. Bag Limit: Increased to 100 bags.'
              : 'Master rank requires 1000 completed missions.'}
          </Text>
        </View>
      )}

      <View style={styles.progressInfo}>
        <Text style={styles.completedText}>
          Completed missions: {completedMissions}/{targetMissions}
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
    textAlign: 'center', // Центрируем заголовок
  },
  subTitle: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 10,
    fontWeight: '500',
    textAlign: 'center', // Центрируем подзаголовок
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Центрируем текст
    alignItems: 'center',
    marginBottom: 5,
  },
  rank: {
    fontSize: 22,
    fontWeight: '600',
    marginRight: 5,
    textAlign: 'center', // Центрируем ранг
  },
  rankImage: {
    width: 100,  // Сделаем картинку больше
    height: 100, // Сделаем картинку больше
    marginTop: 10,
    marginBottom: 20,
    resizeMode: 'contain', // Для корректного отображения картинок
    alignSelf: 'center', // Центрируем картинку
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
    justifyContent: 'center', // Центрируем информацию
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
    textAlign: 'center', // Центрируем "Failed missions"
  },
});

export default RewardsScreen;
