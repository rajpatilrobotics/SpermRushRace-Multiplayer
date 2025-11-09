import { useEffect, useState, useRef } from "react";
import { useRace } from "@/lib/stores/useRace";

export function VoiceBoost() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { activateVoiceBoost, voiceBoostCooldown, phase } = useRace();
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Voice recognition not supported");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          setTranscript(transcriptPiece);
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        checkForTriggerPhrase(finalTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setError(`Error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      if (isListening && phase === "racing") {
        recognition.start();
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [phase, isListening]);
  
  const checkForTriggerPhrase = (text: string) => {
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, "");
    const targetPhrase = "east or west goon hack is the best";
    const normalizedTarget = targetPhrase.replace(/[^\w\s]/g, "");
    
    if (normalizedText.includes(normalizedTarget)) {
      console.log("Voice boost trigger detected!");
      activateVoiceBoost();
      setTranscript("✅ BOOST ACTIVATED!");
      setTimeout(() => setTranscript(""), 2000);
    }
  };
  
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript("");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Failed to start voice recognition");
      }
    }
  };
  
  const cooldownPercent = (voiceBoostCooldown / 10000) * 100;
  
  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-2xl shadow-2xl p-4 w-64" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold" style={{ color: "#9B59B6" }}>Voice Boost</h3>
        <p className="text-xs text-gray-600">Say: "east or west goon hack is the best"</p>
      </div>
      
      <button
        onClick={toggleListening}
        disabled={phase !== "racing"}
        className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all ${
          isListening
            ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isListening ? (
          <>
            <span className="text-xl">🎤</span> Listening...
          </>
        ) : (
          <>
            <span className="text-xl">🎤</span> Activate
          </>
        )}
      </button>
      
      {transcript && (
        <div className="mt-2 p-2 bg-purple-100 rounded-lg text-sm text-center">
          {transcript}
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 rounded-lg text-xs text-center text-red-600">
          {error}
        </div>
      )}
      
      {voiceBoostCooldown > 0 && (
        <div className="mt-2">
          <div className="text-xs text-center text-gray-600 mb-1">
            Cooldown: {(voiceBoostCooldown / 1000).toFixed(1)}s
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
              style={{ width: `${cooldownPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
