//src>app>api>admin>reset-password>route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      { error: "Missing admin session token." },
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
      { error: "Invalid admin session." },
      { status: 401 }
    );
  }

  const { data: requesterProfile, error: requesterProfileError } =
    await adminClient
      .from("profiles")
      .select("role")
      .eq("id", requester.id)
      .maybeSingle();

  if (requesterProfileError || !requesterProfile) {
    return NextResponse.json(
      { error: "Admin profile not found." },
      { status: 403 }
    );
  }

  const requesterRole = requesterProfile.role;

  if (!["admin", "super", "support"].includes(requesterRole)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const body = await request.json();
  const userId = String(body.userId || "");
  const newPassword = String(body.newPassword || "");

  if (!userId) {
    return NextResponse.json({ error: "User is required." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from("profiles")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();

  if (targetProfileError || !targetProfile || targetProfile.status === "deleted") {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetProfile.role !== "user" && requesterRole !== "super") {
    return NextResponse.json(
      { error: "Only super can reset staff passwords." },
      { status: 403 }
    );
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      password: newPassword,
    }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
  });
}