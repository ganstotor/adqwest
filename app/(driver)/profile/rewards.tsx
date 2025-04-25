import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import * as Progress from 'react-native-progress';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const ranks = [
  {
    name: "Recruit",
    minBags: 0,
    maxBags: 499,
    failedLimit: Infinity,
    bagLimit: 50,
    restrictions: "Cannot order more bags until current operation is completed successfully.",
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
    requirements: "No more than 10 failed missions in the last 100 missions.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1744632963112x260922741835636360/chevron.png",
  },
  {
    name: "Captain",
    minBags: 1000,
    maxBags: 4999,
    failedLimit: 5,
    bagLimit: 200,
    perks: "Unlocks mission bonuses.",
    requirements: "No more than 5 failed missions in the last 100 missions.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745483312916x330002207663850050/Captain.png",
  },
  {
    name: "General",
    minBags: 5000,
    maxBags: Infinity,
    failedLimit: 5,
    bagLimit: 500,
    perks: "Gains access to the distribution program.",
    requirements: "No more than 5 failed missions in the last 100 missions.",
    image: "https://49f19303af27fa52649830f7470cda8c.cdn.bubble.io/f1745485247401x540054289440982100/general.png",
  }
];

const RewardsScreen: React.FC = () => {
  const [completedMissions, setCompletedMissions] = useState<number>(0);
  const [failedMissions, setFailedMissions] = useState<number>(0);
  const [rank, setRank] = useState<string>('Recruit');
  const [nextRank, setNextRank] = useState<string>('Sergeant');
  const [rankImage, setRankImage] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<null | string>(null);

  const targetMissions = ranks.find(r => r.name === nextRank)?.minBags || 1;

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users_driver', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const userRank = data.rank || 'Recruit';
        setCompletedMissions(data.completedMissionsCount || 0);
        setFailedMissions(data.failedMissionsCount || 0);

        setRank(userRank);
        const current = ranks.find(r => r.name === userRank) || ranks[0];
        const currentIndex = ranks.indexOf(current);
        const next = ranks[currentIndex + 1] || null;
        setNextRank(next?.name || 'Max Rank');
        setRankImage(current.image);
      }
    };

    fetchData();
  }, []);

  const progress = completedMissions / targetMissions;
  const nextRankImage = ranks.find(r => r.name === nextRank)?.image || null;

  const openTooltip = (name: string) => setTooltipVisible(name);
  const closeTooltip = () => setTooltipVisible(null);

  const renderTooltip = (rankName: string) => {
    const info = ranks.find(r => r.name === rankName);
    if (!info) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={tooltipVisible === rankName}
        onRequestClose={closeTooltip}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.tooltipTitle}>{info.name} Details</Text>
            {info.perks && <Text style={styles.tooltipText}>🟢 Perks: {info.perks}</Text>}
            {info.requirements && <Text style={styles.tooltipText}>📌 Requirements: {info.requirements}</Text>}
            {info.restrictions && <Text style={styles.tooltipText}>🚫 Restrictions: {info.restrictions}</Text>}
            {info.bagLimit && <Text style={styles.tooltipText}>📦 Bag Limit: {info.bagLimit}</Text>}
            <TouchableOpacity onPress={closeTooltip} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your current rank is:</Text>

      <View style={styles.rankRow}>
        <Text style={styles.rank}>{rank}</Text>
        <TouchableOpacity onPress={() => openTooltip(rank)}>
          <Ionicons name="help-circle-outline" size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {rankImage && (
        <Image source={{ uri: rankImage }} style={styles.rankImage} />
      )}

      {renderTooltip(rank)}

      {nextRank !== "Max Rank" ? (
        <>
          <Text style={styles.subTitle}>Your progress to the next rank:</Text>

          <View style={styles.rankRow}>
            <Text style={styles.rank}>{nextRank}</Text>
            {nextRankImage && (
              <Image source={{ uri: nextRankImage }} style={styles.nextRankImage} />
            )}
            <TouchableOpacity onPress={() => openTooltip(nextRank)}>
              <Ionicons name="help-circle-outline" size={20} color="gray" />
            </TouchableOpacity>
          </View>

          {renderTooltip(nextRank)}

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '85%',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tooltipText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default RewardsScreen;
