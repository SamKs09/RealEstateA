import React, { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenLayout, SelectionButton } from "../../components/Ui";
import { useTranslation } from "../../hooks/useTranslation";

type UserType = "buyer" | "seller" | null;

const SignUpScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  // Removed locale polling, useLanguage handles re-rendering


  const handleBuyerSignUp = () => {
    setSelectedUserType("buyer");
    router.push("/auth/ChooseInterest?userType=buyer");
  };

  const handleSellerSignUp = () => {
    setSelectedUserType("seller");
    router.push("/auth/ChooseInterest?userType=seller");
  };

  return (
    <ScreenLayout title={t("authentication.signUpAs")}>
      <SelectionButton
        title={t("authentication.buyer")}
        onPress={handleBuyerSignUp}
        variant={selectedUserType === "buyer" ? "primary" : "secondary"}
        accessibilityLabel="Sign Up as Buyer"
      />

      <SelectionButton
        title={t("authentication.seller")}
        onPress={handleSellerSignUp}
        variant={selectedUserType === "seller" ? "primary" : "secondary"}
        accessibilityLabel="Sign Up as Seller"
      />
    </ScreenLayout>
  );
};

export default SignUpScreen;
