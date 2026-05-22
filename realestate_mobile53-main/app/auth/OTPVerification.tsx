import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PrimaryButton, BackButton } from "../../components/Ui";
import { Colors } from "../../components/styles";
import { authService } from "../../services/authService";
import { useTranslation } from "../../hooks/useTranslation";

const OTPVerificationScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ 
    phoneNumber?: string, 
    method?: string, 
    contact?: string, 
    isRecovery?: string 
  }>();

  const contact = params.contact || params.phoneNumber || "";
  const isRecovery = params.isRecovery === "true";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(24);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNumberPress = (number: string) => {
    const firstEmptyIndex = otp.findIndex((digit) => digit === "");
    if (firstEmptyIndex !== -1) {
      handleOtpChange(number, firstEmptyIndex);
    }
  };

  const handleBackspace = () => {
    const lastFilledIndex = otp.findLastIndex((digit) => digit !== "");
    if (lastFilledIndex !== -1) {
      const newOtp = [...otp];
      newOtp[lastFilledIndex] = "";
      setOtp(newOtp);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (canResend) {
      try {
        setIsLoading(true);
        const result = await authService.resendOTP(contact);
        if (result.success) {
          setCountdown(24);
          setCanResend(false);
        }
      } catch (error: any) {
        console.error("Resend OTP Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNext = async () => {
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      setIsLoading(true);
      try {
        if (isRecovery) {
          // If it's recovery, we navigate to ResetPassword with the code
          router.push({
            pathname: "./ResetPassword",
            params: {
              contact: contact,
              otp: otpCode,
              method: params.method || "email",
              verified: "true"
            }
          });
        } else {
          // Regular phone verification
          const result = await authService.verifyOTP({
            phoneNumber: contact,
            otp: otpCode
          });

          if (result.success) {
            router.push("../(tabs)");
          }
        }
      } catch (error: any) {
        console.error("OTP Verification Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton color={Colors.textPrimary} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{t("authentication.enterCode")}</Text>
        <Text style={styles.subtitle}>
          {t("authentication.verificationSentTo")}{"\n"}
          {contact || "+216 99 999 999"}
        </Text>

        {/* OTP Input Circles */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInput | null) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : styles.otpInputEmpty,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              showSoftInputOnFocus={false}
            />
          ))}
        </View>

        {/* Resend Timer */}
        <Text style={styles.resendText}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
              <Text style={styles.resendLink}>{t("authentication.resendCode")}</Text>
            </TouchableOpacity>
          ) : (
            t("authentication.canResendIn").replace("{seconds}", countdown.toString())
          )}
        </Text>
      </View>

      {/* Next Button */}
      <PrimaryButton
        title={isLoading ? t("authentication.loading") : t("authentication.next")}
        onPress={handleNext}
        disabled={isLoading || !isOtpComplete}
        style={styles.nextButton}
      />

      {/* Custom Numeric Keypad */}
      <View style={styles.keypad}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          ["", "0", "⌫"],
        ].map((row, rowIndex) => (
          <View style={styles.keypadRow} key={rowIndex}>
            {row.map((key, keyIndex) => {
              if (key === "")
                return <View key={keyIndex} style={styles.keypadButton} />;
              if (key === "⌫")
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.keypadButton}
                    onPress={handleBackspace}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={Colors.textPrimary}
                    />
                  </TouchableOpacity>
                );
              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.keypadButton}
                  onPress={() => handleNumberPress(key)}
                >
                  <Text style={styles.keypadNumber}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 40,
    height: 40,
    borderRadius: 20,
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  otpInputEmpty: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  otpInputFilled: {
    backgroundColor: Colors.primary,
    color: Colors.textWhite,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
  nextButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  keypad: {
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  keypadButton: {
    width: 80,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  keypadNumber: {
    fontSize: 24,
    fontWeight: "300",
    color: Colors.textPrimary,
  },
});

export default OTPVerificationScreen;
