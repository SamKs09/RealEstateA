"use client";

import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useState } from "react";

const savedCollections = [
  {
    type: "property",
    name: "The Alabaster Atrium",
    location: "Sidi Bou Saïd",
    price: "4.25M TND",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80",
  },
  {
    type: "vehicle",
    name: "Porsche 911 GT3 RS",
    location: "2024 · GT Silver",
    price: "850,000 TND",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80",
  },
  {
    type: "property",
    name: "La Marsa Sky Garden",
    location: "La Marsa",
    price: "8.9M TND",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
  },
  {
    type: "vehicle",
    name: "Ferrari 488 GTB",
    location: "2019 · Rosso Corsa",
    price: "980,000 TND",
    image:
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&q=80",
  },
];

const messages = [
  {
    from: "Selina Kyle",
    text: "I found 3 properties matching your Sidi Bou Saïd brief.",
    time: "10:32",
    self: false,
  },
  {
    from: "You",
    text: "Great! Can you share the details for the one with sea view?",
    time: "10:33",
    self: true,
  },
  {
    from: "Selina Kyle",
    text: "Of course. The Alabaster Atrium — 4.25M TND, 6 beds. Shall I book a viewing?",
    time: "10:34",
    self: false,
  },
  {
    from: "You",
    text: "Yes, please schedule for Saturday afternoon if possible.",
    time: "10:35",
    self: true,
  },
];

const recentActivity = [
  {
    icon: "visibility",
    text: "Viewed The Carthage Sanctuary",
    time: "2 hours ago",
  },
  {
    icon: "favorite",
    text: "Saved Lamborghini Huracán EVO",
    time: "Yesterday",
  },
  {
    icon: "calendar_today",
    text: "Viewing booked for Villa des Dunes",
    time: "2 days ago",
  },
];

