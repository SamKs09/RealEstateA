import React from "react";
import { Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ButtonStyles, Colors } from "../styles";
import { Typography } from "../styles/GlobalStyles";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  style = {},
  innerStyle,
  textStyle = {},
  disabled = false,
  loading = false,
  icon = null,
}) => {
  return (
    <TouchableOpacity
      style={[
        ButtonStyles.primaryButton,
        (disabled || loading) && ButtonStyles.primaryButtonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={
          disabled || loading
            ? [Colors.textLight, Colors.textLight]
            : [Colors.primary, Colors.primaryLight]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[ButtonStyles.primaryButtonGradient, innerStyle]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon}
            <Text
              style={[
                ButtonStyles.primaryButtonText,
                disabled && ButtonStyles.primaryButtonTextDisabled,
                textStyle,
                { fontFamily: Typography.fontFamily.medium },
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
