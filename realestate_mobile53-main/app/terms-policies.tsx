import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "../hooks/useTranslation";

export default function TermsAndPoliciesScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const clauses = [
    {
      id: 1,
      title: t("terms.clauseTitle"),
      content: t("terms.clauseContent"),
    },
    {
      id: 2,
      title: t("terms.clauseTitle"),
      content: t("terms.clauseContent"),
    },
    {
      id: 3,
      title: t("terms.clauseTitle"),
      content: t("terms.clauseContent"),
    },
    {
      id: 4,
      title: t("terms.clauseTitle"),
      content: t("terms.clauseContent"),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t("terms.title")}</Text>
            <Text style={styles.lastUpdated}>{t("terms.lastUpdated")}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {clauses.map((clause, index) => (
            <View key={index} style={styles.clauseContainer}>
              <Text style={styles.clauseTitle}>{clause.title}</Text>
              <Text style={styles.clauseText}>{clause.content}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => router.back()}
          >
            <Text style={styles.acceptButtonText}>{t("terms.accept")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontFamily: "raleway-400Regular",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  clauseContainer: {
    marginBottom: 25,
  },
  clauseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    fontFamily: "raleway-700Bold",
  },
  clauseText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontFamily: "raleway-400Regular",
  },
  footer: {
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
  },
  acceptButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
});