export default function DashboardClient() {
  const t = useTranslations("dashboard");
  const [input, setInput] = useState("");

  const stats = [
    {
      icon: "workspace_premium",
      labelKey: "curatorPoints" as const,
      value: "1,240",
      subKey: "goldTier" as const,
      bg: "#a33900",
      textColor: "white",
    },
    {
      icon: "chat_bubble",
      labelKey: "messages" as const,
      value: "3",
      subKey: "newUnread" as const,
      bg: "#ffffff",
      textColor: "#1a1c1c",
    },
    {
      icon: "manage_search",
      labelKey: "activeSearches" as const,
      value: "12",
      subKey: "propertiesVehicles" as const,
      bg: "#ffffff",
      textColor: "#1a1c1c",
    },
  ];

  const settingItems = [
    { icon: "person", labelKey: "editProfile" as const },
    { icon: "notifications", labelKey: "notifications" as const },
    { icon: "security", labelKey: "privacySecurity" as const },
    { icon: "language", labelKey: "languageRegion" as const },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Navbar activePage="dashboard" />

      {/* ── Header ── */}
      <section className="px-6 pt-10 pb-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div>
            <h1
              className="text-3xl font-extrabold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("welcomeBack")}, Ahmed
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-[#ffdbce] text-[#a33900] text-xs font-semibold px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                {t("goldCurator")}
              </span>
              <span className="text-sm text-[#8f7065]">
                {t("memberSince")} 2023
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bento ── */}
      <section className="px-6 pb-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.labelKey}
              className="rounded-3xl p-6 border border-[#e3bfb1]/30 shadow-sm flex items-start gap-4"
              style={{ background: s.bg, color: s.textColor }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    s.bg === "#ffffff" ? "#ffdbce" : "rgba(255,255,255,0.2)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: s.bg === "#ffffff" ? "#a33900" : "white" }}
                >
                  {s.icon}
                </span>
              </div>
              <div>
                <p
                  className="text-xs font-medium opacity-70"
                  style={{
                    color:
                      s.bg === "#ffffff" ? "#8f7065" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {t(s.labelKey)}
                </p>
                <p
                  className="text-3xl font-bold mt-0.5"
                  style={{ color: s.textColor }}
                >
                  {s.value}
                </p>
                <p
                  className="text-xs mt-1 opacity-70"
                  style={{
                    color:
                      s.bg === "#ffffff" ? "#5b4137" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {t(s.subKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main Grid ── */}
      <section className="px-6 pb-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left — Chat + Settings */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Chat Panel */}
            <div
              className="bg-white rounded-3xl border border-[#e3bfb1]/30 shadow-sm overflow-hidden flex flex-col"
              style={{ height: "500px" }}
            >
              <div className="p-5 border-b border-[#e3bfb1]/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F85B00] to-[#a33900] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">
                    smart_toy
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1a1c1c] text-sm">
                    Selina Kyle
                  </p>
                  <p className="text-xs text-[#8f7065]">
                    {t("aiCurator")} · {t("online")}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.self ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.self ? "bg-[#a33900] text-white rounded-br-sm" : "bg-[#f3f3f3] text-[#1a1c1c] rounded-bl-sm"}`}
                    >
                      {m.text}
                      <p className="text-[10px] mt-1 opacity-60 text-right">
                        {m.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#e3bfb1]/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t("askCurator")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-[#f3f3f3] rounded-full px-4 py-2.5 text-sm outline-none text-[#1a1c1c] placeholder:text-[#8f7065]"
                />
                <button className="w-9 h-9 rounded-full bg-[#a33900] flex items-center justify-center hover:bg-[#cc4900] transition-colors shrink-0">
                  <span className="material-symbols-outlined text-white text-[18px]">
                    send
                  </span>
                </button>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-3xl border border-[#e3bfb1]/30 shadow-sm p-5 space-y-3">
              <h3
                className="font-semibold text-[#1a1c1c]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t("accountSettings")}
              </h3>
              {settingItems.map((item) => (
                <button
                  key={item.labelKey}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-[#f3f3f3] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#a33900] text-[20px]">
                      {item.icon}
                    </span>
                    <span className="text-sm text-[#1a1c1c] font-medium">
                      {t(item.labelKey)}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#8f7065] text-[18px]">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Collections + Activity */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Saved Collections */}
            <div className="bg-white rounded-3xl border border-[#e3bfb1]/30 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="font-bold text-[#1a1c1c] text-lg"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {t("savedCollections")}
                </h3>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full border border-[#e3bfb1] flex items-center justify-center hover:border-[#a33900] hover:text-[#a33900] transition-colors text-[#5b4137]">
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_left
                    </span>
                  </button>
                  <button className="w-8 h-8 rounded-full border border-[#e3bfb1] flex items-center justify-center hover:border-[#a33900] hover:text-[#a33900] transition-colors text-[#5b4137]">
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedCollections.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-2xl border border-[#e3bfb1]/30 hover:border-[#a33900]/30 hover:bg-[#f9f9f9] transition-all cursor-pointer group"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          color:
                            item.type === "property" ? "#005da8" : "#a33900",
                        }}
                      >
                        {item.type}
                      </span>
                      <p
                        className="font-semibold text-[#1a1c1c] text-sm truncate mt-0.5"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-[#8f7065]">{item.location}</p>
                      <p className="text-[#a33900] font-bold text-sm mt-1">
                        {item.price}
                      </p>
                    </div>
                    <button className="self-start w-7 h-7 rounded-full hover:bg-[#ffdbce] flex items-center justify-center transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[#a33900] text-[16px]">
                        favorite
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl border border-[#e3bfb1]/30 shadow-sm p-6">
              <h3
                className="font-bold text-[#1a1c1c] text-lg mb-5"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t("recentActivity")}
              </h3>
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#f3f3f3] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#ffdbce] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#a33900] text-[20px]">
                        {a.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1a1c1c]">
                        {a.text}
                      </p>
                      <p className="text-xs text-[#8f7065] mt-0.5">{a.time}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#e3bfb1] text-[18px]">
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full py-3 rounded-2xl border border-dashed border-[#e3bfb1] text-sm text-[#8f7065] hover:border-[#a33900] hover:text-[#a33900] transition-colors">
                {t("viewAllActivity")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
