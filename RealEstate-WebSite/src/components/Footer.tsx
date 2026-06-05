import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[#eeeeee] border-t border-[#e3bfb1]/40 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-10 pb-12 border-b border-[#e3bfb1]/40">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-[#a33900]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <span className="material-symbols-outlined text-[20px]">
                diamond
              </span>
              Rentim
            </Link>
            <p className="text-sm text-[#5b4137] leading-relaxed max-w-xs">
              {t("tagline")}
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="#"
                className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-[#e3bfb1] text-[#a33900] hover:bg-[#a33900] hover:text-white transition-colors"
                aria-label="App Store"
              >
                <img
                  src="/assets/AppStore.png"
                  alt="App Store"
                  className="w-5 h-5"
                />
                {t("appStore")}
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border border-[#e3bfb1] text-[#a33900] hover:bg-[#a33900] hover:text-white transition-colors"
                aria-label="Play Store"
              >
                <img
                  src="/assets/PlayStore.png"
                  alt="Play Store"
                  className="w-5 h-5"
                />
                {t("playStore")}
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8f7065]">
              {t("explore")}
            </h4>
            <ul className="space-y-2">
              {(
                [
                  { key: "properties", href: "/properties" },
                  { key: "vehicles", href: "/vehicles" },
                  { key: "mapSearch", href: "/map-search" },
                  { key: "collections", href: "/collections" },
                ] as const
              ).map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-[#5b4137] hover:text-[#a33900] transition-colors"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8f7065]">
              {t("services")}
            </h4>
            <ul className="space-y-2">
              {(
                [
                  "curatorCredits",
                  "negotiations",
                  "booking",
                  "globalSourcing",
                ] as const
              ).map((key) => (
                <li key={key}>
                  <a
                    href="#"
                    className="text-sm text-[#5b4137] hover:text-[#a33900] transition-colors"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8f7065]">
              {t("legal")}
            </h4>
            <ul className="space-y-2">
              {(["privacy", "terms", "cookie", "gdpr"] as const).map((key) => (
                <li key={key}>
                  <a
                    href="#"
                    className="text-sm text-[#5b4137] hover:text-[#a33900] transition-colors"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#8f7065]">
              {t("contact")}
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-[#5b4137]">
                <span className="material-symbols-outlined text-[16px] text-[#a33900]">
                  location_on
                </span>
                {t("location")}
              </li>
              <li className="flex items-center gap-2 text-sm text-[#5b4137]">
                <span className="material-symbols-outlined text-[16px] text-[#a33900]">
                  mail
                </span>
                RealEstate@Connect.tn
              </li>
              <li className="flex items-center gap-2 text-sm text-[#5b4137]">
                <span className="material-symbols-outlined text-[16px] text-[#a33900]">
                  phone
                </span>
                +216 71 000 000
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8">
          <p className="text-xs text-[#8f7065]">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
