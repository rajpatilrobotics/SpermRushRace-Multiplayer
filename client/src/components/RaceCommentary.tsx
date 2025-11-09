import { useEffect, useRef } from "react";
import { useRace } from "@/lib/stores/useRace";

const COMMENTARY_INTERVAL = 5000;

const COMMENTARY_PHRASES = [
  "What a show!",
  "The competition is heating up!",
  "They're swimming for glory!",
  "This is intense!",
  "Look at them go!",
  "It's neck and neck!",
  "The race is on!",
  "Can you believe this?!",
  "Absolutely incredible!",
  "The swimmers are giving it their all!",
  "What a thrilling race!",
  "The tension is building!",
  "This is what we came to see!",
  "They're really pushing it!",
  "The finish line approaches!",
];

export function RaceCommentary() {
  const { phase, racers, lastCommentaryTime } = useRace();
  const lastTimeRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);
  
  useEffect(() => {
    if (phase !== "racing" || !synthRef.current) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastTimeRef.current < COMMENTARY_INTERVAL) return;
      
      lastTimeRef.current = now;
      
      // Get race positions
      const sortedRacers = [...racers].sort((a, b) => b.y - a.y);
      const leader = sortedRacers[0];
      const playerPosition = sortedRacers.findIndex((r) => r.isPlayer) + 1;
      
      // Generate commentary
      let commentary = "";
      
      if (Math.random() < 0.3) {
        // Position-based commentary
        if (leader.isPlayer) {
          commentary = "You're in the lead! Keep it up!";
        } else {
          commentary = `${leader.name} is leading the pack!`;
        }
      } else if (Math.random() < 0.5) {
        // Player-specific commentary
        if (playerPosition === 1) {
          commentary = "You're dominating this race!";
        } else if (playerPosition === 2) {
          commentary = "You're in second place! Push harder!";
        } else {
          commentary = "You're falling behind! Speed up!";
        }
      } else {
        // Random phrase
        commentary = COMMENTARY_PHRASES[Math.floor(Math.random() * COMMENTARY_PHRASES.length)];
      }
      
      // Speak
      const utterance = new SpeechSynthesisUtterance(commentary);
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      utterance.volume = 0.8;
      
      synthRef.current.speak(utterance);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, racers]);
  
  return null;
}
