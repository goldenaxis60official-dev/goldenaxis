//app>tearms>page.tsx

"use client";

import { useState } from "react";
import LuxuryCard from "@/components/ui/LuxuryCard";
import Image from "next/image";
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
  Award,
  BadgeCheck,
  Fingerprint,
  Database,
  Sparkles,
  ZoomIn,
  X,
} from "lucide-react";

const certificates = [
  {
    title: "Internal Quality Certificate",
    image: "/certificate1.png",
    description:
      "Golden Axis 60 internal platform quality and campaign review standard.",
  },
  {
    title: "Certified Excellence Standard",
    image: "/certificate2.png",
    description:
      "Golden Axis 60 certificate reference for quality, review, and platform trust.",
  },
];

const trustBadges = [
  {
    title: "Internal Certificate",
    text: "Official Golden Axis 60 quality mark",
    icon: Award,
  },
  {
    title: "Quality Checklist",
    text: "Internal review process for campaign and wallet activity",
    icon: BadgeCheck,
  },
  {
    title: "KYC Review",
    text: "Account and wallet requests may require manual review",
    icon: Fingerprint,
  },
  {
    title: "Secure Ledger",
    text: "Wallet activity and requests are recorded for audit history",
    icon: Database,
  },
];

const sections = [
  {
    title: "Promotional Credit",
    icon: Gem,
    text: "Golden Axis 60 uses campaign credits and rewards. Displayed balances, product values, and rewards are part of the promotional task experience unless officially reviewed and approved by the platform.",
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
    text: "Deposit-credit and withdrawal balance updates are reviewed by the platform. Approved requests are recorded in the transaction ledger for transparency and audit history.",
  },
  {
    title: "Withdrawal Rule",
    icon: ShieldCheck,
    text: "Withdrawal requests become available only after the user completes all assigned active campaign missions. Requests may require account, wallet, and activity review before final approval.",
  },
  {
    title: "Team Reward Rule",
    icon: Users,
    text: "Team rewards are calculated from team member mission commission only. The standard team bonus rate is 5% of the completed mission commission and does not cascade from other team bonuses.",
  },
  {
    title: "Account Security",
    icon: Lock,
    text: "Users are responsible for protecting their login information. Balance updates, wallet history, and support replies may be recorded for transparency, security review, and audit history.",
  },
];

type Certificate = {
  title: string;
  image: string;
  description: string;
};

export default function TermsPage() {
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);

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

              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
                <ShieldCheck className="h-6 w-6 text-yellow-300" />
              </div>
            </div>

            {/* Premium Certificate Section */}
            <LuxuryCard goldGlow className="mb-5 overflow-hidden p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-200/80">
                      Verified Standard
                    </p>
                  </div>

                  <h2 className="text-xl font-black text-white">
                    Internal Platform Standard
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Golden Axis 60 uses internal quality checks, manual wallet
                    review, and ledger-based request records to support a more
                    secure promotional campaign experience.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-300/30 bg-yellow-400/10">
                  <Award className="h-6 w-6 text-yellow-300" />
                </div>
              </div>

              <div className="space-y-4">
                {certificates.map((certificate) => (
                  <button
                    key={certificate.image}
                    type="button"
                    onClick={() => setSelectedCertificate(certificate)}
                    className="w-full overflow-hidden rounded-[1.5rem] border border-yellow-300/20 bg-gradient-to-b from-white/10 to-white/[0.03] p-2 text-left shadow-[0_0_35px_rgba(250,204,21,0.08)]"
                  >
                    <div className="relative overflow-hidden rounded-[1.2rem] bg-white p-2">
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white">
                        <Image
                          src={certificate.image}
                          alt={certificate.title}
                          fill
                          className="object-contain"
                          priority={certificate.image === "/certificate1.png"}
                        />
                      </div>

                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-black/10 bg-black/65 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        <ZoomIn className="h-3.5 w-3.5 text-yellow-300" />
                        View
                      </div>
                    </div>

                    <div className="px-2 pb-2 pt-3">
                      <p className="text-sm font-black text-white">
                        {certificate.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/55">
                        {certificate.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </LuxuryCard>

            {/* Trust Badges */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              {trustBadges.map((badge) => {
                const Icon = badge.icon;

                return (
                  <div
                    key={badge.title}
                    className="rounded-[1.4rem] border border-yellow-400/15 bg-white/[0.055] p-3 backdrop-blur-xl"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-sm font-black text-white">
                      {badge.title}
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-white/50">
                      {badge.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <LuxuryCard goldGlow className="mb-5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
                <h2 className="text-lg font-black">Important Notice</h2>
              </div>

              <p className="text-sm leading-6 text-white/65">
                This platform is designed as a promotional campaign.
                It should not be presented as guaranteed income, investment
                profit, or risk-free earning. All wallet, reward, and withdrawal
                requests are subject to platform review.
              </p>
            </LuxuryCard>

            <div className="space-y-4 pb-6">
              {sections.map((item) => {
                const Icon = item.icon;

                return (
                  <LuxuryCard key={item.title} className="p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="font-black">{item.title}</h3>
                    </div>

                    <p className="text-sm leading-6 text-white/60">
                      {item.text}
                    </p>
                  </LuxuryCard>
                );
              })}
            </div>
          </section>

          {/* Certificate Fullscreen Viewer */}
          {selectedCertificate && (
            <div className="fixed inset-0 z-50 bg-black/90 px-4 py-6 backdrop-blur-xl">
              <div className="mx-auto flex h-full max-w-md flex-col">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-200/70">
                      Certificate Preview
                    </p>
                    <h2 className="text-lg font-black text-white">
                      {selectedCertificate.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCertificate(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="relative flex-1 overflow-hidden rounded-[1.5rem] border border-yellow-300/20 bg-white p-3">
                  <Image
                    src={selectedCertificate.image}
                    alt={selectedCertificate.title}
                    fill
                    className="object-contain p-3"
                  />
                </div>

                <p className="mt-4 rounded-2xl border border-yellow-300/15 bg-yellow-400/10 px-4 py-3 text-center text-xs leading-5 text-yellow-50/70">
                  {selectedCertificate.description}
                </p>
              </div>
            </div>
          )}
        </AppShell>
      )}
    </RequireAuth>
  );
}