import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-[#e3bfb1]/40">
        <h1
          className="text-3xl font-extrabold text-[#a33900] mb-2 text-center"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {t("signUpTitle")}
        </h1>
        <p className="text-[#5b4137] text-center mb-8">{t("signUpSubtitle")}</p>
        <form className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#8f7065] mb-1"
            >
              {t("nameLabel")}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e3bfb1] focus:border-[#a33900] outline-none text-[#1a1c1c] bg-[#f9f9f9]"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#8f7065] mb-1"
            >
              {t("emailLabel")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e3bfb1] focus:border-[#a33900] outline-none text-[#1a1c1c] bg-[#f9f9f9]"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#8f7065] mb-1"
            >
              {t("passwordLabel")}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e3bfb1] focus:border-[#a33900] outline-none text-[#1a1c1c] bg-[#f9f9f9]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#a33900] text-white font-semibold py-3 rounded-xl hover:bg-[#cc4900] transition-colors shadow-md"
          >
            {t("signUpButton")}
          </button>
        </form>
        <div className="flex items-center justify-between mt-6">
          <Link
            href="/signin"
            className="text-xs text-[#a33900] hover:underline"
          >
            {t("hasAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
