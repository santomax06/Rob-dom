
import React, { useRef, useEffect, useState } from 'react';
import { TrackElement, ChallengeTheme } from '../types';

interface TrackVisualizerProps {
  elements: TrackElement[];
  activeElementId: string | null;
  onSelectElement: (id: string) => void;
  simulationProgress: number; // 0 to 1
  isSimulating: boolean;
  theme: ChallengeTheme;
  onScoreTrigger?: (points: number) => void;
}

const WedoRobotLarge = ({ rotation, scorePop }: { rotation: number, scorePop: { label: string, icon: string, id: string } | null }) => (
  <g transform={`rotate(${rotation})`}>
    <ellipse cx="0" cy="2" rx="12" ry="10" fill="black" opacity="0.1" />
    <rect x="-10" y="-8" width="20" height="16" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2"/>
    <rect x="-8" y="8" width="6" height="4" fill="#334155" rx="1.5" />
    <rect x="2" y="8" width="6" height="4" fill="#334155" rx="1.5" />
    <rect x="-8" y="-12" width="6" height="4" fill="#334155" rx="1.5" />
    <rect x="2" y="-12" width="6" height="4" fill="#334155" rx="1.5" />
    <rect x="-3" y="-4" width="6" height="6" rx="1.5" fill="#93C5FD" className="animate-pulse" />
    <rect x="8" y="-3" width="4" height="6" rx="1.5" fill="#22C55E"/>
    {scorePop && (
      <g className="animate-[pop-inside-robot_1.5s_ease-out_forwards] pointer-events-none">
        <circle r="12" fill="white" stroke={scorePop.label.startsWith('-') ? '#ef4444' : '#22c55e'} strokeWidth="1.5" filter="url(#shadow-soft)" />
        <text 
          textAnchor="middle" 
          y="4" 
          fontSize="10" 
          fontWeight="900" 
          fill={scorePop.label.startsWith('-') ? '#ef4444' : '#22c55e'}
          transform={`rotate(${-rotation})`} 
        >
          {scorePop.label}
        </text>
      </g>
    )}
  </g>
);

