"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../src/lib/supabase";

export default function GroupCard({
group,
role,
onGenerateInvite,
}: {
group: any;
role?: string;
onGenerateInvite: () => void;
}) {
const [title, setTitle] = useState("");
const [gameDate, setGameDate] = useState("");
const [cost, setCost] = useState("");

const createGame = async () => {
if (!title || !gameDate) {
alert("Please fill all required fields");
return;
}


const { error } = await supabase
  .from("games")
  .insert({
    group_id: group.id,
    title,
    game_date: gameDate,
    cost: Number(cost || 0),
  });

if (error) {
  alert(error.message);
  return;
}

alert("Game created!");

setTitle("");
setGameDate("");
setCost("");


};

const getRoleColor = () => {
switch (role) {
case "organizer":
return "bg-green-600";
case "co-organizer":
return "bg-yellow-600";
default:
return "bg-blue-600";
}
};

return ( <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg p-5 text-white">

```
  {/* Header */}
  <div className="flex items-start justify-between">
    <h3 className="text-xl font-bold">
      {group.name}
    </h3>

    <span
      className={`text-xs px-2 py-1 rounded ${getRoleColor()}`}
    >
      {role || "member"}
    </span>
  </div>

  {/* Sport */}
  <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
    {group.sport}
  </span>

  {/* Navigation Buttons */}
  <div className="grid grid-cols-2 gap-2 mt-4">
    <Link
      href={`/groups/${group.id}/members`}
      className="bg-indigo-600 hover:bg-indigo-700 text-center py-2 rounded-md text-sm"
    >
      Members
    </Link>

    <Link
      href={`/games?groupId=${group.id}`}
      className="bg-purple-600 hover:bg-purple-700 text-center py-2 rounded-md text-sm"
    >
      Games
    </Link>
  </div>

  {/* Invite */}
  <button
    onClick={onGenerateInvite}
    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
  >
    Generate Invite Link
  </button>

  {/* Create Game */}
  <div className="mt-5 border-t border-gray-700 pt-4">
    <h4 className="font-semibold mb-3">
      Create New Game
    </h4>

    <div className="flex flex-col gap-3">
      <input
        className="bg-gray-800 border border-gray-600 rounded-md p-2"
        placeholder="Game Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
      />

      <input
        type="datetime-local"
        className="bg-gray-800 border border-gray-600 rounded-md p-2"
        value={gameDate}
        onChange={(e) =>
          setGameDate(e.target.value)
        }
      />

      <input
        type="number"
        className="bg-gray-800 border border-gray-600 rounded-md p-2"
        placeholder="Cost"
        value={cost}
        onChange={(e) =>
          setCost(e.target.value)
        }
      />

      <button
        onClick={createGame}
        className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md"
      >
        Create Game
      </button>
    </div>
  </div>
</div>


);
}
