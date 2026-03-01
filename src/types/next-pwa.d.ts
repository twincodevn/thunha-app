declare module "next-pwa" {
    import type { NextConfig } from "next";

    export interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        scope?: string;
        sw?: string;
        [key: string]: unknown;
    }
    function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
    export default withPWA;
}
