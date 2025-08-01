import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.airplus.aviation",
  appName: "AirPlus Aviation",
  webDir: "dist/spa",
  server: {
    androidScheme: "https",
  },
  plugins: {
    App: {
      launchUrl: import.meta.env?.VITE_APP_URL || "https://airplus-aviation.netlify.app",
    },
    Camera: {
      permissions: ["camera", "photos"],
    },
    Filesystem: {
      enabled: true,
    },
    Network: {
      enabled: true,
    },
    Preferences: {
      enabled: true,
    },
  },
};

export default config;
