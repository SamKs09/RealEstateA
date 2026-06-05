"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const locales = [
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
  { code: "ar", flag: "🇹🇳" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav.lang");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = locales.find((l) => l.code === locale);

  function handleSelect(code: string) {
    router.replace(pathname, { locale: code });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-[#5b4137] hover:text-[#a33900] transition-colors px-2 py-1 rounded-full hover:bg-[#ffdbce]/40"
        aria-label="Change language"
      >
        <span className="text-base">{current?.flag}</span>
        <span className="material-symbols-outlined text-[14px]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-xl border border-[#e3bfb1]/40 overflow-hidden min-w-[140px] z-50">
          {locales.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#ffdbce]/40 ${
                code === locale
                  ? "text-[#a33900] font-semibold bg-[#fff4f0]"
                  : "text-[#5b4137]"
              }`}
            >
              <span className="text-base">{flag}</span>
              <span>{t(code as "en" | "fr" | "ar")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
