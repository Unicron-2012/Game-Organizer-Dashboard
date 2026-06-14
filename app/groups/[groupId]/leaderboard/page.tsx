"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../src/lib/supabase";

export default function LeaderboardPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);

    const { data: members } = await supabase
      .from("memberships")
      .select(`
        user_id,
        profiles (
          name,
          email
        )
      `)
      .eq("group_id", groupId);

    const { data: games, error } = await supabase
      .from("games")
      .select("id")
      .eq("group_id", groupId);

    if (error || !games) {
      setData([]);
      setLoading(false);
      return;
    }

    const gameIds = games.map((g) => g.id);
    const totalGames = games?.length || 0;

    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("*")
      .in("game_id", gameIds);

    const leaderboard =
      (members ?? []).map((m: any) => {
        const profile = Array.isArray(m.profiles)
          ? m.profiles[0]
          : m.profiles;

        const userRsvps =
          rsvps?.filter((r) => r.user_id === m.user_id) || [];

        const attended = userRsvps.filter(
          (r) => r.status === "yes"
        ).length;

        const percentage =
          totalGames === 0
            ? 0
            : Math.round((attended / totalGames) * 100);

        return {
          name: profile?.name || profile?.email || "Unknown",
          attended,
          totalGames,
          percentage,
        };
      }) || [];

    leaderboard.sort((a, b) => b.percentage - a.percentage);

    setData(leaderboard);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-white">
      <h1 className="text-3xl font-bold text-center mb-8">
        Attendance Leaderboard
      </h1>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-300">
          No data available
        </p>
      ) : (
        <div className="space-y-4">
          {data.map((user, index) => (
            <div
              key={index}
              className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">
                  #{index + 1} {user.name}
                </p>
                <p className="text-sm text-gray-400">
                  {user.attended}/{user.totalGames} games attended
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {user.percentage}%
                </p>
                <p className="text-xs text-gray-400">
                  attendance
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}