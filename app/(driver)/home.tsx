import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AvatarFrame from "../../components/ui/AvatarFrame";
import BlueButton from "../../components/ui/BlueButton";
import BurgerMenu from "../../components/ui/BurgerMenu";
import ContainerInfoMain from "../../components/ui/ContainerInfoMain";
import ContainerInfoSimple from "../../components/ui/ContainerInfoSimple";
import GoldButton from "../../components/ui/GoldButton";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import * as Progress from "react-native-progress";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  DocumentReference,
} from "firebase/firestore";
import { ranks } from "../../constants/ranks";

const LOGO_SRC = require("../../assets/images/logo.png");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type DriverCampaign = {
  id: string;
  campaignId: string;
  logo: string;
  companyName: string;
  states: string[];
  status: string;
  bagsCount: number;
  bagsDelivered: number;
  startDate: string;
  endDate: string;
};

type CampaignDoc = {
  userAdId: DocumentReference;
  states: string[];
  startDate?: any; // Firestore Timestamp
  endDate?: any;
};

type AdDoc = {
  logo: string;
  companyName: string;
};

const Home = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rank, setRank] = useState("Page");
  const [completedMissions, setCompletedMissions] = useState(0);
  const [driverCampaigns, setDriverCampaigns] = useState<DriverCampaign[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(db, "users_driver", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || "");
        setRank(data.rank || "Page");
        setCompletedMissions(data.completedMissionsCount || 0);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Получение driver_campaigns
  useEffect(() => {
    const fetchDriverCampaigns = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDriverRef = doc(db, "users_driver", user.uid);

        const q = query(
          collection(db, "driver_campaigns"),
          where("userDriverId", "==", userDriverRef)
        );
        const snapshot = await getDocs(q);

        const campaignList: (DriverCampaign | null)[] = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            const campaignRef = data.campaignId as DocumentReference;

            const campaignSnap = await getDoc(campaignRef);
            if (!campaignSnap.exists()) {
              return null;
            }

            const campaignData = campaignSnap.data() as CampaignDoc;

            const adRef = campaignData.userAdId;
            const adSnap = await getDoc(adRef);

            if (!adSnap.exists()) {
              return null;
            }

            const adData = adSnap.data() as AdDoc;

            return {
              id: docSnap.id,
              campaignId: campaignRef.id,
              logo: adData.logo?.startsWith("http")
                ? adData.logo
                : `https:${adData.logo}`,
              companyName: adData.companyName,
              states: campaignData.states,
              status: data.status,
              bagsCount: data.bagsCount,
              bagsDelivered: data.bagsDelivered ?? 0,
              startDate:
                campaignData.startDate?.toDate?.().toLocaleDateString() || "",
              endDate:
                campaignData.endDate?.toDate?.().toLocaleDateString() || "",
            };
          })
        );

        const filteredCampaigns = campaignList.filter(
          Boolean
        ) as DriverCampaign[];

        setDriverCampaigns(filteredCampaigns);
      } catch (error) {
        console.error("🔥 Error fetching driver campaigns:", error);
      }
    };

    fetchDriverCampaigns();
  }, []);

  // Найти текущий и следующий ранг по массиву ranks
  const currentRankObj = ranks.find((r) => r.name === rank) || ranks[0];
  const currentRankIndex = ranks.findIndex((r) => r.name === rank);
  const nextRankObj = ranks[currentRankIndex + 1] || null;
  const avatarSrc = currentRankObj.image;
  const minBags = currentRankObj.minBags;
  const maxBags = currentRankObj.maxBags;
  const nextRankName = nextRankObj?.name || null;
  const nextRankMinBags = nextRankObj?.minBags || maxBags;
  const progress = Math.max(
    0,
    Math.min(1, (completedMissions - minBags) / (nextRankMinBags - minBags))
  );
  const missionsInCurrentRank = completedMissions - minBags;
  const missionsToNextRank = nextRankMinBags - minBags || 1;

  const handleScanCase = () => {
    router.push("/my-qwests/scan-case");
  };

  const handleScanBag = (campaignId: string) => {
    router.push({
      pathname: "/my-qwests/scan-case",
      params: { campaignId },
    });
  };

  const handleOrderBags = () => {
    router.push("/(driver)/available-qwests");
  };

  const handleNavigation = (route: string) => {
    switch (route) {
      case "home":
        router.push("/(driver)/home");
        break;
      case "my-qwests":
        router.push("/(driver)/my-qwests");
        break;
      case "profile":
        router.push("/(driver)/profile");
        break;
      case "rewards":
        router.push("/(driver)/profile/rewards");
        break;
      case "available-qwests":
        router.push("/(driver)/available-qwests");
        break;
      case "logout":
        // Обработка выхода
        router.replace("/");
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#08061A",
        }}
      >
        <ActivityIndicator size="large" color="#FDEA35" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Градиентный фон */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: -1 }}>
        <Svg
          height="100%"
          width="100%"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Defs>
            <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#02010C" />
              <Stop offset="100%" stopColor="#08061A" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="url(#bgGradient)"
          />
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
              <Text style={styles.headerText}>
                {"Welcome\nback, Adventurer"}
              </Text>
            </View>
            <Image source={LOGO_SRC} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Блок с аватаркой и инфо */}
          <View style={styles.profileRow}>
            <AvatarFrame
              size={97}
              imageSrc={avatarSrc}
              style={styles.avatarFrame}
            />
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
            <BlueButton
              title="Scan Case"
              onPress={handleScanCase}
              width={200}
              fontSize={22}
            />
          </View>

          {/* Заголовок Your Campaigns */}
          <Text style={styles.campaignsTitle}>Your Campaigns</Text>

          {/* Отображение кампаний */}
          {driverCampaigns.length > 0 ? (
            driverCampaigns.map((campaign, index) => (
              <View key={campaign.id} style={styles.campaignWrapper}>
                <ContainerInfoMain minHeight={200} padding={40}>
                  <View style={styles.campaignContainer}>
                    {/* Блок с информацией */}
                    <View style={styles.campaignInfoBlock}>
                      {/* Левая часть - логотип */}
                      <View style={styles.logoContainer}>
                        <Image
                          source={{ uri: campaign.logo }}
                          style={styles.campaignLogo}
                        />
                      </View>

                      {/* Правая часть - информация */}
                      <View style={styles.campaignDetails}>
                        <Text
                          style={[styles.campaignText, { marginBottom: 4 }]}
                        >
                          {campaign.companyName}
                        </Text>
                        <View style={styles.infoRow}>
                          <Text
                            style={[styles.campaignText, { marginRight: 5 }]}
                          >
                            {campaign.bagsDelivered}/{campaign.bagsCount}
                          </Text>
                          <Text style={styles.campaignLabel}>
                            missions completed
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text
                            style={[styles.campaignText, { marginRight: 5 }]}
                          >
                            {campaign.endDate}
                          </Text>
                          <Text style={styles.campaignLabel}>end date</Text>
                        </View>
                      </View>
                    </View>

                    {/* Кнопка Scan Bag */}
                    <View style={styles.scanBagButtonContainer}>
                      <GoldButton
                        title="Scan Bag"
                        onPress={() => handleScanBag(campaign.id)}
                        width={200}
                        height={60}
                      />
                    </View>
                  </View>
                </ContainerInfoMain>
              </View>
            ))
          ) : (
            <ContainerInfoSimple minHeight={150} padding={40}>
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  Looks like you don't have any active quests right now. Feel
                  free to scan a case if you've got one handy, or browse the
                  Campaigns section to find some cool new missions to dive into.
                </Text>
                <View style={styles.orderBagsButtonContainer}>
                  <GoldButton
                    title="Order Bags"
                    onPress={handleOrderBags}
                    width={200}
                    height={60}
                  />
                </View>
              </View>
            </ContainerInfoSimple>
          )}
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
    backgroundColor: "transparent",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerText: {
    color: "#FDEA35",
    fontFamily: "KantumruyPro-SemiBold",
    fontSize: 25,
    fontStyle: "normal",
    fontWeight: "600",
    lineHeight: 28,
  },
  logo: {
    width: 70,
    height: 70,
    marginLeft: 10,
    borderRadius: 35,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  avatarFrame: {
    width: 97,
    height: 97,
  },
  infoBlock: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  nameText: {
    color: "#FDEA35",
    fontFamily: "KantumruyPro-Regular",
    fontSize: 22,
    fontWeight: "400",
    textShadowColor: "#F1AF07",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  rankLabel: {
    color: "#FDEA35",
    fontFamily: "KantumruyPro-Regular",
    fontSize: 12,
    fontWeight: "300",
    textShadowColor: "#F1AF07",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  rankName: {
    color: "#FDEA35",
    fontFamily: "KantumruyPro-Regular",
    fontSize: 22,
    fontWeight: "400",
    textShadowColor: "#F1AF07",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  nextRankName: {
    color: "#FDEA35",
    fontFamily: "KantumruyPro-Regular",
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 0.64,
    textShadowColor: "#F1AF07",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  progressWrap: {
    marginBottom: 12,
    marginTop: 8,
  },
  missionsText: {
    color: "#FDEA35",
    textAlign: "center",
    fontFamily: "KantumruyPro-Regular",
    fontSize: 12,
    fontWeight: "300",
    textShadowColor: "#F1AF07",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
    marginTop: 4,
  },
  buttonWrap: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  campaignsTitle: {
    color: "#FDEA35",
    textAlign: "center",
    fontFamily: "Kantumruy Pro",
    fontSize: 32,
    fontStyle: "normal",
    fontWeight: "600",
    lineHeight: 38,
    marginBottom: 20,
    textShadowColor: "#F1AF07",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  campaignContainer: {
    alignItems: "center",
    width: "100%",
  },
  campaignInfoBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    width: "100%",
  },
  logoContainer: {
    marginRight: 20,
  },
  campaignLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  campaignDetails: {
    flex: 1,
    justifyContent: "center",
  },
  campaignText: {
    color: "#FDEA35",
    textAlign: "left",
    fontFamily: "Kantumruy Pro",
    fontSize: 16,
    fontStyle: "normal",
    fontWeight: "300",
    lineHeight: 20,
    letterSpacing: 0.64,
  },
  scanBagButtonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#FDEA35",
    textAlign: "center",
    fontFamily: "Kantumruy Pro",
    fontSize: 22,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 28,
    marginBottom: 20,
  },
  orderBagsButtonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  campaignWrapper: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 4,
    width: "100%",
  },
  campaignLabel: {
    color: "#FDEA35",
    fontFamily: "Kantumruy Pro",
    fontSize: 16,
    fontStyle: "normal",
    fontWeight: "300",
    lineHeight: 20,
    letterSpacing: 0.64,
  },
});

export default Home;
