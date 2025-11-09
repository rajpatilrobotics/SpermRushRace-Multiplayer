import { useRace } from "@/lib/stores/useRace";

export function GameUI() {
  const { activeEffect, racers } = useRace();
  
  const player = racers.find((r) => r.isPlayer);
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Active Effect Notification */}
      {activeEffect && activeEffect.timer > 0 && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 animate-bounce"
            style={{ fontFamily: "'Comic Sans MS', cursive" }}
          >
            <div className="text-2xl font-bold text-center" style={{ color: "#FF6B9D" }}>
              {activeEffect.message}
            </div>
            <div className="text-center text-sm text-gray-600 mt-2">
              {(activeEffect.timer / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      )}
      
      {/* Speed indicator */}
      {player && player.speedMultiplier !== 1 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg"
            style={{ fontFamily: "'Comic Sans MS', cursive" }}
          >
            <div className="text-center font-bold">
              Speed: {(player.speedMultiplier * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
