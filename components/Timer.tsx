
import React, { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  initialSeconds: number;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && seconds > 0) {
      interval = window.setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(initialSeconds);
    setIsActive(false);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center gap-4 shadow-xl border-b-4 border-slate-700">
      <div className="text-4xl font-mono tracking-widest">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className={`px-4 py-2 rounded-full font-bold transition-all ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isActive ? 'PAUSAR' : 'INICIAR MISSÃO'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-full font-bold transition-all"
        >
          RESET
        </button>
      </div>
    </div>
  );
};

export default Timer;
