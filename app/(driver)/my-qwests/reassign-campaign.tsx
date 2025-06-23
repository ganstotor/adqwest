import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import ContainerInfoMain from "../../../components/ui/ContainerInfoMain";
import {
  BACKGROUND1_DARK_MAIN,
  ACCENT1_LIGHT,
} from "../../../constants/Colors";

const ReassignCampaignScreen: React.FC = () => {
  const { driverCampaignId } = useLocalSearchParams<{
    driverCampaignId: string;
  }>();

  return (
    <View style={styles.container}>
      <ContainerInfoMain minHeight={400} padding={40}>
        <Text style={styles.title}>
          Let the other user scan the code to receive your unused bags
        </Text>

        {driverCampaignId ? (
          <View style={styles.qrContainer}>
            <QRCode value={`REASSIGN_${driverCampaignId}`} size={250} />
          </View>
        ) : (
          <Text style={styles.error}>Driver campaign ID is missing</Text>
        )}
      </ContainerInfoMain>
    </View>
  );
};

export default ReassignCampaignScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND1_DARK_MAIN,
    alignItems: "center",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
    color: ACCENT1_LIGHT,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  error: {
    color: "red",
    fontSize: 16,
  },
});
