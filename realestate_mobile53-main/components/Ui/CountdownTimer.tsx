import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../styles";

interface CountdownTimerProps {
  initialSeconds: number;
  onResend: () => void;
  resendText?: string;
  waitingText?: string;
  style?: any;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  onResend,
  resendText = "Resend the code",
  waitingText = "You can resend the code in",
  style,
}) => {
  const [countdown, setCountdown] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    setCountdown(initialSeconds);
    setCanResend(false);

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
  }, [initialSeconds]);

  const handleResend = () => {
    setCountdown(initialSeconds);
    setCanResend(false);
    onResend();

    // Restart timer
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
  };

  return (
    <Text style={[styles.text, style]}>
      {canResend ? (
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>{resendText}</Text>
        </TouchableOpacity>
      ) : (
        <>
          {waitingText} <Text style={styles.numberText}>{countdown}</Text>{" "}
          seconds
        </>
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
    textAlign: "center",
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: "600",
    fontFamily: "raleway-500Medium",
  },
  numberText: {
    fontFamily: "raleway-500Medium",
  },
});
