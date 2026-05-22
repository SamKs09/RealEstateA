import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "../../hooks/useTranslation";
import { BackButton } from "../../components/Ui";
import i18n from "../../services/i18n";

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [locale, setLocale] = useState(i18n.locale);
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Listen for language changes
  React.useEffect(() => {
    const checkLocale = setInterval(() => {
      if (i18n.locale !== locale) {
        setLocale(i18n.locale);
      }
    }, 100);

    return () => clearInterval(checkLocale);
  }, [locale]);

  const faqQuestions = [
    {
      id: "1",
      question: "How Do I Manage My Notifications?",
      answer:
        'To manage notifications, go to "Settings", select "Notification Settings", and customize your preferences.',
    },
    {
      id: "2",
      question: "Lorem Ipsum is simply dummy text of the printing",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      id: "3",
      question: "Lorem Ipsum is simply dummy",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    {
      id: "4",
      question: "Lorem Ipsum is simply dummy",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const supportOptions = [
    {
      id: "customer-service",
      title: t("support.contactSupport"),
      icon: "headset-outline",
      onPress: () => router.push("/support/create-ticket" as any),
    },
    {
      id: "whatsapp",
      title: t("support.whatsapp"),
      icon: "logo-whatsapp",
      onPress: () => Linking.openURL("https://wa.me/"),
    },
    {
      id: "website",
      title: t("support.website"),
      icon: "globe-outline",
      onPress: () => Linking.openURL("https://yourwebsite.com"),
    },
    {
      id: "facebook",
      title: t("support.facebook"),
      icon: "logo-facebook",
      onPress: () => Linking.openURL("https://facebook.com"),
    },
    {
      id: "instagram",
      title: t("support.instagram"),
      icon: "logo-instagram",
      onPress: () => Linking.openURL("https://instagram.com"),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton style={styles.backButtonMargin} />
        <Text style={styles.headerTitle}>{t("support.title")}</Text>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "faq" && styles.activeTab]}
          onPress={() => setActiveTab("faq")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "faq" && styles.activeTabText,
            ]}
          >
            {t("support.faq")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "contact" && styles.activeTab]}
          onPress={() => setActiveTab("contact")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "contact" && styles.activeTabText,
            ]}
          >
            {t("support.contactUs")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "contact" && (
          <View style={styles.contactList}>
            {supportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.supportItem}
                onPress={option.onPress}
              >
                <View style={styles.supportItemLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color="#FF8C42"
                    />
                  </View>
                  <Text style={styles.supportItemText}>{option.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8A8A8A" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === "faq" && (
          <View style={styles.faqContainer}>
            {faqQuestions.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={
                      expandedFAQ === faq.id ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color="#333333"
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButtonMargin: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#FF8C42",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6D6D6",
  },
  activeTab: {
    backgroundColor: "#FF8C42",
    borderColor: "#FF8C42",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#FF8C42",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactList: {
    paddingTop: 10,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  supportItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  supportItemText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
    fontFamily: "Raleway-Medium",
  },
  faqContainer: {
    flex: 1,
    paddingTop: 10,
  },
  faqItem: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#333333",
    marginRight: 10,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 13,
    fontFamily: "Raleway-Regular",
    color: "#666666",
    lineHeight: 20,
  },
  faqPlaceholder: {
    fontSize: 16,
    color: "#8A8A8A",
    fontFamily: "Raleway-Regular",
    textAlign: "center",
  },
});
