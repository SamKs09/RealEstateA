import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import { Link } from "@/i18n/navigation";

// ── Static plan data (non-translatable) ───────────────────────────────────────

const plans = [
  {
    id: "freemium",
    price: "0 TND",
    period: "",
    nameKey: "planFreemiumName" as const,
    subtitleKey: "planFreemiumSubtitle" as const,
    descKey: "planFreemiumDesc" as const,
    ctaKey: "planFreemiumCta" as const,
    highlight: false,
    badge: null,
    accentColor: "#8f7065",
    included: [
      "featBrowse",
      "featSave",
      "featMessage",
      "featOffers",
      "featBookBuyer",
    ] as const,
    notIncluded: [
      "featCreateListings",
      "featBoosts",
      "featDashboard",
      "featAnalytics",
    ] as const,
  },
  {
    id: "trial",
    price: "Free",
    period: "7 days",
    nameKey: "planTrialName" as const,
    subtitleKey: "planTrialSubtitle" as const,
    descKey: "planTrialDesc" as const,
    ctaKey: "planTrialCta" as const,
    badgeKey: "planTrialBadge" as const,
    highlight: false,
    accentColor: "#005da8",
    included: [
      "featBrowse",
      "featSave",
      "featMessage",
      "featOffers",
      "featBookBuyer",
      "featCreateListings",
      "featBoosts",
      "featDashboard",
      "featAnalytics",
    ] as const,
    notIncluded: ["featPriority", "featDedicated"] as const,
    includedMeta: {
      featCreateListings: "upTo3" as const,
      featBoosts: "1",
      featAnalytics: "basic" as const,
    },
  },
  {
    id: "silver",
    price: "Contact Us",
    period: "/ month",
    nameKey: "planSilverName" as const,
    subtitleKey: "planSilverSubtitle" as const,
    descKey: "planSilverDesc" as const,
    ctaKey: "planSilverCta" as const,
    badgeKey: "planSilverBadge" as const,
    highlight: true,
    accentColor: "#a33900",
    included: [
      "featBrowse",
      "featSave",
      "featMessage",
      "featOffers",
      "featBookBuyer",
      "featCreateListings",
      "featBoosts",
      "featDashboard",
      "featAnalytics",
      "featPriority",
    ] as const,
    notIncluded: ["featDedicated"] as const,
    includedMeta: {
      featCreateListings: "upTo10" as const,
      featBoosts: "3",
      featAnalytics: "full" as const,
    },
  },
  {
    id: "platinum",
    price: "Contact Us",
    period: "/ month",
    nameKey: "planPlatinumName" as const,
    subtitleKey: "planPlatinumSubtitle" as const,
    descKey: "planPlatinumDesc" as const,
    ctaKey: "planPlatinumCta" as const,
    highlight: false,
    badge: null,
    accentColor: "#370e00",
    included: [
      "featBrowse",
      "featSave",
      "featMessage",
      "featOffers",
      "featBookBuyer",
      "featCreateListings",
      "featBoosts",
      "featDashboard",
      "featAnalytics",
      "featPriority",
      "featDedicated",
    ] as const,
    notIncluded: [] as const,
    includedMeta: {
      featCreateListings: "upTo50" as const,
      featBoosts: "10",
      featAnalytics: "advanced" as const,
    },
  },
] as const;

