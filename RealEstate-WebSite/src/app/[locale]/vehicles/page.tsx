import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Image from "next/image";

// ── Static data ───────────────────────────────────────────────────────────────

const vehicles = [
  {
    id: 1,
    name: "Porsche 911 GT3 RS",
    year: "2024",
    price: "850,000 TND",
    km: "1,200 km",
    color: "GT Silver Metallic",
    tag: "Limited Edition",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    stats: [
      { label: "0–100 km/h", value: "3.2s" },
      { label: "Top Speed", value: "296 km/h" },
      { label: "Engine", value: "4.0L Flat-6" },
      { label: "Power", value: "525 hp" },
    ],
  },
  {
    id: 2,
    name: "Lamborghini Huracán EVO",
    year: "2023",
    price: "1,200,000 TND",
    km: "0 km",
    color: "Arancio Borealis",
    tag: "New Arrival",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80",
    stats: [],
  },
  {
    id: 3,
    name: "Mercedes 280SL Pagoda",
    year: "1967",
    price: "420,000 TND",
    km: "63,000 km",
    color: "Cream White",
    tag: "Vintage Classic",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
    stats: [],
  },
  {
    id: 4,
    name: "Ferrari 488 GTB",
    year: "2019",
    price: "980,000 TND",
    km: "12,400 km",
    color: "Rosso Corsa",
    tag: "Certified",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=600&q=80",
    stats: [],
  },
];

