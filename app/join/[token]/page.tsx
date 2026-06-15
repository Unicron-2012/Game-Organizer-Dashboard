"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token as string;

  const [message, setMessage] = useState("Checking invite...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    joinGroup();
  }, []);

  async function joinGroup() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // ❌ Not logged in → show auth options
    if (!user) {
      setMessage("You need to login or sign up to join this group.");
      setLoading(false);
      return;
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      setMessage("Invalid or expired invite link.");
      setLoading(false);
      return;
    }

    // Prevent duplicate join
    const { data: existing } = await supabase
      .from("memberships")
      .select("*")
      .eq("group_id", invite.group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setMessage("You are already part of this group.");
      setLoading(false);

      setTimeout(() => {
        router.push(`/groups/${invite.group_id}/members`);
      }, 1200);

      return;
    }

    // Insert membership
    const { error } = await supabase.from("memberships").insert({
      group_id: invite.group_id,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Successfully joined the group 🎉");

    setTimeout(() => {
      router.push(`/groups/${invite.group_id}/members`);
    }, 1200);
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full text-center">

        <h1 className="text-2xl font-bold mb-4">
          Group Invitation
        </h1>

        <p className="text-gray-300 mb-6">
          {message}
        </p>

        {/* LOGIN OPTIONS */}
        {!loading && message.includes("login") && (
          <div className="flex flex-col gap-3">
            <button
              onClick={loginWithGoogle}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Continue with Google
            </button>

            <button
              onClick={() => router.push("/login")}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            >
              Go to Login Page
            </button>
          </div>
        )}

      </div>
    </div>
  );
}