import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Všetko okrem API, _next a súborov s príponou
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
