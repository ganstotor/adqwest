import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Modal, ScrollView } from 'react-native';
import * as Progress from 'react-native-progress';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Typography from '../../../components/ui/Typography';
import GoldButton from '../../../components/ui/GoldButton';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Colors, ACCENT1_LIGHT, ACCENT2_LIGHT, BACKGROUND1_LIGHT, WHITE } from '../../../constants/Colors';
import { ranks } from '../../../constants/ranks';

const RewardsScreen: React.FC = () => {
  const [completedMissions, setCompletedMissions] = useState<number>(0);
  const [failedMissions, setFailedMissions] = useState<number>(0);
  const [rank, setRank] = useState<string>('Recruit');
  const [nextRank, setNextRank] = useState<string>('Sergeant');
  const [rankImage, setRankImage] = useState<any>(null);
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
            <Typography variant="h5" style={styles.tooltipTitle}>{info.name} Details</Typography>
            {info.perks && <Typography variant="body2" style={styles.tooltipText}>🟢 Perks: {info.perks}</Typography>}
            {info.requirements && <Typography variant="body2" style={styles.tooltipText}>📌 Requirements: {info.requirements}</Typography>}
            {info.restrictions && <Typography variant="body2" style={styles.tooltipText}>🚫 Restrictions: {info.restrictions}</Typography>}
            {info.bagLimit && <Typography variant="body2" style={styles.tooltipText}>📦 Bag Limit: {info.bagLimit}</Typography>}
            <TouchableOpacity onPress={closeTooltip} style={styles.closeButton}>
              <Typography variant="label2" style={styles.closeButtonText}>Close</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#02010C" />
            <Stop offset="100%" stopColor="#08061A" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" />
      </Svg>
      <ScrollView contentContainerStyle={styles.container}>
        <Typography variant="h4" style={{ textAlign: 'center', marginBottom: 10 }}>
          Your current rank is:
        </Typography>
        <View style={styles.rankRow}>
          <Typography variant="h5" style={styles.rank}>{rank}</Typography>
          <TouchableOpacity onPress={() => openTooltip(rank)}>
            <Ionicons name="help-circle-outline" size={20} color="#FDEA35" />
          </TouchableOpacity>
        </View>
        {rankImage && (
          <Image source={rankImage} style={styles.rankImage} />
        )}
        {renderTooltip(rank)}
        {nextRank !== "Max Rank" ? (
          <>
            <Typography variant="h6" style={{ textAlign: 'center', marginTop: 30, marginBottom: 10 }}>
              Your progress to the next rank:
            </Typography>
            <View style={styles.rankRow}>
              <Typography variant="h5" style={styles.rank}>{nextRank}</Typography>
              {nextRankImage && (
                <Image source={nextRankImage} style={styles.nextRankImage} />
              )}
              <TouchableOpacity onPress={() => openTooltip(nextRank)}>
                <Ionicons name="help-circle-outline" size={20} color="#FDEA35" />
              </TouchableOpacity>
            </View>
            {renderTooltip(nextRank)}
            <View style={styles.progressInfo}>
              <Typography variant="body2">
                Completed missions: {completedMissions}/{targetMissions}
              </Typography>
            </View>
            <Progress.Bar
              progress={progress}
              width={null}
              color={ACCENT1_LIGHT}
              unfilledColor="transparent"
              borderWidth={1}
              borderColor={ACCENT1_LIGHT}
              borderRadius={10}
              height={20}
            />
          </>
        ) : (
          <Typography variant="h6" style={{ textAlign: 'center', marginTop: 30, marginBottom: 10 }}>
            You've reached the highest rank!
          </Typography>
        )}
        <Typography variant="body2" style={styles.failedText}>
          Failed missions: {failedMissions}
        </Typography>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rank: {
    color: ACCENT2_LIGHT,
    marginRight: 10,
  },
  rankImage: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: 20,
  },
  nextRankImage: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
  },
  progressInfo: {
    marginVertical: 10,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  failedText: {
    color: ACCENT1_LIGHT,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: BACKGROUND1_LIGHT,
    padding: 20,
    borderRadius: 10,
    width: '80%',
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  tooltipTitle: {
    color: ACCENT2_LIGHT,
    marginBottom: 15,
    textAlign: 'center',
  },
  tooltipText: {
    color: WHITE,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: ACCENT2_LIGHT,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: BACKGROUND1_LIGHT,
  },
});

export default RewardsScreen;
