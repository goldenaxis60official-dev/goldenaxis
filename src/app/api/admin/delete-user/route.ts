import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StaffRole = "admin" | "leader" | "support";

type BasicProfile = {
  id: string;
  role: string | null;
  status: string | null;
  referred_by: string | null;
};

function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "admin" || role === "leader" || role === "support";
}

function isScopedStaff(role: string | null | undefined) {
  return role === "leader" || role === "support";
}

function canReachTargetInReferralTree(
  allProfiles: BasicProfile[],
  requesterId: string,
  targetUserId: string
) {
  const childrenByParent = new Map<string, BasicProfile[]>();

  allProfiles.forEach((profile) => {
    if (!profile.referred_by) return;

    const current = childrenByParent.get(profile.referred_by) || [];
    current.push(profile);
    childrenByParent.set(profile.referred_by, current);
  });

  const queue = [...(childrenByParent.get(requesterId) || [])];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current.id)) continue;

    visited.add(current.id);

    if (current.id === targetUserId) {
      return true;
    }

    queue.push(...(childrenByParent.get(current.id) || []));
  }

  return false;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing staff session token." },
      { status: 401 }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: requester },
    error: requesterError,
  } = await adminClient.auth.getUser(accessToken);

  if (requesterError || !requester) {
    return NextResponse.json(
      { error: "Invalid staff session." },
      { status: 401 }
    );
  }

  const { data: requesterProfile, error: requesterProfileError } =
    await adminClient
      .from("profiles")
      .select("role, status")
      .eq("id", requester.id)
      .maybeSingle();

  if (
    requesterProfileError ||
    !requesterProfile ||
    requesterProfile.status === "deleted"
  ) {
    return NextResponse.json(
      { error: "Staff profile not found." },
      { status: 403 }
    );
  }

  const requesterRole = requesterProfile.role;

  if (!isStaffRole(requesterRole)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await request.json();
  const userId = String(body.userId || "");

  if (!userId) {
    return NextResponse.json({ error: "User is required." }, { status: 400 });
  }

  if (userId === requester.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from("profiles")
    .select("id, role, status, referred_by")
    .eq("id", userId)
    .maybeSingle();

  if (
    targetProfileError ||
    !targetProfile ||
    targetProfile.status === "deleted"
  ) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetProfile.role !== "user") {
    return NextResponse.json(
      { error: "Only normal user accounts can be deleted." },
      { status: 403 }
    );
  }

  if (isScopedStaff(requesterRole)) {
    const { data: allProfiles, error: allProfilesError } = await adminClient
      .from("profiles")
      .select("id, role, status, referred_by")
      .neq("status", "deleted");

    if (allProfilesError) {
      return NextResponse.json(
        { error: allProfilesError.message },
        { status: 500 }
      );
    }

    const canAccess = canReachTargetInReferralTree(
      (allProfiles || []) as BasicProfile[],
      requester.id,
      userId
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "You cannot delete this user." },
        { status: 403 }
      );
    }
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ status: "deleted" })
    .eq("id", userId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
    userId
  );

  if (authDeleteError) {
    return NextResponse.json(
      { error: authDeleteError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
  });
}