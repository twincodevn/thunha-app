import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.thunha.tenant",
  appName: "ThuNha Tenant",
  webDir: "public",
  server: {
    url: "http://localhost:3000/tenant",
    cleartext: true,
  },
};

export default config;
