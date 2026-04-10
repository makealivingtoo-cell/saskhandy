export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Temporary deploy behavior:
// send homepage CTA/sign-in buttons to a public internal page.
// We will swap this back to real auth once OAuth is wired up.
export const getLoginUrl = () => {
  return "/role-select";
};