"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Copy,
  Gift,
  AlertCircle,
  CheckCircle,
  Crown,
} from "lucide-react";

type TeamSummary = {
  referral_code: string;
  team_count: number;
  total_reward: number;
};

type ReferralReward = {
  id: string;
  base_commission: number;
  referral_rate: number;
  reward_amount: number;
  created_at: string;
};

export default function TeamPage() {
  return (
    <RequireAuth>
      {() => <TeamContent />}
    </RequireAuth>
  );
}

function TeamContent() {
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadTeam() {
      setLoading(true);
      setErrorText("");

      const { data: summaryData, error: summaryError } = await supabase.rpc(
        "get_my_team_summary"
      );

      if (summaryError) {
        setErrorText(summaryError.message);
        setLoading(false);
        return;
      }

      const { data: rewardData, error: rewardError } = await supabase
        .from("referral_rewards")
        .select("id, base_commission, referral_rate, reward_amount, created_at")
        .order("created_at", { ascending: false });

      if (rewardError) {
        setErrorText(rewardError.message);
        setLoading(false);
        return;
      }

      setSummary(summaryData as TeamSummary);
      setRewards((rewardData || []) as ReferralReward[]);
      setLoading(false);
    }

    loadTeam();
  }, []);

  async function copyInviteCode() {
    if (!summary?.referral_code) return;

    await navigator.clipboard.writeText(summary.referral_code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Referral Center</p>
            <h1 className="text-2xl font-black">Team Invite</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Users className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            Loading team dashboard...
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {!loading && summary && (
          <>
            <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Your Gold Invite Code</p>
                  <h2 className="mt-1 text-4xl font-black tracking-wide text-yellow-300">
                    {summary.referral_code}
                  </h2>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
                  <Crown className="h-7 w-7" />
                </div>
              </div>

              <button
                onClick={copyInviteCode}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy Invite Code
                  </>
                )}
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-xs text-white/45">Team Size</p>
                <p className="mt-1 font-bold text-blue-300">
                  {summary.team_count}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-xs text-white/45">Rate</p>
                <p className="mt-1 font-bold text-yellow-300">10%</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-xs text-white/45">Reward</p>
                <p className="mt-1 font-bold text-emerald-300">
                  ${Number(summary.total_reward).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100/80">
              Referrers earn 10% from referral task commission only. There is no
              one-time signup bonus.
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">Team Reward Ledger</h2>
              <span className="text-xs text-yellow-300">
                {rewards.length} records
              </span>
            </div>

            {rewards.length === 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center">
                <Gift className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
                <p className="font-bold">No team rewards yet</p>
                <p className="mt-2 text-sm text-white/50">
                  Rewards appear when invited users complete missions.
                </p>
              </div>
            )}

            <div className="space-y-4 pb-6">
              {rewards.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                        <Gift className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-black">Team Commission Reward</h3>
                        <p className="mt-1 text-xs text-white/45">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="font-black text-emerald-300">
                      +${Number(item.reward_amount).toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">Base Commission</p>
                      <p className="mt-1 font-bold text-white/70">
                        ${Number(item.base_commission).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-3">
                      <p className="text-xs text-white/45">Referral Rate</p>
                      <p className="mt-1 font-bold text-yellow-300">
                        {Number(item.referral_rate) * 100}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}