"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabase";

export default function PaymentsPage() {
  const [games, setGames] = useState<any[]>([]);
  const [refs, setRefs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .order("game_date", {
        ascending: true,
      });

    setGames(data || []);
  };

  const submitPayment = async (
    gameId: string,
    amount: number
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login");
      return;
    }

    const upiRef = refs[gameId];

    if (!upiRef) {
      alert("Enter UPI reference");
      return;
    }

    const { error } = await supabase
      .from("payments")
      .insert({
        game_id: gameId,
        user_id: user.id,
        amount,
        upi_ref: upiRef,
        status: "pending",
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Payment submitted!");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">
        Payments
      </h1>

      {games.map((game) => (
        <div
          key={game.id}
          className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-5 mb-4 shadow-lg"
        >
          <h2 className="font-bold text-lg">
            {game.title}
          </h2>

          <p>
            Date:{" "}
            {new Date(
              game.game_date
            ).toLocaleString()}
          </p>

          <p>Total Cost: ₹{game.cost}</p>

          <input
            className="border p-2 rounded w-full mt-3"
            placeholder="UPI Transaction Reference"
            value={refs[game.id] || ""}
            onChange={(e) =>
              setRefs({
                ...refs,
                [game.id]: e.target.value,
              })
            }
          />

          <button
            onClick={() =>
              submitPayment(
                game.id,
                game.cost
              )
            }
            className="bg-green-600 text-white px-3 py-2 rounded mt-3"
          >
            Submit Payment
          </button>
        </div>
      ))}
    </div>
  );
}