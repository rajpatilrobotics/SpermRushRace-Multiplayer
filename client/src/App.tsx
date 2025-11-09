import { useRace } from "./lib/stores/useRace";
import { GameCanvas } from "./components/GameCanvas";
import { VoiceBoost } from "./components/VoiceBoost";
import { RaceCommentary } from "./components/RaceCommentary";
import { Leaderboard } from "./components/Leaderboard";
import { GameUI } from "./components/GameUI";
import { StartScreen } from "./components/StartScreen";
import { FinishScreen } from "./components/FinishScreen";

function App() {
  const { phase } = useRace();
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {phase === "ready" && <StartScreen />}
      
      {phase === "racing" && (
        <>
          <GameCanvas />
          <Leaderboard />
          <VoiceBoost />
          <GameUI />
          <RaceCommentary />
        </>
      )}
      
      {phase === "finished" && <FinishScreen />}
    </div>
  );
}

export default App;
