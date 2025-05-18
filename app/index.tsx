import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  SafeAreaView
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

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
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
            <Image
        source={require("@/assets/images/logo.png")}
        style={styles.adqwestImage}
      />
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
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

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
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/signup")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    width: "70%",
  },
  indicatorContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 180,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FF9800",
    width: 10,
    height: 10,
  },
  button: {
    position: "absolute",
    bottom: 80,
    backgroundColor: "#FF9800",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  adqwestImage: {
    top: 200,
    width: 150,
    height: 150,
    resizeMode: "contain",
    borderRadius: 20,
  },
});
