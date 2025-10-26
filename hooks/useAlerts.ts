import { useEffect, useRef } from 'react';
import { CrowdData, RiskLevel } from '../types';

const useAlerts = (crowdData: CrowdData | null) => {
  const previousRiskLevel = useRef<RiskLevel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction (or at least not on initial load)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playAlertSound = () => {
    if (!audioContextRef.current) return;
    const audioCtx = audioContextRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    
    // A subtle two-tone alert to be less jarring.
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0.25, startTime); // Lowered volume for subtlety
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    playTone(659.25, now, 0.1); // E5
    playTone(880, now + 0.15, 0.12); // A5
  };

  const showNotification = (count: number) => {
    if (!('Notification' in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }

    const permission = Notification.permission;

    if (permission === "granted") {
      new Notification("High Risk Alert!", {
        body: `Crowd headcount is now ${count}. Please take immediate action.`,
        icon: '/vite.svg', // Or a more appropriate icon
      });
    } else if (permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showNotification(count);
        }
      });
    }
  };

  useEffect(() => {
    if (crowdData) {
      const currentRisk = crowdData.riskLevel;
      if (currentRisk === RiskLevel.HIGH && previousRiskLevel.current !== RiskLevel.HIGH) {
        // Just transitioned to HIGH risk
        playAlertSound();
        showNotification(crowdData.totalCount);
      }
      previousRiskLevel.current = currentRisk;
    }
  }, [crowdData]);

};

export default useAlerts;
