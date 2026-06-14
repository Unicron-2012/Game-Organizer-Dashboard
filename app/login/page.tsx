"use client";

import { useState } from "react";
import { supabase } from "../../src/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email,
    });
  }

  alert("Account created!");
};

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <h1 className="text-2xl font-bold">Group Organizer</h1>

      <input
        className="border p-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={signIn}
        className="bg-blue-600 text-white p-2 rounded"
      >
        Login
      </button>

      <button
        onClick={signUp}
        className="bg-green-600 text-white p-2 rounded"
      >
        Sign Up
      </button>
    </div>
  );
}