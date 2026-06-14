"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../src/lib/supabase";

export default function MembersPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [members, setMembers] = useState<any[]>([]);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: roleData } = await supabase
        .from("memberships")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      setMyRole(roleData?.role || "");
    }

    const { data, error } = await supabase
      .from("memberships")
      .select("id, role, user_id")
      .eq("group_id", groupId);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const userIds = data?.map((m) => m.user_id) || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const merged = data.map((m) => ({
      ...m,
      profiles: profiles?.find((p) => p.id === m.user_id),
    }));

    setMembers(merged);
    setLoading(false);
  };

  const updateRole = async (membershipId: string, role: string) => {
    const { error } = await supabase
      .from("memberships")
      .update({ role })
      .eq("id", membershipId);

    if (error) {
      alert(error.message);
      return;
    }

    loadMembers();
  };

  const removeMember = async (membershipId: string) => {
    const confirmed = window.confirm("Remove this member?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("id", membershipId);

    if (error) {
      alert(error.message);
      return;
    }

    loadMembers();
  };

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Group Members</h1>

      {loading ? (
        <p>Loading...</p>
      ) : members.length === 0 ? (
        <p>No members found.</p>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {member.profiles?.name ||
                      member.profiles?.email ||
                      "Unknown User"}
                  </p>

                  <p className="text-sm text-gray-400">
                    {member.profiles?.email}
                  </p>
                </div>

                <span className="px-3 py-1 rounded bg-blue-600 text-sm">
                  {member.role}
                </span>
              </div>

              {myRole === "organizer" &&
                member.role !== "organizer" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() =>
                        updateRole(member.id, "co-organizer")
                      }
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                    >
                      Promote
                    </button>

                    <button
                      onClick={() =>
                        updateRole(member.id, "member")
                      }
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                    >
                      Demote
                    </button>

                    <button
                      onClick={() => removeMember(member.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}