"use client";

import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminNav from "../AdminNav";
import type { Profile } from "@/types/profile";
import {
  AlertTriangle,
  ClipboardList,
  Crown,
  Gem,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function SequenceBuilderPage() {
  return (
    <RequireAuth>
      {(profile) => <SequenceBuilderContent profile={profile} />}
    </RequireAuth>
  );
}

function SequenceBuilderContent({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin";

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050505] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-2xl font-black">Admin Access Required</h1>
          <p className="mt-2 text-sm text-white/55">
            This page is only available for admin accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AdminNav />

        <div className="mb-8 flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-yellow-200/80">
              Admin Control
            </p>
            <h1 className="mt-1 text-3xl font-black">Sequence Builder</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              This legacy generator has been disabled because Golden Axis 60 now
              uses product catalog, task library, and per-user task assignment.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
            <Crown className="h-7 w-7 text-yellow-300" />
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-red-400/30 bg-red-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-red-500/15 p-3 text-red-300">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-red-200">
                Legacy Generator Disabled
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-100/70">
                The old sequence builder created hardcoded products like luxury
                watches, rings, and bonus tasks directly inside the task table.
                That can overwrite or conflict with the new product-based task
                system. Use the new workflow below instead.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-5">
            <p className="text-sm text-yellow-200/80">Correct Workflow</p>
            <h2 className="text-2xl font-black">Golden Axis 60 Task System</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <WorkflowCard
              icon={Gem}
              title="1. Create Products"
              description="Add gold or jewel products with photos, price, rating, reviews, and description."
              href="/admin/products"
              button="Open Products"
            />

            <WorkflowCard
              icon={ClipboardList}
              title="2. Build Task Library"
              description="Connect products to task templates and set commission, multiplier, and task type."
              href="/admin/tasks"
              button="Open Task Library"
            />

            <WorkflowCard
              icon={ListChecks}
              title="3. Assign User Tasks"
              description="Assign each user a custom mission list from minimum 1 task to maximum tasks."
              href="/admin/user-tasks"
              button="Open User Tasks"
            />
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-300">
              <Users className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-xl font-black">Recommended Admin Flow</h3>
              <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                Do not generate default 80 tasks for every user. Instead, create
                product-backed task templates and assign a custom list to each
                individual user. This keeps admin in control and keeps the user
                experience personalized.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkflowCard({
  icon: Icon,
  title,
  description,
  href,
  button,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 min-h-[72px] text-sm leading-6 text-white/50">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 flex w-full items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-300 hover:bg-yellow-400/15"
      >
        {button}
      </Link>
    </div>
  );
}