//app>tesrms>page.tsx

"use client";

import { useState } from "react";
import { getLanguage, messages } from "@/i18n";
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

type CertificateKey = "internalQuality" | "certifiedExcellence";

const certificates: Array<{
  key: CertificateKey;
  image: string;
}> = [
  {
    key: "internalQuality",
    image: "/certificate1.png",
  },
  {
    key: "certifiedExcellence",
    image: "/certificate2.png",
  },
];

type TrustBadgeKey =
  | "internalCertificate"
  | "qualityChecklist"
  | "kycReview"
  | "secureLedger";

const trustBadges: Array<{
  key: TrustBadgeKey;
  icon: typeof Award;
}> = [
  {
    key: "internalCertificate",
    icon: Award,
  },
  {
    key: "qualityChecklist",
    icon: BadgeCheck,
  },
  {
    key: "kycReview",
    icon: Fingerprint,
  },
  {
    key: "secureLedger",
    icon: Database,
  },
];

type SectionKey =
  | "promotionalCredit"
  | "assignedMissionRule"
  | "missionSequenceRule"
  | "luckyBonusRule"
  | "walletRequestRule"
  | "withdrawalRule"
  | "teamRewardRule"
  | "accountSecurity";

const sections: Array<{
  key: SectionKey;
  icon: typeof Gem;
}> = [
  {
    key: "promotionalCredit",
    icon: Gem,
  },
  {
    key: "assignedMissionRule",
    icon: ClipboardList,
  },
  {
    key: "missionSequenceRule",
    icon: FileText,
  },
  {
    key: "luckyBonusRule",
    icon: Gem,
  },
  {
    key: "walletRequestRule",
    icon: Wallet,
  },
  {
    key: "withdrawalRule",
    icon: ShieldCheck,
  },
  {
    key: "teamRewardRule",
    icon: Users,
  },
  {
    key: "accountSecurity",
    icon: Lock,
  },
];

type Certificate = {
  key: CertificateKey;
  image: string;
};

export default function TermsPage() {
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);

  return (
    <RequireAuth>
  {(profile) => {
    const lang = getLanguage(profile.language);
    const t = messages[lang].terms;

    return (
        <AppShell>
          <section className="px-5 pb-32 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-200/80">{t.platformPolicy}</p>
                <h1 className="text-2xl font-black">{t.title}</h1>
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
                      {t.verifiedStandard}
                    </p>
                  </div>

                  <h2 className="text-xl font-black text-white">
                    {t.internalStandardTitle}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-white/55">
  {t.certificates.internalQuality.description}
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
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white">
                        <Image
                          src={certificate.image}
                          alt={t.certificates[certificate.key].title}
                          fill
                          className="object-contain"
                          priority={certificate.image === "/certificate1.png"}
                        />
                      </div>

                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-black/10 bg-black/65 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        <ZoomIn className="h-3.5 w-3.5 text-yellow-300" />
                        {t.view}
                      </div>
                    </div>

                    <div className="px-2 pb-2 pt-3">
                      <p className="text-sm font-black text-white">
                        {t.certificates[certificate.key].title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/55">
                        {t.certificates[certificate.key].description}
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
                    key={badge.key}
                    className="rounded-[1.4rem] border border-yellow-400/15 bg-white/[0.055] p-3 backdrop-blur-xl"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-sm font-black text-white">
                      {t.trustBadges[badge.key].title}
                    </h3>

                    <p className="mt-1 text-[11px] leading-4 text-white/50">
                      {t.trustBadges[badge.key].text}
                    </p>
                  </div>
                );
              })}
            </div>

            <LuxuryCard goldGlow className="mb-5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
                <h2 className="text-lg font-black">{t.importantNotice}</h2>
              </div>

              <p className="text-sm leading-6 text-white/65">
                {t.importantNoticeText}
              </p>
            </LuxuryCard>

            <div className="space-y-4 pb-6">
              {sections.map((item) => {
                const Icon = item.icon;

                return (
                  <LuxuryCard key={item.key} className="p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="font-black">{t.sections[item.key].title}</h3>
                    </div>

                    <p className="text-sm leading-6 text-white/60">
                      {t.sections[item.key].text}
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
                      {t.certificatePreview}
                    </p>
                    <h2 className="text-lg font-black text-white">
                      {t.certificates[selectedCertificate.key].title}
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
                    alt={t.certificates[selectedCertificate.key].title}
                    fill
                    className="object-contain p-3"
                  />
                </div>

                <p className="mt-4 rounded-2xl border border-yellow-300/15 bg-yellow-400/10 px-4 py-3 text-center text-xs leading-5 text-yellow-50/70">
                  {t.certificates[selectedCertificate.key].description}
                </p>
              </div>
            </div>
          )}
                </AppShell>
      );
    }}
  </RequireAuth>
  );
}