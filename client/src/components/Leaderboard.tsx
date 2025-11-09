import { useRace } from "@/lib/stores/useRace";

export function Leaderboard() {
  const { racers, trackHeight } = useRace();
  
  // Sort by progress
  const sortedRacers = [...racers].sort((a, b) => b.y - a.y);
  
  return (
    <div
      className="fixed top-4 right-4 bg-white rounded-2xl shadow-2xl p-4 w-64"
      style={{ fontFamily: "'Comic Sans MS', cursive" }}
    >
      <h2 className="text-xl font-bold text-center mb-3" style={{ color: "#FF6B9D" }}>
        Leaderboard
      </h2>
      
      <div className="space-y-3">
        {sortedRacers.map((racer, index) => {
          const progress = (racer.y / trackHeight) * 100;
          const medals = ["🥇", "🥈", "🥉"];
          
          return (
            <div key={racer.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{medals[index] || `#${index + 1}`}</span>
                  <div>
                    <div className="font-bold" style={{ color: racer.color }}>
                      {racer.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {progress.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: racer.color }}
                />
              </div>
              
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, progress)}%`,
                    background: `linear-gradient(90deg, ${racer.color}, ${racer.color}dd)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
