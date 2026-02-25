import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Trophy, Settings2 } from 'lucide-react';

type Cell = {
  connections: boolean[];
  rotation: number;
};

function getRotatedConnections(conns: boolean[], rotation: number): boolean[] {
  const res = [...conns];
  for (let i = 0; i < rotation; i++) {
    res.unshift(res.pop()!);
  }
  return res;
}

function generateGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = Array(height).fill(0).map(() => 
    Array(width).fill(0).map(() => ({
      connections: [false, false, false, false],
      rotation: 0,
    }))
  );

  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  const stack = [{x: 0, y: 0}];
  visited[0][0] = true;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const neighbors = [];
    const {x, y} = current;

    if (y > 0 && !visited[y-1][x]) neighbors.push({x, y: y-1, dir: 0, opp: 2});
    if (x < width - 1 && !visited[y][x+1]) neighbors.push({x: x+1, y, dir: 1, opp: 3});
    if (y < height - 1 && !visited[y+1][x]) neighbors.push({x, y: y+1, dir: 2, opp: 0});
    if (x > 0 && !visited[y][x-1]) neighbors.push({x: x-1, y, dir: 3, opp: 1});

    if (neighbors.length > 0) {
      stack.push(current);
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      grid[y][x].connections[next.dir] = true;
      grid[next.y][next.x].connections[next.opp] = true;
      
      visited[next.y][next.x] = true;
      stack.push({x: next.x, y: next.y});
    }
  }

  const extraEdges = Math.floor((width * height) * 0.2);
  for(let i=0; i<extraEdges; i++) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    const dirs = [];
    if (ry > 0 && !grid[ry][rx].connections[0]) dirs.push({x: rx, y: ry-1, dir: 0, opp: 2});
    if (rx < width - 1 && !grid[ry][rx].connections[1]) dirs.push({x: rx+1, y: ry, dir: 1, opp: 3});
    if (ry < height - 1 && !grid[ry][rx].connections[2]) dirs.push({x: rx, y: ry+1, dir: 2, opp: 0});
    if (rx > 0 && !grid[ry][rx].connections[3]) dirs.push({x: rx-1, y: ry, dir: 3, opp: 1});
    
    if (dirs.length > 0) {
      const next = dirs[Math.floor(Math.random() * dirs.length)];
      grid[ry][rx].connections[next.dir] = true;
      grid[next.y][next.x].connections[next.opp] = true;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y][x].rotation = Math.floor(Math.random() * 4);
    }
  }

  return grid;
}

function calculatePower(grid: Cell[][], width: number, height: number): boolean[][] {
  const powered = Array(height).fill(0).map(() => Array(width).fill(false));
  const stack = [{x: 0, y: 0}];
  powered[0][0] = true;

  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    const cell = grid[y][x];
    const currentConns = getRotatedConnections(cell.connections, cell.rotation);

    if (currentConns[0] && y > 0) {
      const neighbor = grid[y-1][x];
      const neighborConns = getRotatedConnections(neighbor.connections, neighbor.rotation);
      if (neighborConns[2] && !powered[y-1][x]) {
        powered[y-1][x] = true;
        stack.push({x, y: y-1});
      }
    }
    if (currentConns[1] && x < width - 1) {
      const neighbor = grid[y][x+1];
      const neighborConns = getRotatedConnections(neighbor.connections, neighbor.rotation);
      if (neighborConns[3] && !powered[y][x+1]) {
        powered[y][x+1] = true;
        stack.push({x: x+1, y});
      }
    }
    if (currentConns[2] && y < height - 1) {
      const neighbor = grid[y+1][x];
      const neighborConns = getRotatedConnections(neighbor.connections, neighbor.rotation);
      if (neighborConns[0] && !powered[y+1][x]) {
        powered[y+1][x] = true;
        stack.push({x, y: y+1});
      }
    }
    if (currentConns[3] && x > 0) {
      const neighbor = grid[y][x-1];
      const neighborConns = getRotatedConnections(neighbor.connections, neighbor.rotation);
      if (neighborConns[1] && !powered[y][x-1]) {
        powered[y][x-1] = true;
        stack.push({x: x-1, y});
      }
    }
  }

  return powered;
}

