import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  ...(import.meta.env.VITE_AUTH_URL ? { baseURL: import.meta.env.VITE_AUTH_URL } : {}),
  basePath: "/auth",
  plugins: [jwtClient()],
});
