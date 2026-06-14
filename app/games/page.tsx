"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";
import Link from "next/link";

export default function GamesPage() {
const [games, setGames] = useState<any[]>([]);

useEffect(() => {
loadGames();
}, []);

const loadGames = async () => {
const { data, error } = await supabase
.from("games")
.select("*")
.order("game_date", { ascending: true });


if (!error) {
  setGames(data || []);
}


};

const rsvp = async (
gameId: string,
status: string
) => {
const {
data: { user },
} = await supabase.auth.getUser();


if (!user) {
  alert("Please login");
  return;
}

const { error } = await supabase
  .from("rsvps")
  .upsert({
    game_id: gameId,
    user_id: user.id,
    status,
  });

if (error) {
  alert(error.message);
} else {
  alert(`RSVP: ${status}`);
}


};

return ( <div className="max-w-3xl mx-auto px-4 py-10"> <h1 className="text-3xl font-bold text-white mb-8 text-center">
Upcoming Games </h1>

```
  {games.length === 0 ? (
    <p className="text-center text-gray-300">
      No games scheduled yet.
    </p>
  ) : (
    games.map((game) => (
      <div
        key={game.id}
        className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-5 mb-5 shadow-lg"
      >
        <h2 className="font-bold text-xl text-white mb-2">
          {game.title}
        </h2>

        <p className="text-gray-300">
          Date: {new Date(game.game_date).toLocaleString()}
        </p>

        <p className="text-gray-300 mt-1">
          Cost: ₹{game.cost}
        </p>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={() => rsvp(game.id, "yes")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
          >
            YES
          </button>

          <button
            onClick={() => rsvp(game.id, "no")}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            NO
          </button>

          <button
            onClick={() => rsvp(game.id, "maybe")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition"
          >
            MAYBE
          </button>

          <Link
            href={`/attendance/${game.id}`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition"
          >
            Attendance
          </Link>
        </div>
      </div>
    ))
  )}
</div>


);
}
