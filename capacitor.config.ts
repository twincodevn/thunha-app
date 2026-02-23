import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.thunha.tenant",
  appName: "ThuNha Tenant",
  webDir: "public",
  server: {
    url: 'https://thunha.vn/tenant'
  },
};

export default config;
