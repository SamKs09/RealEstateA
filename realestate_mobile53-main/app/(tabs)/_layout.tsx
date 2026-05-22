import { Tabs } from "expo-router";
import { Image } from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { useInterest } from "../../contexts/InterestContext";
import OfferIcon from "../../components/Ui/OfferIcon";

export default function TabLayout() {
  const { t, currentLanguage } = useTranslation();
  const { userInterest } = useInterest();

  return (
    <Tabs
      key={`${currentLanguage}-${userInterest}`} // Force re-render when locale or interest changes
      screenOptions={{
        tabBarActiveTintColor: "#FF8C42",
        tabBarInactiveTintColor: "#A0A0A0",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          backgroundColor: "#fff",
          borderRadius: 28,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
        },
      }}
    >
      <Tabs.Screen
        name="Messages"
        options={{
          title: t("navigation.messages"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/Icons/Message.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "#FF8C42" : "#A0A0A0",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-offers"
        options={{
          title: t("navigation.offers") || "Offers",
          tabBarIcon: ({ focused }) => (
            <OfferIcon color={focused ? "#FF8C42" : "#A0A0A0"} />
          ),
        }}
      />
      <Tabs.Screen
        name="Explore"
        options={{
          title: t("navigation.explore"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/Icons/explore_Active.png")
                  : require("../../assets/Icons/explore.png")
              }
              style={{
                width: 24,
                height: 24,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Bookings"
        options={{
          title: t("navigation.bookings"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/Icons/list_alt_Active.png")
                  : require("../../assets/Icons/list_alt.png")
              }
              style={{
                width: 24,
                height: 24,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navigation.profile"),
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/Icons/account_circle_Active.png")
                  : require("../../assets/Icons/account_circle.png")
              }
              style={{
                width: 24,
                height: 24,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
