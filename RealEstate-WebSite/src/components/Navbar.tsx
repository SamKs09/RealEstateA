import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type ActivePage = "home" | "properties" | "vehicles" | "plans";

interface NavbarProps {
  activePage?: ActivePage;
}

export default function Navbar({ activePage }: NavbarProps) {
  const t = useTranslations("nav");

  const links: { href: string; label: string; page: ActivePage }[] = [
    { href: "/", label: t("home"), page: "home" },
    { href: "/properties", label: t("properties"), page: "properties" },
    { href: "/vehicles", label: t("vehicles"), page: "vehicles" },
    { href: "/plans", label: t("plans"), page: "plans" },
  ];

  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 pt-4 pb-2">
      <nav
        className="glass-panel rounded-full flex items-center justify-between w-full max-w-5xl px-6 py-3 shadow-lg"
        style={{ border: "1px solid rgba(255,255,255,0.3)" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-headline font-bold text-lg text-[#a33900] tracking-tight select-none"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          <span className="material-symbols-outlined text-[22px]">diamond</span>
          Rentim
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map(({ href, label, page }) => (
            <li key={page}>
              <Link
                href={href}
                className={`text-sm font-medium transition-colors ${
                  activePage === page
                    ? "text-[#a33900] font-semibold border-b-2 border-[#a33900] pb-0.5"
                    : "text-[#5b4137] hover:text-[#a33900]"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: Language Switcher + Sign In */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/signin"
            className="bg-[#a33900] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#cc4900] transition-colors"
          >
            {t("signIn")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
