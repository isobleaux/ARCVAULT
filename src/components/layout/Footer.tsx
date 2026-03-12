import Link from "next/link";
import { Music } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Music className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-white">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-neutral-500">
              Eight powerful modules. One unified platform.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/explore" className="text-sm text-neutral-500 hover:text-white transition-colors">
                  Explore Artists
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-sm text-neutral-500 hover:text-white transition-colors">
                  Become an Artist
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-neutral-600">Documentation (Coming Soon)</span>
              </li>
              <li>
                <span className="text-sm text-neutral-600">API (Coming Soon)</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-neutral-600">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-neutral-600">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
          <p className="text-sm text-neutral-600">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
