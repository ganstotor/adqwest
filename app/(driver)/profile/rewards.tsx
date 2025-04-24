import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';

const ranks = [
  {
    name: "Recruit",
    minBags: 0,
    maxBags: 499,
    failedLimit: Infinity,
    bagLimit: 50,
    restrictions: "Cannot order more bags until current operation is completed successfully",
    perks: "Cannot order more bags until current operation is completed successfully.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483287099x211019496407986780/Sergeant.png",
  },
  {
    name: "Sergeant",
    minBags: 500,
    maxBags: 999,
    failedLimit: 20,
    bagLimit: 100,
    perks: "Can order more bags before completing the current operation.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1744632963112x260922741835636360/chevron.png",
  },
  {
    name: "Captain",
    minBags: 1000,
    maxBags: 4999,
    failedLimit: 5,
    bagLimit: 200,
    perks: "Unlocks mission bonuses.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483312916x330002207663850050/Captain.png",
  },
  {
    name: "General",
    minBags: 5000,
    maxBags: Infinity,
    failedLimit: 5,
    bagLimit: 500,
    perks: "Gains access to the distribution program.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745485247401x540054289440982100/general.png",
  }
];

const RewardsScreen: React.FC = () => {
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<number>(0);
  const [failedMissions, setFailedMissions] = useState<number>(0);
  const [rank, setRank] = useState<string>('Recruit');
  const [nextRank, setNextRank] = useState<string>('Sergeant');
  const [rankImage, setRankImage] = useState<string | null>(null);

  const getTargetMissions = () => {
    const next = ranks.find(r => r.name === nextRank);
    return next ? next.minBags : completedMissions;
  };

  const targetMissions = getTargetMissions();

  useEffect(() => {
    const fetchUserRank = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users_driver', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userRank = userSnap.data()?.rank;
        if (userRank) {
          setRank(userRank);
          const current = ranks.find(r => r.name === userRank) || ranks[0];
          const currentIndex = ranks.indexOf(current);
          const next = ranks[currentIndex + 1] || null;
          setNextRank(next?.name || 'Max Rank');
          setRankImage(current.image);
        }
      }
    };

    const fetchMissionStats = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const missionsRef = collection(db, 'driver_missions');
      const userDriverRef = doc(db, `users_driver/${user.uid}`);

      const completedQuery = query(
        missionsRef,
        where('userDriverId', '==', userDriverRef),
        where('status', '==', 'completed')
      );
      const completedSnapshot = await getDocs(completedQuery);
      setCompletedMissions(completedSnapshot.size);

      const failedQuery = query(
        missionsRef,
        where('userDriverId', '==', userDriverRef),
        where('status', '==', 'failed')
      );
      const failedSnapshot = await getDocs(failedQuery);
      setFailedMissions(failedSnapshot.size);
    };

    fetchUserRank();
    fetchMissionStats();
  }, []);

    //for testing
    // useEffect(() => {
    //   const test = async () => {
    //     const completedCount = 300; // Тестовое количество выполненных заданий
    //     const failedCount = 3;      // Тестовое количество провалов
    //     const manualRank = "Recruit"; // Укажи нужный ранг: Recruit, Sergeant, Captain, General
    
    //     setCompletedMissions(completedCount);
    //     setFailedMissions(failedCount);
    
    //     const current = ranks.find(r => r.name === manualRank) || ranks[0];
    //     const currentIndex = ranks.indexOf(current);
    //     const next = ranks[currentIndex + 1] || null;
    
    //     setRank(current.name);
    //     setNextRank(next?.name || "Max Rank");
    //     setRankImage(current.image);
    //   };
    
    //   test();
    // }, []);
    

  const progress = completedMissions / targetMissions;
  const nextRankImage = ranks.find(r => r.name === nextRank)?.image || null;

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
            {ranks.find(r => r.name === rank)?.perks}
          </Text>
        </View>
      )}

      {nextRank !== "Max Rank" ? (
        <>
          <Text style={styles.subTitle}>Your progress to the next rank:</Text>

          <TouchableOpacity
            style={styles.rankRow}
            onPress={() => toggleTooltip(nextRank)}
          >
            <Text style={styles.rank}>{nextRank}</Text>
            {nextRankImage && (
              <Image source={{ uri: nextRankImage }} style={styles.nextRankImage} />
            )}
          </TouchableOpacity>

          {tooltipVisible === nextRank && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {ranks.find(r => r.name === nextRank)?.perks}
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
        </>
      ) : (
        <Text style={styles.subTitle}>You've reached the highest rank!</Text>
      )}

      <Text style={styles.failedText}>Failed missions: {failedMissions}</Text>
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
  title: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },
  rank: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  rankImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    marginBottom: 20,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  nextRankImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginLeft: 8,
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
    justifyContent: 'center',
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
    textAlign: 'center',
  },
});

export default RewardsScreen;
