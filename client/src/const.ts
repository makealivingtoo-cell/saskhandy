export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Current deployment does not have a separate OAuth portal.
// Route CTA and sign-in buttons to an internal app route instead of /app-auth.
export const getLoginUrl = () => {
  return `${window.location.origin}/role-select`;
};