const serviceItems = [
  {
    icon: "warehouse",
    titleKey: "storageTitle" as const,
    descKey: "storageDesc" as const,
  },
  {
    icon: "public",
    titleKey: "globalSourcingTitle" as const,
    descKey: "globalSourcingDesc" as const,
  },
  {
    icon: "build",
    titleKey: "heritageTitle" as const,
    descKey: "heritageDesc" as const,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VehiclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vehicles");
  const tc = await getTranslations("common");

  const categories = [
    t("filterAll"),
    t("filterVintage"),
    t("filterModern"),
    t("filterLimited"),
    t("filterSuv"),
    t("filterGt"),
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Navbar activePage="vehicles" />

      {/* ── Hero ── */}
      <section className="px-6 pt-8 pb-8 max-w-7xl mx-auto w-full">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ height: "600px" }}
        >
          <Image
            src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1400&q=80"
            alt="Luxury automotive hero"
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(26,28,28,0.85) 0%, rgba(26,28,28,0.4) 60%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-10">
            <div className="inline-flex items-center gap-2 bg-[#a33900] rounded-full px-4 py-1.5 w-fit mb-4">
              <span className="material-symbols-outlined text-white text-[14px]">
                workspace_premium
              </span>
              <span className="text-white text-xs font-semibold">
                {t("heroLabel")}
              </span>
            </div>
            <h1
              className="text-5xl font-extrabold text-white leading-tight max-w-lg"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("heroTitle1")}
              <br />
              <span className="text-[#ffb599] italic">{t("heroTitle2")}</span>
            </h1>
            <p className="text-white/70 mt-3 max-w-sm text-sm leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex gap-4 mt-6">
              <button className="bg-white/15 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-white/25 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  collections
                </span>
                {t("heroBrowse")}
              </button>
              <button className="bg-[#a33900] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#cc4900] transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  calendar_today
                </span>
                {t("heroBook")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Filters ── */}
      <section className="px-6 pb-8 max-w-7xl mx-auto w-full">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${i === 0 ? "bg-[#a33900] text-white" : "bg-white border border-[#e3bfb1] text-[#5b4137] hover:border-[#a33900] hover:text-[#a33900]"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Showcase Bento Grid ── */}
      <section className="px-6 pb-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Featured — Porsche (8 cols) */}
          <div className="md:col-span-8 bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e3bfb1]/30 hover:shadow-lg transition-shadow group">
            <div className="relative" style={{ height: "360px" }}>
              <Image
                src={vehicles[0].image}
                alt={vehicles[0].name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute top-5 left-5">
                <span className="bg-[#a33900] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  {vehicles[0].tag}
                </span>
              </div>
              <button className="absolute top-5 right-5 w-9 h-9 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-white text-[18px]">
                  favorite_border
                </span>
              </button>
              <div className="absolute bottom-5 left-5">
                <p className="text-white/70 text-xs font-medium">
                  {vehicles[0].year} · {vehicles[0].color}
                </p>
                <h2
                  className="text-white text-2xl font-bold mt-1"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {vehicles[0].name}
                </h2>
                <p className="text-[#ffb599] font-bold text-xl mt-1">
                  {vehicles[0].price}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#e3bfb1]/40 border-t border-[#e3bfb1]/40">
              {vehicles[0].stats.map((s) => (
                <div key={s.label} className="p-4 text-center">
                  <p className="text-xs text-[#8f7065] font-medium">
                    {s.label}
                  </p>
                  <p className="text-[#1a1c1c] font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Test drive booking card */}
            <div
              className="rounded-3xl p-6 flex flex-col justify-between"
              style={{
                background: "linear-gradient(135deg, #a33900 0%, #F85B00 100%)",
                minHeight: "160px",
              }}
            >
              <div>
                <span className="material-symbols-outlined text-white/60 text-3xl">
                  calendar_today
                </span>
                <h3
                  className="text-white font-bold text-lg mt-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {t("testDriveCardTitle")}
                </h3>
                <p className="text-white/70 text-xs mt-1">
                  {t("testDriveCardDesc")}
                </p>
              </div>
              <button className="mt-4 bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-white/30 transition-colors w-fit flex items-center gap-1">
                {t("testDriveCardBtn")}
                <span className="material-symbols-outlined text-[14px]">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Lamborghini thumbnail */}
            <div className="flex-1 bg-white rounded-3xl overflow-hidden border border-[#e3bfb1]/30 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative" style={{ height: "180px" }}>
                <Image
                  src={vehicles[1].image}
                  alt={vehicles[1].name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-white font-semibold text-sm">
                    {vehicles[1].name}
                  </p>
                  <p className="text-[#ffb599] font-bold text-sm">
                    {vehicles[1].price}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Second row — 2 classic cars (4 cols each) */}
          {[vehicles[2], vehicles[3]].map((v) => (
            <div
              key={v.id}
              className="md:col-span-4 bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e3bfb1]/30 hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className="relative" style={{ height: "220px" }}>
                <Image
                  src={v.image}
                  alt={v.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span
                  className="absolute top-4 left-4 text-white text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "#9b4500" }}
                >
                  {v.tag}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-[#8f7065] font-medium">
                  {v.year} · {v.color}
                </p>
                <h3
                  className="font-bold text-[#1a1c1c] mt-1"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {v.name}
                </h3>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e3bfb1]/40">
                  <span className="text-[#a33900] font-bold">{v.price}</span>
                  <button className="text-xs font-semibold text-white bg-[#a33900] px-4 py-1.5 rounded-full hover:bg-[#cc4900] transition-colors">
                    {t("testDrive")}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Curator's Choice CTA (col-span-4) */}
          <div
            className="md:col-span-4 rounded-3xl p-8 flex flex-col justify-between"
            style={{
              background: "linear-gradient(160deg, #ffdbce, #ffb599)",
              minHeight: "300px",
            }}
          >
            <div>
              <span className="material-symbols-outlined text-[#a33900] text-4xl">
                stars
              </span>
              <h3
                className="text-[#370e00] font-extrabold text-2xl mt-3 leading-tight"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t("curatorTitle")}
              </h3>
              <p className="text-[#7f2b00] text-sm mt-2 leading-relaxed">
                {t("curatorDesc")}
              </p>
            </div>
            <button className="mt-6 bg-[#a33900] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#cc4900] transition-colors w-fit flex items-center gap-2">
              {t("curatorBtn")}
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Beyond the Machine (Services) ── */}
      <section className="px-6 pb-24 max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900] mb-2">
            {t("servicesLabel")}
          </p>
          <h2
            className="text-3xl font-bold text-[#1a1c1c]"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("servicesTitle")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceItems.map((s) => (
            <div
              key={s.titleKey}
              className="bg-white rounded-3xl p-8 border border-[#e3bfb1]/30 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[#a33900]">
                  {s.icon}
                </span>
              </div>
              <h3
                className="font-semibold text-[#1a1c1c] text-lg mb-2"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {t(s.titleKey)}
              </h3>
              <p className="text-sm text-[#5b4137] leading-relaxed">
                {t(s.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
