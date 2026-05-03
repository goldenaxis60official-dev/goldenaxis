// app/team/page.tsx

"use client";

import { getLanguage, messages } from "@/i18n";
import LuxuryCard from "@/components/ui/LuxuryCard";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Users,
  Copy,
  Gift,
  AlertCircle,
  CheckCircle,
  Crown,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";

type TeamSummary = {
  team_id: string;
  team_code: string;
  team_name: string | null;
  team_count: number;
  total_reward: number;
  user_role: string;
};

type TeamReward = {
  id: string;
  base_commission: number;
  team_rate: number;
  reward_amount: number;
  created_at: string;
  earner_id: string;
};

type TeamSearchResult = {
  team_id: string;
  team_code: string;
  team_name: string | null;
  member_count: number;
};

export default function TeamPage() {
  return (
    <RequireAuth>
      {(profile) => <TeamContent profile={profile} />}
    </RequireAuth>
  );
}

function TeamContent({ profile }: { profile: Profile }) {
  const lang = getLanguage(profile.language);
  const t = messages[lang];
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [rewards, setRewards] = useState<TeamReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [teamNameInput, setTeamNameInput] = useState("");
  const [searchCodeInput, setSearchCodeInput] = useState("");
  const [foundTeam, setFoundTeam] = useState<TeamSearchResult | null>(null);

  async function loadTeam() {
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const { data: summaryData, error: summaryError } = await supabase.rpc(
      "get_my_team_summary"
    );

    if (summaryError) {
      setErrorText(summaryError.message);
      setLoading(false);
      return;
    }

    const row = Array.isArray(summaryData) ? summaryData[0] : summaryData;
    const currentSummary = (row || null) as TeamSummary | null;

    setSummary(currentSummary);

    if (currentSummary?.team_code) {
      setTeamCodeInput(currentSummary.team_code);
      setTeamNameInput(currentSummary.team_name || "");
    }

    const { data: rewardData, error: rewardError } = await supabase
      .from("team_rewards")
      .select(
        "id, base_commission, team_rate, reward_amount, created_at, earner_id"
      )
      .eq("receiver_id", profile.id)
      .order("created_at", { ascending: false });

    if (rewardError) {
      setErrorText(rewardError.message);
      setLoading(false);
      return;
    }

    setRewards((rewardData || []) as TeamReward[]);
    setLoading(false);
  }

  useEffect(() => {
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  async function copyTeamCode() {
    if (!summary?.team_code) return;

    await navigator.clipboard.writeText(summary.team_code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  async function createOrUpdateTeam() {
    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    const { error } = await supabase.rpc("create_or_update_my_team", {
      _team_code: teamCodeInput,
      _team_name: teamNameInput || null,
    });

    if (error) {
      setErrorText(error.message);
      setActionLoading(false);
      return;
    }

    setSuccessText(summary ? t.team.teamCodeUpdated : t.team.teamCreated);
    setActionLoading(false);
    await loadTeam();
  }

  async function searchTeam() {
    setActionLoading(true);
    setErrorText("");
    setSuccessText("");
    setFoundTeam(null);

    const { data, error } = await supabase.rpc("search_team_by_code", {
      _team_code: searchCodeInput,
    });

    if (error) {
      setErrorText(error.message);
      setActionLoading(false);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      setErrorText(t.team.teamCodeNotFound);
      setActionLoading(false);
      return;
    }

    setFoundTeam(row as TeamSearchResult);
    setActionLoading(false);
  }

  async function joinTeam() {
    if (!foundTeam?.team_code) return;

    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    const { error } = await supabase.rpc("join_team_by_code", {
      _team_code: foundTeam.team_code,
    });

    if (error) {
      setErrorText(error.message);
      setActionLoading(false);
      return;
    }

    setSuccessText(t.team.teamJoinedSuccessfully);
    setFoundTeam(null);
    setSearchCodeInput("");
    setActionLoading(false);
    await loadTeam();
  }

  const totalReward = Number(summary?.total_reward || 0);
  const teamCount = Number(summary?.team_count || 0);
  const isOwner = summary?.user_role === "owner";

  return (
    <AppShell>
      <section className="px-5 pb-32 pt-8">
                <LuxuryCard goldGlow className="mb-5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                <p className="text-xs font-bold text-emerald-200">
                  {t.team.teamCenter}
                </p>
              </div>

              <h1 className="text-2xl font-black">{t.team.teamCode}</h1>

              <p className="mt-1 text-xs leading-5 text-white/45">
  {summary ? t.team.bonusExplanation : t.team.joinExistingTeamNote}
</p>
            </div>

            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 shadow-[0_0_25px_rgba(234,179,8,0.18)]">
              <Users className="h-6 w-6 text-yellow-300" />
            </div>
          </div>
        </LuxuryCard>

        {loading && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-center text-white/60">
            {t.team.loadingDashboard}
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {successText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {!loading && (
          <>
            {summary ? (
              <>
                <LuxuryCard goldGlow className="mb-5 overflow-hidden p-0">
                  <div className="p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/50">{t.team.yourTeamCode}</p>
                        <h2 className="mt-1 text-4xl font-black tracking-wide text-yellow-300">
                          {summary.team_code}
                        </h2>
                        <p className="mt-1 text-sm text-white/45">
                          {summary.team_name || t.team.goldenTeam}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-3 text-black">
                        <Crown className="h-7 w-7" />
                      </div>
                    </div>

                    <button
                      onClick={copyTeamCode}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98]"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          {t.team.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5" />
                          {t.team.copyTeamCode}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-yellow-400/10 bg-yellow-400/10 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
                      <p className="text-sm leading-6 text-yellow-100/80">
                        {t.team.bonusExplanation}
                      </p>
                    </div>
                  </div>
                </LuxuryCard>

                <div className="mb-5 grid grid-cols-3 gap-3">
  <StatCard label={t.team.teamSize} value={String(teamCount)} color="blue" />

<StatCard label={t.team.teamBonus} value="5%" color="gold" />

<StatCard
  label={t.team.reward}
  value={`$${totalReward.toFixed(2)}`}
  color="green"
/>
</div>

                {isOwner && (
                  <LuxuryCard goldGlow className="mb-5 p-4">
                    <h2 className="mb-3 font-black">{t.team.customizeTeam}</h2>

                    <div className="space-y-3">
                      <input
                        value={teamNameInput}
                        onChange={(e) => setTeamNameInput(e.target.value)}
                        placeholder={t.team.teamNamePlaceholder}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                      />

                      <input
                        value={teamCodeInput}
                        onChange={(e) =>
                          setTeamCodeInput(e.target.value.toUpperCase())
                        }
                        placeholder={t.team.teamCodePlaceholder}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold uppercase tracking-wide text-yellow-300 outline-none placeholder:text-white/35"
                      />

                      <button
                        onClick={createOrUpdateTeam}
                        disabled={actionLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 font-bold text-yellow-200 active:scale-[0.98] disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {t.team.updateTeamCode}
                      </button>
                    </div>
                  </LuxuryCard>
                )}

                <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100/80">
                  {t.team.noLoopNote}
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-black">{t.team.teamBonusLedger}</h2>
                  <span className="text-xs text-yellow-300">
                    {rewards.length} {t.team.records}
                  </span>
                </div>

                {rewards.length === 0 && (
                  <LuxuryCard className="p-6 text-center">
                    <Gift className="mx-auto mb-3 h-9 w-9 text-yellow-300" />
                    <p className="font-bold">{t.team.noBonusesYet}</p>
                    <p className="mt-2 text-sm text-white/50">
                      {t.team.noBonusesNote}
                    </p>
                  </LuxuryCard>
                )}

                <div className="space-y-4 pb-6">
                  {rewards.map((item) => (
                    <LuxuryCard key={item.id} className="p-4">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                            <Gift className="h-6 w-6" />
                          </div>

                          <div>
                            <h3 className="font-black">{t.team.teamBonusReward}</h3>
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
                          <p className="text-xs text-white/45">
                            {t.team.baseCommission}
                          </p>
                          <p className="mt-1 font-bold text-white/70">
                            ${Number(item.base_commission).toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/30 p-3">
                          <p className="text-xs text-white/45">{t.team.teamRate}</p>
                          <p className="mt-1 font-bold text-yellow-300">
                            {(Number(item.team_rate) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </LuxuryCard>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <LuxuryCard goldGlow className="p-4">
                  <h2 className="mb-2 text-xl font-black">{t.team.createMyTeam}</h2>
                  <p className="mb-3 text-sm leading-6 text-white/55">
                    {t.team.createMyTeamNote}
                  </p>

                  <div className="space-y-3">
                    <input
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder={t.team.teamNamePlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    />

                    <input
                      value={teamCodeInput}
                      onChange={(e) =>
                        setTeamCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder={t.team.customTeamCodePlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold uppercase tracking-wide text-yellow-300 outline-none placeholder:text-white/35"
                    />

                    <button
                      onClick={createOrUpdateTeam}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-4 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                      {t.team.createTeam}
                    </button>
                  </div>
                </LuxuryCard>

                <LuxuryCard className="p-4">
                  <h2 className="mb-2 text-xl font-black">{t.team.joinExistingTeam}</h2>
                  <p className="mb-4 text-sm leading-6 text-white/55">
                    {t.team.joinExistingTeamNote}
                  </p>

                  <div className="space-y-3">
                    <input
                      value={searchCodeInput}
                      onChange={(e) =>
                        setSearchCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder={t.team.searchTeamCodePlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold uppercase tracking-wide text-yellow-300 outline-none placeholder:text-white/35"
                    />

                    <button
                      onClick={searchTeam}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400/10 px-5 py-4 font-black text-yellow-200 disabled:opacity-50"
                    >
                      <Search className="h-5 w-5" />
                      {t.team.searchTeam}
                    </button>
                  </div>

                  {foundTeam && (
                    <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                      <p className="text-xs text-white/45">{t.team.foundTeam}</p>
                      <h3 className="mt-1 text-xl font-black text-yellow-300">
                        {foundTeam.team_code}
                      </h3>
                      <p className="mt-1 text-sm text-white/60">
                        {foundTeam.team_name || t.team.goldenTeam} •{" "}
                        {foundTeam.member_count} {t.team.members}
                      </p>

                      <button
                        onClick={joinTeam}
                        disabled={actionLoading}
                        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 px-5 py-3 font-black text-black shadow-[0_12px_32px_rgba(234,179,8,0.28)] active:scale-[0.98] disabled:opacity-50"
                      >
                        {t.team.joinTeam}
                      </button>
                    </div>
                  )}
                </LuxuryCard>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}