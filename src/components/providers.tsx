"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          const { Keyboard } = await import("@capacitor/keyboard");

          // Hide splash screen once React has mounted
          await SplashScreen.hide();

          // Optimize keyboard UX for webview
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
          await Keyboard.setScroll({ isDisabled: false });
        }
      } catch (e) {
        console.log(
          "Capacitor not available or error initializing plugins:",
          e,
        );
      }
    };
    initCapacitor();
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
