import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for Next.js internals and static files
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
