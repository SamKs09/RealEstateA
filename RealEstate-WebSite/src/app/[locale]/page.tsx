import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import HeroVideo from "@/components/HeroVideo";
import { Link } from "@/i18n/navigation";

// ── Static data (non-translatable) ────────────────────────────────────────────

const stats = [
  { value: "2,000+", key: "statsUsers" as const, icon: "group" },
  { value: "500+", key: "statsListings" as const, icon: "home_work" },
  { value: "24", key: "statsGovernorates" as const, icon: "map" },
  { value: "4.8★", key: "statsRating" as const, icon: "star" },
];

const features = [
  { icon: "apartment", key: "featurePropertyListings" as const },
  { icon: "directions_car", key: "featureVehicleMarketplace" as const },
  { icon: "map", key: "featureMapSearch" as const },
  { icon: "calendar_month", key: "featureInstantBooking" as const },
  { icon: "rocket_launch", key: "featureBoostListings" as const },
  { icon: "chat_bubble", key: "featureSecureMessaging" as const },
  { icon: "local_offer", key: "featureOffers" as const },
  { icon: "analytics", key: "featureAnalytics" as const },
  { icon: "support_agent", key: "featureSupport" as const },
];

const featuredProperties = [
  {
    id: 1,
    name: "The Alabaster Atrium",
    location: "Sidi Bou Saïd · Tunis",
    price: "4,250,000 TND",
    beds: 6,
    baths: 5,
    sqm: 820,
    badge: "Sea View",
    badgeColor: "#005da8",
    type: "Villa · For Sale",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  },
  {
    id: 2,
    name: "La Marsa Sky Garden",
    location: "La Marsa · Tunis",
    price: "8,900,000 TND",
    beds: 8,
    baths: 7,
    sqm: 1240,
    badge: "Penthouse",
    badgeColor: "#a33900",
    type: "Penthouse · For Sale",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
  {
    id: 3,
    name: "The Carthage Sanctuary",
    location: "Carthage · Tunis",
    price: "3,120,000 TND",
    beds: 5,
    baths: 4,
    sqm: 650,
    badge: "Historic",
    badgeColor: "#9b4500",
    type: "Villa · For Sale",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: 4,
    name: "Villa des Dunes",
    location: "Hammamet · Nabeul",
    price: "2,450,000 TND",
    beds: 4,
    baths: 3,
    sqm: 520,
    badge: "Pool",
    badgeColor: "#005da8",
    type: "Villa · For Sale",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
  {
    id: 5,
    name: "Résidence Yasmine",
    location: "Sousse · Sahel",
    price: "6,500 TND/mo",
    beds: 3,
    baths: 2,
    sqm: 180,
    badge: "New",
    badgeColor: "#007a3d",
    type: "Apartment · For Rent",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  },
  {
    id: 6,
    name: "Dar el Kef Heights",
    location: "Le Kef · North-West",
    price: "980,000 TND",
    beds: 6,
    baths: 4,
    sqm: 780,
    badge: "Mountain View",
    badgeColor: "#006b3c",
    type: "Traditional · For Sale",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
];

const featuredVehicles = [
  {
    id: 1,
    name: "Porsche 911 GT3 RS",
    year: "2024",
    price: "850,000 TND",
    km: "1,200 km",
    tag: "For Sale",
    tagColor: "#a33900",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  },
  {
    id: 2,
    name: "Mercedes S-Class 500",
    year: "2023",
    price: "12,000 TND / mo",
    km: "0 km",
    tag: "For Rent",
    tagColor: "#005da8",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
  },
  {
    id: 3,
    name: "Range Rover Autobiography",
    year: "2024",
    price: "580,000 TND",
    km: "800 km",
    tag: "For Sale",
    tagColor: "#a33900",
    image:
      "https://images.unsplash.com/photo-1519245659620-e859806a8d3b?w=800&q=80",
  },
  {
    id: 4,
    name: "BMW M5 Competition",
    year: "2023",
    price: "8,500 TND / mo",
    km: "5,000 km",
    tag: "For Rent",
    tagColor: "#005da8",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
  },
];

const plans = [
  {
    id: "freemium",
    nameKey: "planFreemiumName" as const,
    subtitleKey: "planFreemiumSubtitle" as const,
    descKey: "planFreemiumDesc" as const,
    featuresKey: "planFreemiumFeatures" as const,
    ctaKey: "planFreemiumCta" as const,
    highlight: false,
    badge: null,
    accentColor: "#8f7065",
  },
  {
    id: "trial",
    nameKey: "planTrialName" as const,
    subtitleKey: "planTrialSubtitle" as const,
    descKey: "planTrialDesc" as const,
    featuresKey: "planTrialFeatures" as const,
    ctaKey: "planTrialCta" as const,
    highlight: false,
    badgeKey: "planTrialBadge" as const,
    accentColor: "#005da8",
  },
  {
    id: "silver",
    nameKey: "planSilverName" as const,
    subtitleKey: "planSilverSubtitle" as const,
    descKey: "planSilverDesc" as const,
    featuresKey: "planSilverFeatures" as const,
    ctaKey: "planSilverCta" as const,
    highlight: true,
    badgeKey: "planSilverBadge" as const,
    accentColor: "#a33900",
  },
  {
    id: "platinum",
    nameKey: "planPlatinumName" as const,
    subtitleKey: "planPlatinumSubtitle" as const,
    descKey: "planPlatinumDesc" as const,
    featuresKey: "planPlatinumFeatures" as const,
    ctaKey: "planPlatinumCta" as const,
    highlight: false,
    badge: null,
    accentColor: "#370e00",
  },
];

const testimonials = [
  {
    nameKey: "testimonial1Name" as const,
    roleKey: "testimonial1Role" as const,
    textKey: "testimonial1Text" as const,
    rating: 5,
    initials: "YB",
    avatarBg: "#cc4900",
  },
  {
    nameKey: "testimonial2Name" as const,
    roleKey: "testimonial2Role" as const,
    textKey: "testimonial2Text" as const,
    rating: 5,
    initials: "LM",
    avatarBg: "#a33900",
  },
  {
    nameKey: "testimonial3Name" as const,
    roleKey: "testimonial3Role" as const,
    textKey: "testimonial3Text" as const,
    rating: 5,
    initials: "KT",
    avatarBg: "#7f2b00",
  },
];

const steps = [
  {
    num: "01",
    icon: "download",
    titleKey: "step1Title" as const,
    descKey: "step1Desc" as const,
  },
  {
    num: "02",
    icon: "person_add",
    titleKey: "step2Title" as const,
    descKey: "step2Desc" as const,
  },
  {
    num: "03",
    icon: "search",
    titleKey: "step3Title" as const,
    descKey: "step3Desc" as const,
  },
  {
    num: "04",
    icon: "chat_bubble",
    titleKey: "step4Title" as const,
    descKey: "step4Desc" as const,
  },
  {
    num: "05",
    icon: "key",
    titleKey: "step5Title" as const,
    descKey: "step5Desc" as const,
  },
];

const appFeatureIcons = [
  "notifications_active",
  "chat_bubble",
  "calendar_month",
  "bookmark",
  "translate",
];

const governorates = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Gafsa",
  "Tozeur",
  "Kébili",
  "Gabès",
  "Médenine",
  "Tataouine",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-col min-h-full">
      <Navbar activePage="home" />

      {/* ── Hero ── */}
      <section
        className="relative flex-1 overflow-hidden"
        style={{ minHeight: "90vh" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #F85B00 0%, #FCB78E 40%, #fce8dc 70%, #f9f9f9 100%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col lg:flex-row items-center gap-16">
          {/* Left — Copy */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm font-medium text-white">
              <span className="material-symbols-outlined text-[16px]">
                diamond
              </span>
              {t("heroBadge")}
            </div>
            <h1
              className="text-4xl md:text-6xl font-extrabold text-white leading-tight"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("heroLine1")}
              <br />
              <span className="text-[#370e00]">{t("heroLine2")}</span>
              <br />
              {t("heroLine3")}
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              {t("heroSubtext")}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="text-base font-semibold text-[#a33900]">Grow your business with Rentim</div>
              <div className="text-xs text-white/80 max-w-xs">Join our sellers community and unlock advanced features with a subscription plan tailored for professionals.</div>
              <Link
                href="/plans"
                className="mt-2 inline-block bg-[#a33900] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#cc4900] transition-colors"
              >
                Explore Seller Plans
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#cc4900", "#a33900", "#7f2b00"].map((c, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: c }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                  +2k
                </div>
              </div>
              <span className="text-sm text-white/80 font-medium">
                {t("heroSocialProof")}
              </span>
            </div>
          </div>
          {/* Right — Hero Video */}
          <div
            className="flex-1 relative hidden lg:flex items-center justify-center"
            style={{ minHeight: "440px" }}
          >
            <HeroVideo />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 80H1440V30C1200 70 900 10 600 50C300 90 100 20 0 40V80Z"
              fill="#f9f9f9"
            />
          </svg>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#f9f9f9] py-10 px-6 border-b border-[#e3bfb1]/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div
              key={s.key}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="material-symbols-outlined text-[#a33900] text-[28px]">
                {s.icon}
              </span>
              <p
                className="text-3xl font-extrabold text-[#1a1c1c]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {s.value}
              </p>
              <p className="text-xs text-[#8f7065] uppercase tracking-widest font-medium">
                {t(s.key)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
              {t("featuresLabel")}
            </p>
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("featuresTitle1")}
              <br />
              <span className="text-[#a33900] italic">
                {t("featuresTitle2")}
              </span>
            </h2>
            <p className="text-[#5b4137] max-w-xl mx-auto">
              {t("featuresSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.key}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#e3bfb1]/30 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[#a33900]">
                    {f.icon}
                  </span>
                </div>
                <h3
                  className="font-semibold text-[#1a1c1c] mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {t(`${f.key}Title` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-sm text-[#5b4137] leading-relaxed">
                  {t(`${f.key}Desc` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section id="properties" className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
                {t("propertiesLabel")}
              </p>
              <h2
                className="text-3xl font-bold text-[#1a1c1c]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t("propertiesTitle")}
              </h2>
            </div>
            <Link
              href="/properties"
              className="text-sm font-semibold text-[#a33900] flex items-center gap-1 hover:gap-2 transition-all"
            >
              {tc("viewAll")}{" "}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e3bfb1]/20 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="text-white text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: p.badgeColor }}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[10px] text-[#5b4137] font-medium px-2 py-1 rounded-full">
                    {p.type}
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    className="font-semibold text-[#1a1c1c] text-sm mb-1"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#8f7065] flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-[12px]">
                      location_on
                    </span>
                    {p.location}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[#5b4137] mb-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        bed
                      </span>
                      {p.beds} {tc("beds")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        shower
                      </span>
                      {p.baths} {tc("baths")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        square_foot
                      </span>
                      {p.sqm} m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[#a33900] font-bold text-sm">
                      {p.price}
                    </p>
                    <button className="text-xs bg-[#ffdbce] text-[#a33900] font-semibold px-3 py-1.5 rounded-full hover:bg-[#a33900] hover:text-white transition-colors">
                      {tc("details")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Vehicles ── */}
      <section id="vehicles" className="py-24 px-6 bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
                {t("vehiclesLabel")}
              </p>
              <h2
                className="text-3xl font-bold text-[#1a1c1c]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t("vehiclesTitle")}
              </h2>
            </div>
            <Link
              href="/vehicles"
              className="text-sm font-semibold text-[#a33900] flex items-center gap-1 hover:gap-2 transition-all"
            >
              {tc("viewAll")}{" "}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e3bfb1]/20 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={v.image}
                    alt={v.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="text-white text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: v.tagColor }}
                    >
                      {v.tag}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-[#8f7065] mb-0.5">
                    {v.year} · {v.km}
                  </p>
                  <h3
                    className="font-semibold text-[#1a1c1c] text-sm mb-2"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {v.name}
                  </h3>
                  <p className="text-[#a33900] font-bold text-sm">{v.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Download Section ── */}
      <section className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Phone mockup */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-64 h-[500px] bg-[#1a1c1c] rounded-[3rem] p-3 shadow-2xl">
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/20 rounded-full" />
              <div className="w-full h-full bg-gradient-to-b from-[#F85B00] to-[#a33900] rounded-[2.4rem] overflow-hidden flex flex-col p-5 gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-[10px] font-medium uppercase tracking-widest">
                    Rentim
                  </p>
                  <span className="material-symbols-outlined text-white text-[16px]">
                    notifications
                  </span>
                </div>
                <div className="flex-1 bg-white/10 rounded-2xl overflow-hidden relative">
                  <Image
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&q=80"
                    alt="App preview"
                    fill
                    className="object-cover opacity-80"
                  />
                </div>
                <div className="bg-white/15 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-xs font-semibold">
                      The Alabaster Atrium
                    </p>
                    <span className="material-symbols-outlined text-white/60 text-[14px]">
                      favorite_border
                    </span>
                  </div>
                  <p className="text-white/70 text-[10px]">
                    Sidi Bou Saïd · 4.25M TND
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                      6 beds
                    </span>
                    <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                      820 m²
                    </span>
                    <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                      Sea View
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Copy */}
          <div className="flex-1 space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900] mb-3">
                {t("appLabel")}
              </p>
              <h2
                className="text-4xl font-bold text-[#1a1c1c] leading-tight"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t("appTitle1")}
                <br />
                {t("appTitle2")}
              </h2>
            </div>
            <ul className="space-y-4">
              {appFeatureIcons.map((icon, i) => (
                <li key={icon} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#ffdbce] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#a33900] text-[20px]">
                      {icon}
                    </span>
                  </div>
                  <p className="text-[#5b4137] text-sm leading-relaxed">
                    {t(`appFeature${i + 1}` as Parameters<typeof t>[0])}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex gap-3 pt-2">
              <a
                href="#"
                className="bg-[#370e00] text-white flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm hover:bg-[#1a0700] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  apple
                </span>
                {tc("appStore")}
              </a>
              <a
                href="#"
                className="bg-[#a33900] text-white flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm hover:bg-[#cc4900] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  android
                </span>
                {tc("playStore")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking Feature ── */}
      <section className="py-24 px-6 bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
              {t("bookingLabel")}
            </p>
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("bookingTitle1")}
              <br />
              <span className="text-[#a33900] italic">
                {t("bookingTitle2")}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "calendar_month",
                titleKey: "bookingScheduleTitle" as const,
                descKey: "bookingScheduleDesc" as const,
              },
              {
                icon: "receipt_long",
                titleKey: "bookingTrackTitle" as const,
                descKey: "bookingTrackDesc" as const,
              },
              {
                icon: "verified",
                titleKey: "bookingVerifiedTitle" as const,
                descKey: "bookingVerifiedDesc" as const,
              },
            ].map((item) => (
              <div
                key={item.titleKey}
                className="bg-white rounded-3xl p-8 text-center shadow-sm border border-[#e3bfb1]/30 hover:shadow-md transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F85B00] to-[#a33900] flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-white text-[28px]">
                    {item.icon}
                  </span>
                </div>
                <h3
                  className="font-bold text-[#1a1c1c] mb-3"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm text-[#5b4137] leading-relaxed">
                  {t(item.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seller Tools ── */}
      <section className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
              {t("sellerLabel")}
            </p>
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("sellerTitle1")}
              <br />
              {t("sellerTitle2")}
            </h2>
            <p className="text-[#5b4137] leading-relaxed">{t("sellerDesc")}</p>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { icon: "analytics", key: "sellerFeatureAnalytics" as const },
                  { icon: "rocket_launch", key: "sellerFeatureBoost" as const },
                  { icon: "handshake", key: "sellerFeatureOffers" as const },
                  {
                    icon: "calendar_month",
                    key: "sellerFeatureCalendar" as const,
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-[#e3bfb1]/20"
                >
                  <span className="material-symbols-outlined text-[#a33900]">
                    {item.icon}
                  </span>
                  <p className="text-sm font-medium text-[#1a1c1c]">
                    {t(item.key)}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 bg-[#a33900] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#cc4900] transition-colors"
            >
              {t("sellerCta")}{" "}
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
          {/* Dashboard preview */}
          <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-[#e3bfb1]/20 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e3bfb1]/30 pb-4">
              <div>
                <p className="text-xs text-[#8f7065] uppercase tracking-widest">
                  Seller Dashboard
                </p>
                <p
                  className="font-bold text-[#1a1c1c]"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {t("sellerDashboardTitle")}
                </p>
              </div>
              <span className="bg-[#ffdbce] text-[#a33900] text-xs font-bold px-3 py-1 rounded-full">
                {t("sellerPlanBadge")}
              </span>
            </div>
            {[
              {
                name: "Villa des Dunes",
                views: 247,
                boosted: true,
                statusKey: "sellerActive" as const,
              },
              {
                name: "Apt Résidence Yasmine",
                views: 134,
                boosted: false,
                statusKey: "sellerActive" as const,
              },
              {
                name: "Porsche 911 GT3 RS",
                views: 389,
                boosted: true,
                statusKey: "sellerBoosted" as const,
              },
            ].map((listing) => (
              <div
                key={listing.name}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1a1c1c]">
                    {listing.name}
                  </p>
                  <p className="text-xs text-[#8f7065]">
                    {listing.views} {t("sellerViews")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {listing.boosted && (
                    <span className="material-symbols-outlined text-[#a33900] text-[16px]">
                      rocket_launch
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${listing.statusKey === "sellerBoosted" ? "bg-[#ffdbce] text-[#a33900]" : "bg-green-100 text-green-700"}`}
                  >
                    {t(listing.statusKey)}
                  </span>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#e3bfb1]/30">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#a33900]">8</p>
                <p className="text-[10px] text-[#8f7065]">
                  {t("sellerListingsCount")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#a33900]">3</p>
                <p className="text-[10px] text-[#8f7065]">
                  {t("sellerBoostsLeft")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#a33900]">12</p>
                <p className="text-[10px] text-[#8f7065]">
                  {t("sellerOffersCount")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section id="plans" className="py-24 px-6 bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
              {t("plansLabel")}
            </p>
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("plansTitle")}
            </h2>
            <p className="text-[#5b4137] max-w-lg mx-auto">
              {t("plansSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const features = t.raw(plan.featuresKey) as string[];
              const badge =
                "badgeKey" in plan && plan.badgeKey
                  ? t(plan.badgeKey as Parameters<typeof t>[0])
                  : null;
              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-7 flex flex-col gap-5 transition-all ${plan.highlight ? "shadow-xl border-2 border-[#a33900] bg-white scale-105" : "bg-white shadow-sm border border-[#e3bfb1]/30"}`}
                >
                  {badge && (
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full self-start"
                      style={{
                        background: plan.highlight ? "#ffdbce" : "#f3f3f3",
                        color: plan.accentColor,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: plan.accentColor }}
                    >
                      {t(plan.subtitleKey)}
                    </p>
                    <h3
                      className="text-2xl font-bold text-[#1a1c1c]"
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {t(plan.nameKey)}
                    </h3>
                    <p className="text-sm text-[#5b4137] mt-1">
                      {t(plan.descKey)}
                    </p>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-[#5b4137]"
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ color: plan.accentColor }}
                        >
                          check_circle
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#"
                    className="block text-center text-sm font-semibold py-3 rounded-2xl transition-colors"
                    style={
                      plan.highlight
                        ? { background: "#a33900", color: "#fff" }
                        : { background: "#ffdbce", color: plan.accentColor }
                    }
                  >
                    {t(plan.ctaKey)}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
              {t("testimonialsLabel")}
            </p>
            <h2
              className="text-4xl font-bold text-[#1a1c1c]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("testimonialsTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <div
                key={item.nameKey}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#e3bfb1]/20 space-y-5"
              >
                <div className="flex gap-1">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[#F85B00] text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-[#5b4137] text-sm leading-relaxed italic">
                  &ldquo;{t(item.textKey)}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-[#e3bfb1]/30">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: item.avatarBg }}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1c1c]">
                      {t(item.nameKey)}
                    </p>
                    <p className="text-xs text-[#8f7065]">{t(item.roleKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coverage ── */}
      <section className="py-20 px-6 bg-[#f9f9f9]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900] mb-3">
            {t("coverageLabel")}
          </p>
          <h2
            className="text-3xl font-bold text-[#1a1c1c] mb-4"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("coverageTitle")}
          </h2>
          <p className="text-[#5b4137] mb-10">{t("coverageSubtitle")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {governorates.map((g) => (
              <span
                key={g}
                className="bg-white border border-[#e3bfb1]/50 text-[#5b4137] text-sm font-medium px-4 py-2 rounded-full hover:border-[#a33900] hover:text-[#a33900] transition-colors cursor-default"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#eeeeee]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900] mb-3">
            {t("howItWorksLabel")}
          </p>
          <h2
            className="text-4xl font-bold text-[#1a1c1c] mb-4"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("howItWorksTitle")}
          </h2>
          <p className="text-[#5b4137] mb-16 max-w-xl mx-auto">
            {t("howItWorksSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="flex flex-col items-center gap-3 text-center relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+32px)] right-[-50%] h-0.5 bg-[#e3bfb1]" />
                )}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#a33900] flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white">
                      {s.icon}
                    </span>
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ffdbce] text-[#a33900] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3
                  className="font-bold text-[#1a1c1c] text-sm"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {t(s.titleKey)}
                </h3>
                <p className="text-xs text-[#5b4137] leading-relaxed">
                  {t(s.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section className="py-24 px-6">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-12 text-center space-y-6 overflow-hidden relative"
          style={{
            background:
              "linear-gradient(135deg, #F85B00 0%, #a33900 60%, #370e00 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative z-10 space-y-6">
            <span className="material-symbols-outlined text-white/80 text-[48px]">
              diamond
            </span>
            <h2
              className="text-4xl font-extrabold text-white"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("ctaTitle")}
            </h2>
            <p className="text-white/80 max-w-lg mx-auto">{t("ctaSubtitle")}</p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="#"
                className="bg-white text-[#a33900] flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm hover:bg-[#ffdbce] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  apple
                </span>
                {tc("appStore")}
              </a>
              <a
                href="#"
                className="border-2 border-white text-white flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  android
                </span>
                {tc("playStore")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
