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
  const [userId, setUserId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    totalGames: 0,
    upcomingGames: 0,
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    await loadGroups(user.id);
    await loadStats(user.id);
  }

  // ✅ FIXED: created + joined groups merged
  async function loadGroups(uid: string) {
    // 1. Created groups
    const { data: createdGroups } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", uid);

    // 2. Joined groups
    const { data: memberships } = await supabase
      .from("memberships")
      .select("group_id, role")
      .eq("user_id", uid);

    const groupIds = memberships?.map((m) => m.group_id) || [];

    const { data: joinedGroups } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    // 3. merge both (remove duplicates)
    const allGroupsMap = new Map();

    // created groups => organizer
    createdGroups?.forEach((g) => {
      allGroupsMap.set(g.id, {
        ...g,
        role: "organizer",
      });
    });

    // joined groups => role from membership
    joinedGroups?.forEach((g) => {
      const membership = memberships?.find((m) => m.group_id === g.id);

      allGroupsMap.set(g.id, {
        ...g,
        role: membership?.role || "member",
      });
    });

    setGroups(Array.from(allGroupsMap.values()));
  }

  async function loadStats(uid: string) {
    const { data: created } = await supabase
      .from("groups")
      .select("id")
      .eq("created_by", uid);

    const { data: memberships } = await supabase
      .from("memberships")
      .select("group_id")
      .eq("user_id", uid);

    const createdIds = created?.map((g) => g.id) || [];
    const joinedIds = memberships?.map((m) => m.group_id) || [];

    const allIds = [...new Set([...createdIds, ...joinedIds])];

    if (allIds.length === 0) {
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
      .in("group_id", allIds);

    const { data: games } = await supabase
      .from("games")
      .select("id, game_date")
      .in("group_id", allIds);

    const now = new Date();

    const upcoming =
      games?.filter((g) => new Date(g.game_date) > now).length || 0;

    setStats({
      totalGroups: allIds.length,
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

    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: groupName,
        sport,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    // auto add as organizer
    await supabase.from("memberships").insert({
      group_id: data.id,
      user_id: userId,
      role: "organizer",
    });

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
        <div className="bg-gray-900/80 p-5 rounded-xl max-w-xl mx-auto mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            Create New Group
          </h2>

          <input
            className="w-full mb-2 p-2 bg-gray-800 text-white rounded"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <input
            className="w-full mb-2 p-2 bg-gray-800 text-white rounded"
            placeholder="Sport"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />

          <button
            onClick={createGroup}
            className="w-full bg-green-600 py-2 rounded text-white"
          >
            Create Group
          </button>
        </div>

        {/* GROUPS */}
        <h2 className="text-2xl text-white text-center mb-6">
          My Groups (Created + Joined)
        </h2>

        <div className="flex justify-center">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => (
              <div key={group.id} className="w-72">
                <GroupCard
                  group={group}
                  role={group.role}
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