const TrackVisualizer: React.FC<TrackVisualizerProps> = ({ 
  elements, 
  activeElementId, 
  onSelectElement,
  simulationProgress,
  isSimulating,
  theme,
  onScoreTrigger
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [robotPos, setRobotPos] = useState({ x: 0, y: 0, angle: 0 });
  const [currentScorePop, setCurrentScorePop] = useState<{ label: string, icon: string, id: string } | null>(null);
  const [visitedElements, setVisitedElements] = useState<Set<string>>(new Set());

  const themeIcons: Record<string, { start: string, end: string, item: string, obstacle: string }> = {
    [ChallengeTheme.SPACE]: { start: '🚀', end: '👨‍🚀', item: '🪐', obstacle: '☄️' },
    [ChallengeTheme.JUNGLE]: { start: '🏕️', end: '🦜', item: '🐒', obstacle: '🐍' },
    [ChallengeTheme.CITY]: { start: '🏠', end: '🌳', item: '🔋', obstacle: '🚧' },
    [ChallengeTheme.OCEAN]: { start: '🐚', end: '🐳', item: '🐠', obstacle: '🐙' },
    [ChallengeTheme.CONSTRUCTION]: { start: '👷', end: '🏗️', item: '🧱', obstacle: '🚜' },
  };

  const icons = themeIcons[theme] || { start: '📍', end: '🏁', item: '⭐', obstacle: '⚠️' };

  const getElementIcon = (type: TrackElement['type']) => {
    if (type === 'start') return icons.start;
    if (type === 'end') return icons.end;
    if (type === 'obstacle') return icons.obstacle;
    return icons.item;
  };

  const sortedElements = [...elements].sort((a, b) => {
    if (a.type === 'start') return -1;
    if (b.type === 'start') return 1;
    if (a.type === 'end') return 1;
    if (b.type === 'end') return -1;
    return 0;
  });

  const pathD = sortedElements.length > 0 
    ? `M ${sortedElements[0].x} ${sortedElements[0].y} ` + 
      sortedElements.slice(1).map(e => `L ${e.x} ${e.y}`).join(' ')
    : '';

  useEffect(() => {
    if (!isSimulating) {
      setVisitedElements(new Set());
      setCurrentScorePop(null);
      if (sortedElements.length > 0) {
        setRobotPos({ x: sortedElements[0].x, y: sortedElements[0].y, angle: 0 });
      }
      return;
    }

    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      const point = pathRef.current.getPointAtLength(simulationProgress * length);
      const nextPoint = pathRef.current.getPointAtLength(Math.min(length, (simulationProgress + 0.005) * length));
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
      
      setRobotPos({ x: point.x, y: point.y, angle });

      elements.forEach(el => {
        const dist = Math.sqrt(Math.pow(el.x - point.x, 2) + Math.pow(el.y - point.y, 2));
        if (dist < 4 && !visitedElements.has(el.id)) {
           setVisitedElements(prev => new Set(prev).add(el.id));
           const icon = getElementIcon(el.type);
           const pointsToAdd = el.type === 'obstacle' ? -5 : 10;
           const newPop = { id: el.id + Date.now(), label: pointsToAdd > 0 ? `+${pointsToAdd}` : `${pointsToAdd}`, icon: icon };
           setCurrentScorePop(newPop);
           if (onScoreTrigger) onScoreTrigger(pointsToAdd);
           setTimeout(() => setCurrentScorePop(current => current?.id === newPop.id ? null : current), 1500);
        }
      });
    }
  }, [simulationProgress, isSimulating, elements, theme, visitedElements]);

  return (
    <div className="relative w-full aspect-square md:aspect-video bg-white rounded-[3rem] shadow-2xl border-[12px] border-slate-200 overflow-hidden lego-pattern p-6">
      <svg viewBox="-30 -30 180 180" className="w-full h-full overflow-visible">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
            <circle cx="10" cy="10" r="1.5" fill="#f1f5f9" opacity="0.3" />
          </pattern>
          <filter id="shadow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        <rect x="-30" y="-30" width="180" height="180" fill="url(#grid)" />
        
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-20"
        />

        <path
          d={pathD}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeDasharray="8 8"
          className="animate-[dash_40s_linear_infinite]"
        />

        {elements.map((el) => {
          const isActive = el.id === activeElementId;
          const isVisited = visitedElements.has(el.id);
          const icon = getElementIcon(el.type);

          return (
            <g key={el.id} className="cursor-pointer transition-all duration-500 origin-center" onClick={() => onSelectElement(el.id)}>
              <circle
                cx={el.x}
                cy={el.y}
                r={isActive ? "20" : "18"}
                fill={isVisited ? "#f0fdf4" : "white"}
                stroke={isVisited ? "#22c55e" : "#f1f5f9"}
                strokeWidth="1.5"
                filter="url(#shadow-soft)"
                className="transition-colors duration-500"
              />
              <text
                x={el.x}
                y={el.y + 8}
                textAnchor="middle"
                fontSize={isActive ? "28" : "24"}
                className={`select-none pointer-events-none transition-all duration-300 ${isVisited ? 'scale-110 opacity-20 blur-[1px]' : 'opacity-100'}`}
              >
                {icon}
              </text>
              <g transform={`translate(${el.x}, ${el.y + 26})`}>
                <rect x="-18" y="-4" width="36" height="8" rx="2" fill="white" fillOpacity="0.9" filter="url(#shadow-soft)" />
                <text textAnchor="middle" y="1" fontSize="4" fontWeight="900" fill="#475569" className="uppercase tracking-widest italic">
                  {el.label}
                </text>
              </g>
              {isActive && (
                <circle cx={el.x} cy={el.y} r="25" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" className="animate-spin duration-[8s]" />
              )}
            </g>
          );
        })}

        <g transform={`translate(${robotPos.x}, ${robotPos.y})`}>
          <WedoRobotLarge rotation={robotPos.angle} scorePop={currentScorePop} />
        </g>

        <style>{`
          @keyframes dash { to { stroke-dashoffset: -200; } }
          @keyframes pop-inside-robot {
            0% { transform: scale(0.1); opacity: 0; }
            20% { transform: scale(1.5); opacity: 1; }
            40% { transform: scale(1.2); opacity: 1; }
            80% { transform: translateY(-30px) scale(1); opacity: 1; }
            100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
};

export default TrackVisualizer;
