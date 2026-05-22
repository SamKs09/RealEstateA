import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../styles/GlobalStyles";

type PopupIconName = React.ComponentProps<typeof Ionicons>["name"];

interface PopupAction {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface PopupMessageProps {
  visible: boolean;
  type: "error" | "success" | "info" | "confirm";
  title?: string;
  message: string;
  onClose: () => void;
  primaryAction?: PopupAction;
  secondaryAction?: PopupAction;
}

export const PopupMessage: React.FC<PopupMessageProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  primaryAction,
  secondaryAction,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.92)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacity, scale, visible]);

  const variantConfig = {
    success: {
      accent: Colors.primary,
      tint: "#FFF3EC",
      iconName: "checkmark-circle" as PopupIconName,
      defaultTitle: "Success",
    },
    error: {
      accent: Colors.error,
      tint: "#FFF1F1",
      iconName: "close-circle" as PopupIconName,
      defaultTitle: "Something went wrong",
    },
    info: {
      accent: Colors.accent,
      tint: "#FFF6EE",
      iconName: "information-circle" as PopupIconName,
      defaultTitle: "Notice",
    },
    confirm: {
      accent: Colors.primary,
      tint: "#FFF3EC",
      iconName: "help-circle" as PopupIconName,
      defaultTitle: "Please confirm",
    },
  }[type];

  const resolvedTitle = title || variantConfig.defaultTitle;
  const resolvedPrimaryAction =
    primaryAction || (type === "confirm" ? undefined : { text: "OK" });

  const handleActionPress = (action?: PopupAction) => {
    if (action?.onPress) {
      action.onPress();
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <View
            style={[
              styles.iconShell,
              { backgroundColor: variantConfig.tint },
            ]}
          >
            <View
              style={[
                styles.iconCore,
                { backgroundColor: variantConfig.accent },
              ]}
            >
              <Ionicons name={variantConfig.iconName} size={28} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.title}>{resolvedTitle}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsRow}>
            {secondaryAction ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleActionPress(secondaryAction)}
              >
                <Text style={styles.secondaryButtonText}>{secondaryAction.text}</Text>
              </TouchableOpacity>
            ) : null}

            {resolvedPrimaryAction ? (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  resolvedPrimaryAction.style === "destructive" && styles.destructiveButton,
                  secondaryAction ? styles.splitButton : styles.fullButton,
                ]}
                onPress={() => handleActionPress(resolvedPrimaryAction)}
              >
                <Text style={styles.primaryButtonText}>{resolvedPrimaryAction.text}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.38)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    borderRadius: BorderRadius["2xl"],
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.xl,
    alignItems: "center",
    backgroundColor: Colors.background,
    ...Shadows.xl,
  },
  iconShell: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconCore: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.primary,
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
    fontFamily: Typography.fontFamily.medium,
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    minHeight: 52,
    borderRadius: BorderRadius.base,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  destructiveButton: {
    backgroundColor: Colors.error,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: BorderRadius.base,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
    flex: 1,
  },
  splitButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});
