"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

export default function JoinGroupPage() {
  const params = useParams();
  const token = params.token as string;

  const [message, setMessage] = useState("Joining group...");

  useEffect(() => {
    joinGroup();
  }, []);

  async function joinGroup() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage("Please login first to join the group.");
      return;
    }

    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      setMessage("Invalid or expired invite link.");
      return;
    }

    // check duplicate membership
    const { data: existing } = await supabase
      .from("memberships")
      .select("*")
      .eq("group_id", invite.group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setMessage("You are already part of this group.");
      return;
    }

    const { error } = await supabase
      .from("memberships")
      .insert({
        group_id: invite.group_id,
        user_id: user.id,
        role: "member",
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Successfully joined the group 🎉");
  }

  return (
    <div className="max-w-md mx-auto mt-20 text-center text-white">
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  );
}