const Wire: React.FC<{ 
  cell: Cell, x: number, y: number, w: number, h: number, isPowered: boolean, onClick: () => void 
}> = ({ 
  cell, x, y, w, h, isPowered, onClick 
}) => {
  const conns = getRotatedConnections(cell.connections, cell.rotation);
  const [top, right, bottom, left] = conns;
  
  const isStart = x === 0 && y === 0;
  const isEnd = x === w - 1 && y === h - 1;
  
  let color = '#475569'; // slate-600
  if (isPowered) {
    if (isStart) color = '#f59e0b'; // amber-500
    else if (isEnd) color = '#10b981'; // emerald-500
    else color = '#0ea5e9'; // sky-500
  }

  const glow = isPowered ? `drop-shadow(0 0 4px ${color})` : 'none';

  return (
    <button
      onClick={onClick}
      className="w-full aspect-square p-0 m-0 border-[0.5px] border-slate-800/60 bg-slate-900/80 flex items-center justify-center touch-manipulation transition-transform active:scale-90 focus:outline-none hover:bg-slate-800/50"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none" style={{ filter: glow }}>
        <g stroke={color} strokeWidth="16" strokeLinecap="round">
          {top && <line x1="50" y1="50" x2="50" y2="-10" />}
          {right && <line x1="50" y1="50" x2="110" y2="50" />}
          {bottom && <line x1="50" y1="50" x2="50" y2="110" />}
          {left && <line x1="50" y1="50" x2="-10" y2="50" />}
        </g>
        {(top || right || bottom || left) && <circle cx="50" cy="50" r="12" fill={color} />}
        
        {isStart && (
          <circle cx="50" cy="50" r="28" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8 4" className="animate-[spin_4s_linear_infinite]" />
        )}
        {isEnd && (
          <circle cx="50" cy="50" r="28" fill="none" stroke={isPowered ? "#10b981" : "#475569"} strokeWidth="4" strokeDasharray="8 4" className={isPowered ? "animate-[spin_4s_linear_infinite]" : ""} />
        )}
      </svg>
    </button>
  );
};

type Mode = 'easy' | 'normal' | 'hard';

export default function App() {
  const [mode, setMode] = useState<Mode>('normal');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [powered, setPowered] = useState<boolean[][]>([]);
  const [won, setWon] = useState(false);

  const modes = {
    easy: { w: 5, h: 5, label: 'ง่าย (Easy)' },
    normal: { w: 10, h: 10, label: 'ธรรมดา (Normal)' },
    hard: { w: 20, h: 20, label: 'ยากโครต (Hard)' }
  };

  const initGame = (selectedMode: Mode) => {
    const { w, h } = modes[selectedMode];
    const newGrid = generateGrid(w, h);
    setGrid(newGrid);
    setPowered(calculatePower(newGrid, w, h));
    setWon(false);
  };

  useEffect(() => {
    initGame(mode);
  }, [mode]);

  const rotateCell = (x: number, y: number) => {
    if (won) return;
    const newGrid = [...grid];
    newGrid[y][x] = { ...newGrid[y][x], rotation: (newGrid[y][x].rotation + 1) % 4 };
    setGrid(newGrid);
    
    const { w, h } = modes[mode];
    const newPowered = calculatePower(newGrid, w, h);
    setPowered(newPowered);
    
    if (newPowered[h-1][w-1]) {
      setWon(true);
    }
  };

  if (grid.length === 0) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

  const { w, h } = modes[mode];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 drop-shadow-sm">
            <Zap className="w-10 h-10 text-sky-400 fill-sky-400/20" />
            Power Connect
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
            เชื่อมต่อกระแสไฟฟ้าจากจุดเริ่มต้น (ซ้ายบน) ไปยังจุดสิ้นสุด (ขวาล่าง) โดยการคลิกเพื่อหมุนสายไฟ
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm w-full max-w-2xl">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-slate-400" />
            <select 
              value={mode} 
              onChange={(e) => setMode(e.target.value as Mode)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 outline-none cursor-pointer"
            >
              {Object.entries(modes).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => initGame(mode)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            เริ่มใหม่
          </button>
        </div>

        {/* Win State */}
        {won && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-2xl">
              <Trophy className="w-8 h-8 text-emerald-400" />
              <div>
                <h2 className="text-xl font-bold">คุณชนะแล้ว!</h2>
                <p className="text-sm opacity-80">กระแสไฟฟ้าเชื่อมต่อสมบูรณ์</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Grid */}
        <div className="w-full max-w-4xl overflow-auto rounded-2xl border-2 border-slate-800 shadow-2xl shadow-sky-900/10 bg-slate-900 touch-pan-x touch-pan-y custom-scrollbar">
          <div 
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))`,
              minWidth: w === 20 ? '800px' : w === 10 ? '400px' : '250px',
              width: '100%',
            }}
          >
            {grid.map((row, y) => (
              row.map((cell, x) => (
                <Wire 
                  key={`${x}-${y}`}
                  cell={cell}
                  x={x}
                  y={y}
                  w={w}
                  h={h}
                  isPowered={powered[y][x]}
                  onClick={() => rotateCell(x, y)}
                />
              ))
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
            <span>จุดเริ่มต้น</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span>จุดสิ้นสุด</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></div>
            <span>มีไฟฟ้า</span>
          </div>
        </div>

      </div>
    </div>
  );
}
