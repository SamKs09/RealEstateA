import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Colors } from "../styles";

interface OTPInputProps {
  length?: number;
  onOTPChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  style?: any;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onOTPChange,
  onComplete,
  style,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const otpString = otp.join("");
    onOTPChange(otpString);

    if (otpString.length === length && onComplete) {
      onComplete(otpString);
    }
  }, [otp, length, onOTPChange, onComplete]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digit
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value is entered
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      // Clear current field and move to previous
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref: TextInput | null) => {
            inputRefs.current[index] = ref;
          }}
          style={[styles.input, digit ? styles.inputFilled : styles.inputEmpty]}
          value={digit}
          onChangeText={(value) => handleOtpChange(value, index)}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(nativeEvent.key, index)
          }
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  input: {
    width: 40,
    height: 40,
    borderRadius: 20,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    marginHorizontal: 8,
  },
  inputEmpty: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  inputFilled: {
    backgroundColor: Colors.primary,
    color: Colors.textWhite,
  },
});
