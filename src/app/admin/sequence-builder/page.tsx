"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";
import {
  Crown,
  AlertCircle,
  CheckCircle,
  WandSparkles,
  ShieldCheck,
} from "lucide-react";

type GeneratedTask = {
  step_number: number;
  title: string;
  category: string;
  price: number;
  commission_rate: number;
  task_type: "standard" | "lucky_bonus";
  multiplier: number;
  image_url: string | null;
  video_url: string | null;
  rating_label_1: string;
  rating_label_2: string;
  description: string;
  is_active: boolean;
};

const productNames = [
  "Royal Gold Ring Campaign",
  "Luxury Watch Promotion",
  "Golden Bracelet Showcase",
  "Emerald Necklace Campaign",
  "Platinum Crown Collection",
  "Sapphire Ring Campaign",
  "Golden Axis Limited Watch",
  "Ruby Jewel Showcase",
  "Diamond Pendant Campaign",
  "Premium Gold Bar Promotion",
];

const luckyNames = [
  "Diamond Jewel Lucky Bonus",
  "Royal Crown 2x Bonus",
  "Golden Treasure Lucky Campaign",
  "VIP Diamond Vault Bonus",
  "Sapphire Crown Special Bonus",
];

function parseLuckySlots(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num > 0);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export default function SequenceBuilderPage() {
  return (
    <RequireAuth>
      {(profile) => <SequenceBuilderContent profile={profile} />}
    </RequireAuth>
  );
}

