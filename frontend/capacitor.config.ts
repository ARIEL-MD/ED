import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.estetima.app",
  appName: "Esteti-Ma",
  webDir: "dist",
  server: { androidScheme: "https" },
  android: { allowMixedContent: false },
};
export default config;
