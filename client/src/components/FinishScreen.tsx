import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useRace } from "@/lib/stores/useRace";

export function FinishScreen() {
  const { racers, resetRace } = useRace();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Find winner
  const sortedRacers = [...racers].sort((a, b) => b.y - a.y);
  const winner = sortedRacers[0];
  const playerPosition = sortedRacers.findIndex((r) => r.isPlayer) + 1;
  
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #E8C4F5 0%, #C4E8F5 100%)",
        fontFamily: "'Comic Sans MS', cursive",
      }}
    >
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={true}
        numberOfPieces={300}
        colors={["#FF6B9D", "#9B59B6", "#F39C12", "#4ECDC4", "#FFE66D", "#32CD32"]}
      />
      
      <div className="text-center px-4 z-10">
        <h1
          className="text-7xl md:text-9xl font-bold mb-8 animate-pulse"
          style={{
            background: "linear-gradient(45deg, #FF6B9D, #9B59B6, #32CD32)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          FERTILIZED!
        </h1>
        
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg mx-auto mb-8">
          <div className="text-6xl mb-4">
            {winner.isPlayer ? "🎉" : "😢"}
          </div>
          
          <h2 className="text-3xl font-bold mb-4" style={{ color: winner.color }}>
            {winner.name} WINS!
          </h2>
          
          <div className="space-y-3 mb-6">
            {sortedRacers.map((racer, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={racer.id}
                  className={`p-4 rounded-xl ${racer.isPlayer ? "bg-pink-100" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{medals[index] || `#${index + 1}`}</span>
                      <span className="text-xl font-bold" style={{ color: racer.color }}>
                        {racer.name}
                      </span>
                    </div>
                    {racer.isPlayer && (
                      <span className="text-sm font-bold" style={{ color: "#FF6B9D" }}>
                        YOU
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {winner.isPlayer && (
            <div className="text-2xl font-bold mb-4" style={{ color: "#32CD32" }}>
              🏆 Achievement Unlocked: Fertilizer! 🏆
            </div>
          )}
          
          {!winner.isPlayer && (
            <div className="text-lg mb-4" style={{ color: "#9B59B6" }}>
              Better luck next time! You finished #{playerPosition}
            </div>
          )}
        </div>
        
        <button
          onClick={resetRace}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-12 py-4 rounded-full text-2xl font-bold shadow-lg hover:scale-110 transition-transform"
        >
          🔄 RACE AGAIN 🔄
        </button>
      </div>
    </div>
  );
}
