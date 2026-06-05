import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Image from "next/image";

// ── Static data ───────────────────────────────────────────────────────────────

const listings = [
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
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
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
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
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
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
  {
    id: 4,
    name: "Villa des Dunes",
    location: "Hammamet · Nabeul",
    price: "2,450,000 TND",
    beds: 4,
    baths: 3,
    sqm: 480,
    badge: "Beach Front",
    badgeColor: "#005da8",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
  },
  {
    id: 5,
    name: "Palais de Gammarth",
    location: "Gammarth · Tunis",
    price: "12,500,000 TND",
    beds: 12,
    baths: 10,
    sqm: 2100,
    badge: "Estate",
    badgeColor: "#a33900",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
  },
  {
    id: 6,
    name: "Riad El Amir",
    location: "Médina · Tunis",
    price: "1,800,000 TND",
    beds: 5,
    baths: 4,
    sqm: 420,
    badge: "Riad",
    badgeColor: "#9b4500",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
  },
];

const mapPins = [
  { top: "30%", left: "35%", price: "4.25M" },
  { top: "25%", left: "55%", price: "8.9M" },
  { top: "50%", left: "45%", price: "3.1M" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("properties");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-col min-h-full">
      <Navbar activePage="properties" />

      {/* ── Editorial Header ── */}
      <section className="pt-16 pb-10 px-6 max-w-7xl mx-auto w-full">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a33900]">
            {t("label")}
          </p>
          <h1
            className="text-5xl md:text-6xl font-extrabold text-[#1a1c1c] leading-tight"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("heading1")}
            <br />
            <span className="text-[#a33900] italic">{t("heading2")}</span>
          </h1>
          <p className="text-[#5b4137] text-lg max-w-xl mt-3">
            {t("headingSubtitle")}
          </p>
        </div>
      </section>

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-20 z-40 px-6 pb-6 max-w-7xl mx-auto w-full">
        <div className="glass-panel rounded-3xl p-4 flex flex-wrap gap-3 items-center shadow-lg">
          <div className="flex items-center gap-2 bg-white/80 rounded-2xl px-4 py-2.5 flex-1 min-w-[140px]">
            <span className="material-symbols-outlined text-[#a33900] text-[18px]">
              location_on
            </span>
            <select className="bg-transparent text-sm text-[#1a1c1c] outline-none flex-1 cursor-pointer">
              <option>{t("filterLocation")}</option>
              <option>Tunis</option>
              <option>Sidi Bou Saïd</option>
              <option>La Marsa</option>
              <option>Hammamet</option>
              <option>Carthage</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white/80 rounded-2xl px-4 py-2.5 flex-1 min-w-[140px]">
            <span className="material-symbols-outlined text-[#a33900] text-[18px]">
              payments
            </span>
            <select className="bg-transparent text-sm text-[#1a1c1c] outline-none flex-1 cursor-pointer">
              <option>{t("filterPrice")}</option>
              <option>Under 2M TND</option>
              <option>2M – 5M TND</option>
              <option>5M – 10M TND</option>
              <option>10M+ TND</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white/80 rounded-2xl px-4 py-2.5 flex-1 min-w-[140px]">
            <span className="material-symbols-outlined text-[#a33900] text-[18px]">
              villa
            </span>
            <select className="bg-transparent text-sm text-[#1a1c1c] outline-none flex-1 cursor-pointer">
              <option>{t("filterType")}</option>
              <option>{t("filterVilla")}</option>
              <option>{t("filterSale")}</option>
              <option>{t("filterRent")}</option>
              <option>{t("filterApartment")}</option>
            </select>
          </div>
          <button className="bg-[#a33900] text-white px-7 py-2.5 rounded-2xl font-semibold text-sm hover:bg-[#cc4900] transition-colors flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
            {t("discover")}
          </button>
        </div>
      </div>

      {/* ── Listings Grid ── */}
      <section className="px-6 pb-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e3bfb1]/30 hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className="relative" style={{ aspectRatio: "4/5" }}>
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-semibold"
                  style={{ background: p.badgeColor }}
                >
                  {p.badge}
                </div>
                <button className="absolute top-4 right-4 w-9 h-9 rounded-full glass-card flex items-center justify-center hover:bg-white/40 transition-colors">
                  <span className="material-symbols-outlined text-white text-[18px]">
                    favorite_border
                  </span>
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs text-[#8f7065] font-medium">
                    {p.location}
                  </p>
                  <h3
                    className="font-bold text-[#1a1c1c] text-lg mt-0.5"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {p.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#5b4137]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      bed
                    </span>
                    {p.beds} {t("beds")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      bathtub
                    </span>
                    {p.baths} {t("baths")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      square_foot
                    </span>
                    {p.sqm} m²
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#e3bfb1]/40">
                  <span className="text-[#a33900] font-bold text-lg">
                    {p.price}
                  </span>
                  <button className="text-xs font-semibold text-[#a33900] border border-[#a33900] rounded-full px-4 py-1.5 hover:bg-[#a33900] hover:text-white transition-colors">
                    {t("view")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load more */}
        <div className="flex justify-center mt-12">
          <button className="flex items-center gap-2 border border-[#a33900] text-[#a33900] px-8 py-3 rounded-full font-semibold text-sm hover:bg-[#a33900] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              expand_more
            </span>
            {t("loadMore")}
          </button>
        </div>
      </section>

      {/* ── Map Section ── */}
      <section className="px-6 pb-24 max-w-7xl mx-auto w-full">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ height: "480px" }}
        >
          <Image
            src="https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1400&q=80"
            alt="Tunisia map"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {mapPins.map((pin) => (
            <div
              key={pin.price}
              className="absolute"
              style={{ top: pin.top, left: pin.left }}
            >
              <div className="relative bg-[#a33900] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg cursor-pointer hover:bg-[#cc4900] transition-colors">
                {pin.price} TND
              </div>
            </div>
          ))}
          <div className="absolute bottom-6 left-6 glass-hero rounded-2xl p-5 max-w-xs">
            <p className="text-xs text-[#8f7065] font-medium">
              {t("mapAreaLabel")}
            </p>
            <h3
              className="font-bold text-[#1a1c1c] mt-1"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {t("mapAreaTitle")}
            </h3>
            <p className="text-sm text-[#5b4137] mt-1">
              {listings.length} listings · Avg. 5.2M TND
            </p>
            <button className="mt-3 text-xs font-semibold text-[#a33900] flex items-center gap-1 hover:gap-2 transition-all">
              {t("exploreMap")}
              <span className="material-symbols-outlined text-[14px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Floating AI Assistant ── */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 group">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity glass-hero rounded-2xl p-4 max-w-[220px] shadow-lg">
          <p className="font-semibold text-[#1a1c1c] text-sm">
            {t("aiCuratorTitle")}
          </p>
          <p className="text-xs text-[#5b4137] mt-1">{t("aiCuratorDesc")}</p>
        </div>
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          style={{ background: "linear-gradient(135deg, #F85B00, #a33900)" }}
        >
          <span className="material-symbols-outlined text-white">
            smart_toy
          </span>
        </button>
      </div>
    </div>
  );
}
