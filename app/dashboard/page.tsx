"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";
import GroupCard from "../components/GroupCard";
import LiveBackground from "../components/LiveBackground";

export default function Dashboard() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [sport, setSport] = useState("");
  const [groups, setGroups] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    totalGames: 0,
    upcomingGames: 0,
  });

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    await loadGroups(user.id);
    await loadStats(user.id);
  }

  async function loadGroups(uid: string) {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", uid);

    if (error) {
      console.error("Groups error:", error.message);
      return;
    }

    setGroups(data || []);
  }

  async function loadStats(uid: string) {
    const { data: groupsData } = await supabase
      .from("groups")
      .select("id")
      .eq("created_by", uid);

    const groupIds = groupsData?.map((g) => g.id) || [];

    if (groupIds.length === 0) {
      setStats({
        totalGroups: 0,
        totalMembers: 0,
        totalGames: 0,
        upcomingGames: 0,
      });
      return;
    }

    const { count: memberCount } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .in("group_id", groupIds);

    const { data: games } = await supabase
      .from("games")
      .select("id, game_date")
      .in("group_id", groupIds);

    const now = new Date();

    const upcoming =
      games?.filter((g) => new Date(g.game_date) > now).length || 0;

    setStats({
      totalGroups: groupIds.length,
      totalMembers: memberCount || 0,
      totalGames: games?.length || 0,
      upcomingGames: upcoming,
    });
  }

  async function createGroup() {
    if (!userId) return router.push("/login");

    if (!groupName || !sport) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("groups").insert({
      name: groupName,
      sport,
      created_by: userId,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setGroupName("");
    setSport("");

    await loadGroups(userId);
    await loadStats(userId);
  }

  async function createInvite(groupId: string) {
    const token = crypto.randomUUID();

    const { error } = await supabase.from("invites").insert({
      group_id: groupId,
      token,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const inviteLink = `${window.location.origin}/join/${token}`;

    await navigator.clipboard.writeText(inviteLink);

    alert(`Invite copied!\n\n${inviteLink}`);
  }

  return (
    <>
      <LiveBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">

        <h1 className="text-4xl font-bold text-white mb-6 text-center">
          Group Organizer Dashboard
        </h1>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/80 p-4 rounded text-center">
            <p className="text-2xl font-bold text-white">{stats.totalGroups}</p>
            <p className="text-gray-300">Groups</p>
          </div>

          <div className="bg-gray-900/80 p-4 rounded text-center">
            <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
            <p className="text-gray-300">Members</p>
          </div>

          <div className="bg-gray-900/80 p-4 rounded text-center">
            <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
            <p className="text-gray-300">Games</p>
          </div>

          <div className="bg-gray-900/80 p-4 rounded text-center">
            <p className="text-2xl font-bold text-white">{stats.upcomingGames}</p>
            <p className="text-gray-300">Upcoming</p>
          </div>
        </div>

        {/* CREATE GROUP */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl p-5 max-w-xl mx-auto mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            Create New Group
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="bg-gray-800 text-white border border-gray-600 rounded p-2"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <input
              className="bg-gray-800 text-white border border-gray-600 rounded p-2"
              placeholder="Sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            />
          </div>

          <button
            onClick={createGroup}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Create Group
          </button>
        </div>

        {/* GROUPS */}
        <h2 className="text-2xl text-white text-center mb-6">
          My Groups
        </h2>

        <div className="flex justify-center">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => (
              <div key={group.id} className="w-72">
                <GroupCard
                  group={group}
                  onGenerateInvite={() => createInvite(group.id)}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}