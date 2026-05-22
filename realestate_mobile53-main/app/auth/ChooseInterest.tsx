import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenLayout, SelectionButton } from "../../components/Ui";
import { useTranslation } from "../../hooks/useTranslation";

type InterestOption = "cars" | "property" | "both" | null;
type UserType = "buyer" | "seller";

const ChooseInterestScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { userType } = useLocalSearchParams<{ userType: UserType }>();
  const [selectedOption, setSelectedOption] = useState<InterestOption>(null);

  const navigate = (interest: InterestOption) => {
    if (!interest) return;
    setSelectedOption(interest);
    const pathname =
      userType === "seller" ? "/auth/SellerSignUp" : "/auth/BuyerSignUp";
    router.push({ pathname, params: { interest } });
  };

  return (
    <ScreenLayout
      title={
        userType === "seller"
          ? t("authentication.chooseInterestSeller")
          : t("authentication.chooseInterestBuyer")
      }
    >
      <View style={styles.buttonContainer}>
        <SelectionButton
          title={t("authentication.property")}
          onPress={() => navigate("property")}
          variant={selectedOption === "property" ? "primary" : "secondary"}
          accessibilityLabel="Select Property Interest"
        />

        <SelectionButton
          title={t("authentication.cars")}
          onPress={() => navigate("cars")}
          variant={selectedOption === "cars" ? "primary" : "secondary"}
          accessibilityLabel="Select Cars Interest"
        />

        <SelectionButton
          title={t("authentication.both")}
          onPress={() => navigate("both")}
          variant={selectedOption === "both" ? "primary" : "secondary"}
          style={styles.lastButton}
          accessibilityLabel="Select Both Interest"
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  lastButton: {
    marginBottom: 0,
  },
});

export default ChooseInterestScreen;