function SequenceBuilderContent({ profile }: { profile: Profile }) {
  const [totalTasks, setTotalTasks] = useState(80);
  const [startingPrice, setStartingPrice] = useState(10);
  const [increaseRate, setIncreaseRate] = useState(5);
  const [commissionRate, setCommissionRate] = useState(0.0008);
  const [luckySlots, setLuckySlots] = useState("4,14,26,42,60");
  const [luckyMultiplier, setLuckyMultiplier] = useState(2);
  const [categoryTheme, setCategoryTheme] = useState("Mixed Luxury");
  const [videoUrl, setVideoUrl] = useState("");

  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = profile.role === "admin";

  const generatedTasks = useMemo<GeneratedTask[]>(() => {
    const slots = parseLuckySlots(luckySlots);
    const tasks: GeneratedTask[] = [];

    let price = startingPrice;

    for (let step = 1; step <= totalTasks; step++) {
      const isLucky = slots.includes(step);
      const normalName = productNames[(step - 1) % productNames.length];
      const luckyName = luckyNames[(step - 1) % luckyNames.length];

      const category = isLucky
        ? "Diamond"
        : categoryTheme === "Mixed Luxury"
        ? ["Gold", "Jewelry", "Luxury Watch", "Sapphire", "Ruby"][
            (step - 1) % 5
          ]
        : categoryTheme;

      tasks.push({
        step_number: step,
        title: isLucky ? luckyName : normalName,
        category,
        price: roundMoney(price),
        commission_rate: commissionRate,
        task_type: isLucky ? "lucky_bonus" : "standard",
        multiplier: isLucky ? luckyMultiplier : 1,
        image_url: null,
        video_url: isLucky && videoUrl ? videoUrl : null,
        rating_label_1: isLucky ? "Bonus Value" : "Craft Quality",
        rating_label_2: isLucky ? "Lucky Multiplier" : "Campaign Value",
        description: isLucky
          ? "A premium Lucky Jewel campaign with bonus multiplier reward."
          : "Complete this luxury campaign mission to earn promotional reward.",
        is_active: true,
      });

      price = price * (1 + increaseRate / 100);
    }

    return tasks;
  }, [
    totalTasks,
    startingPrice,
    increaseRate,
    commissionRate,
    luckySlots,
    luckyMultiplier,
    categoryTheme,
    videoUrl,
  ]);

  async function handleSaveSequence() {
    setSaving(true);
    setErrorText("");
    setSuccessText("");

    const { error } = await supabase.from("tasks").upsert(generatedTasks, {
      onConflict: "step_number",
    });

    if (error) {
      setErrorText(error.message);
      setSaving(false);
      return;
    }

    setSuccessText(
      `${generatedTasks.length} tasks generated and saved successfully.`
    );
    setSaving(false);
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <section className="px-5 pt-8">
          <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h1 className="text-2xl font-black">Admin Access Required</h1>
            <p className="mt-2 text-sm text-white/55">
              This builder is only available for admin accounts.
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-200/80">Admin Tool</p>
            <h1 className="text-2xl font-black">Sequence Builder</h1>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
            <Crown className="h-6 w-6 text-yellow-300" />
          </div>
        </div>

        <div className="mb-5 rounded-[2rem] border border-yellow-400/20 bg-white/[0.06] p-5 backdrop-blur-xl">
          <h2 className="text-xl font-black">Generate Mission Ladder</h2>
          <p className="mt-2 text-sm text-white/55">
            Create the full luxury campaign task sequence instantly. Existing
            tasks with the same step number will be updated.
          </p>
        </div>

        <div className="mb-5 space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <InputField
            label="Total Tasks"
            value={totalTasks}
            onChange={setTotalTasks}
          />

          <InputField
            label="Starting Price"
            value={startingPrice}
            onChange={setStartingPrice}
          />

          <InputField
            label="Price Increase Rate %"
            value={increaseRate}
            onChange={setIncreaseRate}
          />

          <InputField
            label="Commission Rate"
            value={commissionRate}
            onChange={setCommissionRate}
            step="0.0001"
          />

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Lucky Bonus Slots
            </p>
            <input
              value={luckySlots}
              onChange={(e) => setLuckySlots(e.target.value)}
              placeholder="4,14,26,42,60"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>

          <InputField
            label="Lucky Multiplier"
            value={luckyMultiplier}
            onChange={setLuckyMultiplier}
            step="0.1"
          />

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Category Theme
            </p>
            <select
              value={categoryTheme}
              onChange={(e) => setCategoryTheme(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
            >
              <option>Mixed Luxury</option>
              <option>Gold</option>
              <option>Jewelry</option>
              <option>Diamond</option>
              <option>Luxury Watch</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-white/80">
              Lucky Bonus Video URL Optional
            </p>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
            />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatBox label="Tasks" value={String(generatedTasks.length)} />
          <StatBox
            label="Lucky"
            value={String(
              generatedTasks.filter((task) => task.task_type === "lucky_bonus")
                .length
            )}
          />
          <StatBox
            label="Final Price"
            value={`$${Number(
              generatedTasks[generatedTasks.length - 1]?.price || 0
            ).toFixed(2)}`}
          />
        </div>

        {successText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            {successText}
          </div>
        )}

        {errorText && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        <button
          onClick={handleSaveSequence}
          disabled={saving}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-600 px-5 py-4 font-black text-black disabled:opacity-60"
        >
          <WandSparkles className="h-5 w-5" />
          {saving ? "Saving Sequence..." : "Save Generated Sequence"}
        </button>

        <div className="space-y-3 pb-6">
          {generatedTasks.slice(0, 12).map((task) => {
            const lucky = task.task_type === "lucky_bonus";
            const reward =
              task.price * task.commission_rate * task.multiplier;

            return (
              <div
                key={task.step_number}
                className={`rounded-[1.5rem] border p-4 ${
                  lucky
                    ? "border-yellow-400/40 bg-yellow-400/10"
                    : "border-white/10 bg-white/[0.05]"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      lucky
                        ? "bg-yellow-300 text-black"
                        : "bg-white/10 text-white/65"
                    }`}
                  >
                    {lucky ? "Lucky Bonus" : "Standard"}
                  </span>

                  <span className="text-sm text-white/50">
                    Step {task.step_number}
                  </span>
                </div>

                <h3 className="font-black">{task.title}</h3>

                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl bg-black/30 p-2">
                    <p className="text-[11px] text-white/40">Price</p>
                    <p className="font-bold">${task.price.toFixed(2)}</p>
                  </div>

                  <div className="rounded-xl bg-black/30 p-2">
                    <p className="text-[11px] text-white/40">Reward</p>
                    <p className="font-bold text-yellow-300">
                      ${reward.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/30 p-2">
                    <p className="text-[11px] text-white/40">Multi</p>
                    <p className="font-bold text-blue-300">
                      {task.multiplier}x
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {generatedTasks.length > 12 && (
            <p className="text-center text-sm text-white/45">
              Preview showing first 12 tasks only.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function InputField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white/80">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        type="number"
        step={step}
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-yellow-400/50"
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-bold text-yellow-300">{value}</p>
    </div>
  );
}