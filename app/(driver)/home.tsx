import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AvatarFrame from '../../components/ui/AvatarFrame';
import BlueButton from '../../components/ui/BlueButton';
import BurgerMenu from '../../components/ui/BurgerMenu';
import { ContainerInfoMainAdjustable } from '../../components/ui/ContainerInfoMain';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import * as Progress from 'react-native-progress';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { ranks } from '../../constants/ranks';

const LOGO_SRC = require('../../assets/images/logo.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Home = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [rank, setRank] = useState('Page');
  const [completedMissions, setCompletedMissions] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300); // Состояние для высоты контейнера

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(db, 'users_driver', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || '');
        setRank(data.rank || 'Page');
        setCompletedMissions(data.completedMissionsCount || 0);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Найти текущий и следующий ранг по массиву ranks
  const currentRankObj = ranks.find(r => r.name === rank) || ranks[0];
  const currentRankIndex = ranks.findIndex(r => r.name === rank);
  const nextRankObj = ranks[currentRankIndex + 1] || null;
  const avatarSrc = currentRankObj.image;
  const minBags = currentRankObj.minBags;
  const maxBags = currentRankObj.maxBags;
  const nextRankName = nextRankObj?.name || null;
  const nextRankMinBags = nextRankObj?.minBags || maxBags;
  const progress = Math.max(0, Math.min(1, (completedMissions - minBags) / (nextRankMinBags - minBags)));
  const missionsInCurrentRank = completedMissions - minBags;
  const missionsToNextRank = (nextRankMinBags - minBags) || 1;

  const handleScanCase = () => {
    alert('Scan Case pressed!');
  };

  const handleNavigation = (route: string) => {
    switch (route) {
      case 'home':
        router.push('/(driver)/home');
        break;
      case 'my-qwests':
        router.push('/(driver)/my-qwests');
        break;
      case 'profile':
        router.push('/(driver)/profile');
        break;
      case 'rewards':
        router.push('/(driver)/profile/rewards');
        break;
      case 'available-qwests':
        router.push('/(driver)/available-qwests');
        break;
      case 'logout':
        // Обработка выхода
        router.replace('/');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08061A' }}>
        <ActivityIndicator size="large" color="#FDEA35" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Градиентный фон */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: -1 }}>
        <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Defs>
            <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#02010C" />
              <Stop offset="100%" stopColor="#08061A" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#bgGradient)" />
        </Svg>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Верхний блок: Welcome + логотип */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerText}>{'Welcome\nback, Adventurer'}</Text>
            </View>
            <Image source={LOGO_SRC} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Блок с аватаркой и инфо */}
          <View style={styles.profileRow}>
            <AvatarFrame size={97} imageSrc={avatarSrc} style={styles.avatarFrame} />
            <View style={styles.infoBlock}>
              <Text style={styles.nameText}>{name}</Text>
              <View style={styles.rankRow}>
                <Text style={styles.rankLabel}>Current rank: </Text>
                <Text style={styles.rankName}>{rank}</Text>
              </View>
              {nextRankName && (
                <View style={styles.rankRow}>
                  <Text style={styles.rankLabel}>Next rank: </Text>
                  <Text style={styles.nextRankName}>{nextRankName}</Text>
                </View>
              )}
              {/* Прогресс-бар */}
              <View style={styles.progressWrap}>
                <Progress.Bar
                  progress={progress}
                  width={null}
                  color="#FDEA35"
                  unfilledColor="transparent"
                  borderWidth={2}
                  borderColor="#F1AF07"
                  borderRadius={20}
                  height={18}
                />
                <Text style={styles.missionsText}>
                  Completed missions: {completedMissions} / {nextRankMinBags}
                </Text>
              </View>
            </View>
          </View>

          {/* Кнопка Scan Case */}
          <View style={styles.buttonWrap}>
            <BlueButton title="Scan Case" onPress={handleScanCase} width={200} fontSize={22} />
          </View>

          {/* Пример ContainerFrame */}
          <ContainerInfoMainAdjustable height={containerHeight}>
            <View style={styles.containerInfo}>
                <Text style={styles.exampleTitle}>Container Frame</Text>
                <Text style={styles.exampleContent}>
                  Это простой, монолитный SVG-компонент. Он не растягивается,
                  но сохраняет пропорции.
                </Text>
            </View>
          </ContainerInfoMainAdjustable>

          {/* Кнопки для регулировки высоты */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setContainerHeight(h => h - 20)} style={styles.controlButton}>
              <Text style={styles.controlText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.heightValue}>Высота: {containerHeight}</Text>
            <TouchableOpacity onPress={() => setContainerHeight(h => h + 20)} style={styles.controlButton}>
              <Text style={styles.controlText}>+</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      
      {/* BurgerMenu внизу */}
      <BurgerMenu onNavigate={handleNavigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Отступ для BurgerMenu
  },
  container: {
    backgroundColor: 'transparent',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerText: {
    color: '#FDEA35',
    fontFamily: 'KantumruyPro-SemiBold',
    fontSize: 25,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 28,
  },
  logo: {
    width: 70,
    height: 70,
    marginLeft: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarFrame: {
    width: 97,
    height: 97,
  },
  infoBlock: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  nameText: {
    color: '#FDEA35',
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 22,
    fontWeight: '400',
    textShadowColor: '#F1AF07',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rankLabel: {
    color: '#FDEA35',
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 12,
    fontWeight: '300',
    textShadowColor: '#F1AF07',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  rankName: {
    color: '#FDEA35',
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 22,
    fontWeight: '400',
    textShadowColor: '#F1AF07',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  nextRankName: {
    color: '#FDEA35',
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.64,
    textShadowColor: '#F1AF07',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  progressWrap: {
    marginBottom: 12,
    marginTop: 8,
  },
  missionsText: {
    color: '#FDEA35',
    textAlign: 'center',
    fontFamily: 'KantumruyPro-Regular',
    fontSize: 12,
    fontWeight: '300',
    textShadowColor: '#F1AF07',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
    marginTop: 4,
  },
  buttonWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  containerInfo: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FDEA35',
    marginBottom: 10,
    textAlign: 'center',
  },
  exampleContent: {
    color: '#FDEA35',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#FDEA35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  controlText: {
    color: '#08061A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heightValue: {
    color: '#FDEA35',
    fontSize: 16,
  }
});

export default Home; 