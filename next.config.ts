import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-images",
                expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
        },
        {
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-resources",
                expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
            },
        },
        {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "api-cache",
                expiration: { maxEntries: 16, maxAgeSeconds: 5 * 60 },
                networkTimeoutSeconds: 10,
            },
        },
    ],
});

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "picsum.photos",
            },
            {
                protocol: "https",
                hostname: "img.vietqr.io",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com", // Google Auth
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com", // GitHub Auth
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "5mb",
        },
    },
};

export default withPWA(nextConfig);
