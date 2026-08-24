//src>app>privacy>page.tsx

"use client";

import AppShell from "@/components/layout/AppShell";
import LuxuryCard from "@/components/ui/LuxuryCard";
import { ShieldCheck, Eye, Lock, Database, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <AppShell>
      <section className="px-5 pb-32 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Platform Policy</p>
            <h1 className="text-2xl font-black">Privacy Policy</h1>
          </div>
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
            <ShieldCheck className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="space-y-4 pb-6">
          <LuxuryCard className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="font-black">Data Collection</h3>
            </div>
            <p className="text-sm leading-6 text-white/60">
              We collect basic account information (such as your withdrawal addresses and activity records) strictly to provide and secure our promotional task simulation services.
            </p>
          </LuxuryCard>

          <LuxuryCard className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-black">Data Usage</h3>
            </div>
            <p className="text-sm leading-6 text-white/60">
              Your data is used exclusively to manage campaign records, verify task completion, process wallet requests, and provide customer support. We do not sell your personal data.
            </p>
          </LuxuryCard>

          <LuxuryCard className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-black">Security</h3>
            </div>
            <p className="text-sm leading-6 text-white/60">
              We implement encrypted ledgers and strict security on our databases to protect your personal information and transaction records from unauthorized access.
            </p>
          </LuxuryCard>
          
          <LuxuryCard className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-black">Contact Us</h3>
            </div>
            <p className="text-sm leading-6 text-white/60">
              If you have questions about your privacy or data, please contact our support team at support@goldenaxis60.company.
            </p>
          </LuxuryCard>
        </div>
      </section>
    </AppShell>
  );
}