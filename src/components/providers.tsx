"use client";

import { SessionProvider } from "next-auth/react";

import { ServiceWorker } from "@/components/service-worker";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <ServiceWorker />
      </ToastProvider>
    </SessionProvider>
  );
}