const faqs = [
  { qKey: "faq1Q" as const, aKey: "faq1A" as const },
  { qKey: "faq2Q" as const, aKey: "faq2A" as const },
  { qKey: "faq3Q" as const, aKey: "faq3A" as const },
  { qKey: "faq4Q" as const, aKey: "faq4A" as const },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("plans");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-col min-h-full bg-[#f9f9f9]">
      <Navbar activePage="plans" />

      {/* Hero */}
      <section
        className="py-20 px-6 text-center"
        style={{
          background:
            "linear-gradient(160deg, #F85B00 0%, #FCB78E 40%, #fce8dc 70%, #f9f9f9 100%)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-3">
          {t("heroLabel")}
        </p>
        <h1
          className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {t("heroTitle")}
        </h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          {t("heroSubtitle")}
        </p>
      </section>

      {/* Plans Grid */}
      <section className="py-20 px-6 -mt-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
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
                    {t(plan.subtitleKey as Parameters<typeof t>[0])}
                  </p>
                  <h2
                    className="text-2xl font-bold text-[#1a1c1c]"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {t(plan.nameKey as Parameters<typeof t>[0])}
                  </h2>
                  <p className="text-3xl font-extrabold mt-2 text-[#1a1c1c]">
                    {plan.price === "Contact Us"
                      ? t("planContactUs")
                      : plan.price === "Free"
                        ? t("planTrialPrice")
                        : plan.price}
                    {plan.period && (
                      <span className="text-sm font-normal text-[#8f7065]">
                        {" "}
                        {plan.period === "/ month"
                          ? t("perMonth")
                          : plan.period === "7 days"
                            ? t("planTrialPeriod")
                            : plan.period}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[#5b4137] mt-2">
                    {t(plan.descKey as Parameters<typeof t>[0])}
                  </p>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.included.map((fKey) => {
                    const meta =
                      "includedMeta" in plan
                        ? (plan.includedMeta as Record<string, string>)[fKey]
                        : undefined;
                    const label = meta
                      ? /^\d+$/.test(meta)
                        ? meta
                        : t(meta as Parameters<typeof t>[0])
                      : null;
                    return (
                      <li
                        key={fKey}
                        className="flex items-start gap-2 text-sm text-[#5b4137]"
                      >
                        <span
                          className="material-symbols-outlined text-[16px] mt-0.5 shrink-0"
                          style={{
                            color: plan.accentColor,
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          check_circle
                        </span>
                        {label
                          ? `${t(fKey as Parameters<typeof t>[0])}: ${label}`
                          : t(fKey as Parameters<typeof t>[0])}
                      </li>
                    );
                  })}
                  {plan.notIncluded.map((fKey) => (
                    <li
                      key={fKey}
                      className="flex items-start gap-2 text-sm text-[#c4b0aa] line-through"
                    >
                      <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0 text-[#e3bfb1]">
                        cancel
                      </span>
                      {t(fKey as Parameters<typeof t>[0])}
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
                  {t(plan.ctaKey as Parameters<typeof t>[0])}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compare Table */}
      <section className="py-16 px-6 bg-[#eeeeee]">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-bold text-[#1a1c1c] text-center mb-10"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("compareTitle")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e3bfb1]/20">
              <thead>
                <tr className="border-b border-[#e3bfb1]/30">
                  <th className="text-left p-4 text-[#5b4137] font-semibold">
                    {t("compareFeature")}
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      className="p-4 text-center font-bold"
                      style={{ color: p.accentColor }}
                    >
                      {t(p.nameKey as Parameters<typeof t>[0])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "featBrowse", vals: [true, true, true, true] },
                  { key: "featSave", vals: [true, true, true, true] },
                  { key: "featMessage", vals: [true, true, true, true] },
                  { key: "featOffers", vals: [true, true, true, true] },
                  { key: "featBookBuyer", vals: [true, true, true, true] },
                  {
                    key: "featCreateListings",
                    vals: [false, t("upTo3"), t("upTo10"), t("upTo50")],
                  },
                  { key: "featBoosts", vals: [false, "1", "3", "10"] },
                  { key: "featDashboard", vals: [false, true, true, true] },
                  {
                    key: "featAnalytics",
                    vals: [false, t("basic"), t("full"), t("advanced")],
                  },
                  { key: "featPriority", vals: [false, false, true, true] },
                  { key: "featDedicated", vals: [false, false, false, true] },
                ].map(({ key, vals }) => (
                  <tr
                    key={key}
                    className="border-b border-[#e3bfb1]/20 hover:bg-[#fdf5f2] transition-colors"
                  >
                    <td className="p-4 text-[#5b4137]">
                      {t(key as Parameters<typeof t>[0])}
                    </td>
                    {vals.map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {v === true ? (
                          <span
                            className="material-symbols-outlined text-green-600 text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : v === false ? (
                          <span className="material-symbols-outlined text-[#e3bfb1] text-[18px]">
                            remove
                          </span>
                        ) : (
                          <span className="text-[#a33900] font-semibold">
                            {String(v)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6 bg-[#f9f9f9]">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl font-bold text-[#1a1c1c] text-center mb-10"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("faqTitle")}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.qKey}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#e3bfb1]/20"
              >
                <p className="font-semibold text-[#1a1c1c] mb-2">
                  {t(faq.qKey)}
                </p>
                <p className="text-sm text-[#5b4137] leading-relaxed">
                  {t(faq.aKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-10 text-center space-y-5"
          style={{
            background:
              "linear-gradient(135deg, #F85B00 0%, #a33900 60%, #370e00 100%)",
          }}
        >
          <h2
            className="text-3xl font-extrabold text-white"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {t("ctaTitle")}
          </h2>
          <p className="text-white/80">{t("ctaSubtitle")}</p>
          <div className="flex justify-center gap-4 flex-wrap">
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
          <Link
            href="/"
            className="block text-white/60 text-sm hover:text-white transition-colors"
          >
            {tc("backToHome")}
          </Link>
        </div>
      </section>
    </div>
  );
}
