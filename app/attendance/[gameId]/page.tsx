"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

export default function AttendancePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: game } = await supabase
      .from("games")
      .select("group_id")
      .eq("id", gameId)
      .single();

    if (!game) {
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase
      .from("memberships")
      .select(
        `
        *,
        profiles (
          id,
          name,
          email
        )
      `
      )
      .eq("group_id", game.group_id);

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("*")
      .eq("game_id", gameId);

    const attendanceMap: Record<string, string> = {};

    attendanceData?.forEach((row) => {
      attendanceMap[row.user_id] = row.status;
    });

    setAttendance(attendanceMap);
    setMembers(memberships || []);
    setLoading(false);
  }

  async function markAttendance(
    userId: string,
    status: string
  ) {
    const { error } = await supabase
      .from("attendance")
      .upsert(
        {
          game_id: gameId,
          user_id: userId,
          status,
        },
        {
          onConflict: "game_id,user_id",
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    setAttendance((prev) => ({
      ...prev,
      [userId]: status,
    }));
  }

  const presentCount = Object.values(attendance).filter(
    (s) => s === "present"
  ).length;

  const lateCount = Object.values(attendance).filter(
    (s) => s === "late"
  ).length;

  const absentCount = Object.values(attendance).filter(
    (s) => s === "absent"
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Attendance
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-700 p-4 rounded text-center">
          <p className="text-2xl font-bold">{presentCount}</p>
          <p>Present</p>
        </div>

        <div className="bg-yellow-600 p-4 rounded text-center">
          <p className="text-2xl font-bold">{lateCount}</p>
          <p>Late</p>
        </div>

        <div className="bg-red-700 p-4 rounded text-center">
          <p className="text-2xl font-bold">{absentCount}</p>
          <p>Absent</p>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const currentStatus =
              attendance[member.user_id];

            return (
              <div
                key={member.id}
                className="bg-gray-800 p-4 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {member.profiles?.name ||
                      "Unknown User"}
                  </p>

                  <p className="text-sm text-gray-400">
                    {member.profiles?.email}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {member.role}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      markAttendance(
                        member.user_id,
                        "present"
                      )
                    }
                    className={`px-3 py-1 rounded ${
                      currentStatus === "present"
                        ? "bg-green-500 border-2 border-white"
                        : "bg-green-700"
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() =>
                      markAttendance(
                        member.user_id,
                        "late"
                      )
                    }
                    className={`px-3 py-1 rounded ${
                      currentStatus === "late"
                        ? "bg-yellow-400 text-black border-2 border-white"
                        : "bg-yellow-600"
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() =>
                      markAttendance(
                        member.user_id,
                        "absent"
                      )
                    }
                    className={`px-3 py-1 rounded ${
                      currentStatus === "absent"
                        ? "bg-red-500 border-2 border-white"
                        : "bg-red-700"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}