import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import ContainerInfoMain from "../components/ui/ContainerInfoMain";
import GoldButton from "../components/ui/GoldButton";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "What is adqwest?",
    text: " adqwest transforms gig economy delivery networks into a powerful advertising and product distribution channel. We connect businesses with delivery drivers from platforms like DoorDash, UberEats, and Grubhub—turning every delivery into a branded marketing opportunity.",
  },
  {
    id: "2",
    title: "How It Works:",
    text: " Whenever a delivery is made, it arrives in a reusable, high-visibility, eco-friendly, and responsibly-sourced  insulated bag featuring your advertisement or promotional content. Customers engage with your brand the moment they receive their order, creating a direct, tangible marketing touchpoint.",
  },
  { id: "3", title: "Get started now and explore!" },
];

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const slideWidth = width * 0.9 - 40;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
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
            width={width}
            height={height}
            fill="url(#bgGradient)"
          />
        </Svg>
      </View>

      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.adqwestImage}
      />
      <ContainerInfoMain style={{ width: "90%" }} padding={20}>
        <View style={{ height: 350 }}>
          <FlatList
            ref={flatListRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Text style={styles.title}>{item.title}</Text>
                {item.text && <Text style={styles.text}>{item.text}</Text>}
              </View>
            )}
            scrollEventThrottle={16}
          />
        </View>
      </ContainerInfoMain>

      {/* Индикаторы слайдера */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentIndex === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>

      {/* Кнопка Get Started */}
      <GoldButton
        title="Get Started"
        onPress={() => router.push("/signup")}
        width={250}
      />
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08061A",
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width: width * 0.9 - 40,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: "#FDEA35",
    marginBottom: 20,
    fontFamily: "Kantumruy Pro",
  },
  text: {
    color: "#FDEA35",
    textAlign: "center",
    fontFamily: "Kantumruy Pro",
    fontSize: 20,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 26,
  },
  indicatorContainer: {
    flexDirection: "row",
    marginVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#444",
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: "#F1AF07", // Gold color
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  adqwestImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 0,
    zIndex: 1,
  },
});
