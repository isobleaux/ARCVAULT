"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The webhook handles the order completion server-side.
    // This page simply confirms to the user that the purchase went through.
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-16 w-16 rounded-full bg-neutral-800 mx-auto mb-4" />
            <div className="h-6 w-48 bg-neutral-800 rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-neutral-800 rounded mx-auto" />
          </div>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Purchase Complete!</h1>
            <p className="text-neutral-400 mb-8">
              Thank you for your purchase. Your download is ready.
            </p>

            <div className="space-y-3">
              <Link href="/explore">
                <Button variant="outline" className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue Exploring
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
