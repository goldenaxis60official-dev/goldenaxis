"use client";

import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import {
  ShieldCheck,
  FileText,
  Gem,
  Wallet,
  Users,
  Lock,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

const sections = [
  {
    title: "Promotional Credit Simulation",
    icon: Gem,
    text: "Golden Axis 60 uses campaign credits and simulation rewards inside the platform. Displayed balances, product values, and rewards are part of the promotional task experience unless officially reviewed and approved by the platform.",
  },
  {
    title: "Assigned Mission Rule",
    icon: ClipboardList,
    text: "Each user receives a personalized campaign mission list assigned by the platform. A campaign list can contain a minimum of 1 mission and a maximum of 80 missions. Missions must be completed in order.",
  },
  {
    title: "Mission Sequence Rule",
    icon: FileText,
    text: "Users complete assigned campaign missions step by step. Future missions remain locked until previous assigned missions are completed. If no missions are assigned yet, the campaign list may show as preparing.",
  },
  {
    title: "Lucky Bonus Rule",
    icon: Gem,
    text: "Lucky Bonus missions are premium jewel campaign tasks with a higher reward multiplier. If the user balance is not enough, the platform may ask the user to add campaign credits before continuing.",
  },
  {
    title: "Wallet Request Rule",
    icon: Wallet,
    text: "Deposit-credit and withdrawal requests require admin review. A request status can be pending, approved, or rejected. Approved balance changes are recorded in the transaction ledger.",
  },
  {
    title: "Withdrawal Rule",
    icon: ShieldCheck,
    text: "Withdrawal requests become available only after the user completes all assigned active campaign missions. Requests are still subject to admin review and platform approval.",
  },
  {
    title: "Referral Rule",
    icon: Users,
    text: "Referral rewards are calculated from referral task commission only. There is no automatic signup bonus. The standard team reward rate is 10% of the referred user's mission commission.",
  },
  {
    title: "Account Security",
    icon: Lock,
    text: "Users are responsible for protecting their login information. Admin actions, balance changes, wallet approvals, and support replies may be recorded for transparency and audit history.",
  },
];

export default function TermsPage() {
  return (
    <RequireAuth>
      {() => (
        <AppShell>
          <section className="px-5 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">Platform Policy</p>
                <h1 className="text-2xl font-black">Terms & Security</h1>
              </div>

              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
                <ShieldCheck className="h-6 w-6 text-yellow-300" />
              </div>
            </div>

            <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
                <h2 className="text-lg font-black">Important Notice</h2>
              </div>

              <p className="text-sm leading-6 text-white/65">
                This platform is designed as a promotional campaign simulation.
                It should not be presented as guaranteed income, investment
                profit, or risk-free earning. All wallet, reward, and withdrawal
                requests are subject to platform review.
              </p>
            </div>

            <div className="space-y-4 pb-6">
              {sections.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="font-black">{item.title}</h3>
                    </div>

                    <p className="text-sm leading-6 text-white/60">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </AppShell>
      )}
    </RequireAuth>
  );
}