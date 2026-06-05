import Navbar from "@/components/Navbar";
import Link from "next/link";

const plans = [
  {
    id: "freemium",
    name: "Freemium",
    subtitle: "Free Forever",
    price: "0 TND",
    period: "",
    desc: "Browse all listings, save favourites, send messages and make offers — no credit card required.",
    features: [
      "Browse all property & vehicle listings",
      "Save & favourite listings",
      "In-app messaging with sellers",
      "Make and receive offers",
      "Map-based search",
      "Book viewings (as a buyer)",
    ],
    notIncluded: [
      "Create listings",
      "Boost listings",
      "Seller dashboard",
      "Analytics",
    ],
    cta: "Get Started Free",
    href: "#",
    highlight: false,
    badge: null,
    accentColor: "#8f7065",
    cardBg: "bg-white",
  },
  {
    id: "trial",
    name: "Free Trial",
    subtitle: "7 Days · No Card Needed",
    price: "Free",
    period: "7 days",
    desc: "Try every seller feature completely free. No credit card, no commitment.",
    features: [
      "Everything in Freemium",
      "Up to 3 active listings",
      "1 listing boost",
      "Seller dashboard",
      "Basic listing analytics",
      "Email support",
    ],
    notIncluded: [
      "Priority visibility",
      "Advanced analytics",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    href: "#",
    highlight: false,
    badge: "🎁 Try Free",
    accentColor: "#005da8",
    cardBg: "bg-white",
  },
  {
    id: "silver",
    name: "Silver",
    subtitle: "For Active Sellers",
    price: "Contact Us",
    period: "/ month",
    desc: "10 listings and 3 boosts per month — perfect for individual agents and serious sellers.",
    features: [
      "Everything in Free Trial",
      "10 active listings",
      "3 listing boosts / month",
      "Full seller dashboard",
      "Detailed analytics",
      "Priority support",
      "Featured in search results",
    ],
    notIncluded: [],
    cta: "Choose Silver",
    href: "#",
    highlight: true,
    badge: "Most Popular",
    accentColor: "#a33900",
    cardBg: "bg-white",
  },
  {
    id: "platinum",
    name: "Platinum",
    subtitle: "For Agencies & Power Sellers",
    price: "Contact Us",
    period: "/ month",
    desc: "Maximum exposure with 50 listings and 10 boosts — designed for agencies and high-volume dealers.",
    features: [
      "Everything in Silver",
      "50 active listings",
      "10 listing boosts / month",
      "Priority visibility across all searches",
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "API access (coming soon)",
    ],
    notIncluded: [],
    cta: "Choose Platinum",
    href: "#",
    highlight: false,
    badge: null,
    accentColor: "#370e00",
    cardBg: "bg-white",
  },
];

const faqs = [
  {
    q: "Can I cancel my plan at any time?",
    a: "Yes. You can cancel or downgrade your subscription at any time from the app. Your current plan remains active until the end of the billing cycle.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "After 7 days, your account automatically reverts to the free Freemium tier. Your listings will be paused — upgrade to Silver or Platinum to reactivate them.",
  },
  {
    q: "How do listing boosts work?",
    a: "Boosting a listing promotes it to the top of search results and category pages for a set period, giving it significantly more visibility.",
  },
  {
    q: "Is Freemium really free forever?",
    a: "Yes. Browsing, messaging, saving favourites, and making offers are always free with no time limit.",
  },
];

export default function PlansPage() {
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
          Pricing
        </p>
        <h1
          className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          Start Free. Scale When Ready.
        </h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          Browse for free forever. Unlock seller tools, listing boosts, and
          priority visibility whenever you need them.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="py-20 px-6 -mt-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col gap-6 transition-all relative overflow-hidden ${plan.highlight ? "shadow-xl border-2 border-[#a33900] bg-white scale-105" : "bg-white shadow-sm border border-[#e3bfb1]/30"}`}
              style={plan.highlight ? { zIndex: 2 } : {}}
            >
              {plan.highlight && (
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{background: "linear-gradient(135deg, #F85B00 0%, #ffdbce 100%)"}} />
              )}
              {plan.badge && (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full self-start mb-2"
                  style={{
                    background: plan.highlight ? "#ffdbce" : "#f3f3f3",
                    color: plan.accentColor,
                    zIndex: 3,
                    position: "relative"
                  }}
                >
                  {plan.badge}
                </span>
              )}
              <div className="space-y-2 z-10 relative">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: plan.accentColor }}
                >
                  {plan.subtitle}
                </p>
                <h2
                  className="text-2xl font-bold text-[#1a1c1c]"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {plan.name}
                </h2>
                <p className="text-3xl font-extrabold mt-2 text-[#1a1c1c]">
                  {plan.price}
                  {plan.period && (
                    <span className="text-sm font-normal text-[#8f7065]">
                      {plan.period}
                    </span>
                  )}
                </p>
                <p className="text-sm text-[#5b4137] mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-2 flex-1 z-10 relative">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[#5b4137]"
                  >
                    <span
                      className="material-symbols-outlined text-[18px] mt-0.5 shrink-0"
                      style={{
                        color: plan.accentColor,
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[#c4b0aa] line-through"
                  >
                    <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0 text-[#e3bfb1]">
                      cancel
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block text-center text-lg font-bold py-4 rounded-full transition-colors shadow-lg ${plan.highlight ? "bg-[#a33900] text-white hover:bg-[#cc4900]" : "bg-[#ffdbce] text-[#a33900] hover:bg-[#ffe7d6]"}`}
                style={plan.highlight ? { letterSpacing: "0.02em" } : {}}
              >
                <span className="material-symbols-outlined align-middle text-[22px] mr-2">
                  workspace_premium
                </span>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Compare Table */}
      <section className="py-16 px-6 bg-[#eeeeee]">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-bold text-[#1a1c1c] text-center mb-10"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e3bfb1]/20">
              <thead>
                <tr className="border-b border-[#e3bfb1]/30">
                  <th className="text-left p-4 text-[#5b4137] font-semibold">
                    Feature
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      className="p-4 text-center font-bold"
                      style={{ color: p.accentColor }}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Browse Listings", true, true, true, true],
                  ["Save Favourites", true, true, true, true],
                  ["Send Messages", true, true, true, true],
                  ["Make Offers", true, true, true, true],
                  ["Book Viewings (buyer)", true, true, true, true],
                  ["Create Listings", false, "Up to 3", "Up to 10", "Up to 50"],
                  [
                    "Listing Boosts",
                    false,
                    "1 / month",
                    "3 / month",
                    "10 / month",
                  ],
                  ["Seller Dashboard", false, true, true, true],
                  ["Analytics", false, "Basic", "Full", "Advanced"],
                  ["Priority Visibility", false, false, true, true],
                  ["Dedicated Support", false, false, false, true],
                ].map(([feature, ...vals]) => (
                  <tr
                    key={String(feature)}
                    className="border-b border-[#e3bfb1]/20 hover:bg-[#fdf5f2] transition-colors"
                  >
                    <td className="p-4 text-[#5b4137]">{String(feature)}</td>
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
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#e3bfb1]/20"
              >
                <p className="font-semibold text-[#1a1c1c] mb-2">{faq.q}</p>
                <p className="text-sm text-[#5b4137] leading-relaxed">
                  {faq.a}
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
            Ready to Start?
          </h2>
          <p className="text-white/80">
            Download the app and get started for free today.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="#"
              className="bg-white text-[#a33900] flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm hover:bg-[#ffdbce] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                apple
              </span>
              App Store
            </a>
            <a
              href="#"
              className="border-2 border-white text-white flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                android
              </span>
              Play Store
            </a>
          </div>
          <Link
            href="/"
            className="block text-white/60 text-sm hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
