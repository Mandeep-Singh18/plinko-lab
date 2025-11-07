'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

// --- Constants ---
const ROWS = 12;
const BINS = ROWS + 1;
const PEG_SIZE = 10; // Peg diameter in px
const BALL_SIZE = 28; // Ball diameter in px
const BOARD_PADDING = 20; // Padding inside the board
const BOARD_WIDTH = (ROWS + 1) * (PEG_SIZE * 3) + BOARD_PADDING * 2;

// --- Types ---
interface RoundData {
  roundId: string;
  commitHex: string;
}
interface StartResult {
  roundId: string;
  binIndex: number;
  path: ('L' | 'R')[];
}

export default function PlinkoGame() {
  const [round, setRound] = useState<RoundData | null>(null);
  const [result, setResult] = useState<StartResult | null>(null);
  const [clientSeed, setClientSeed] = useState('your-client-seed');
  const [dropColumn, setDropColumn] = useState(6);
  const [bet, setBet] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // --- Animation State ---
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // --- Easter Egg State ---
  const [isTilted, setIsTilted] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);

  // --- Sound Refs ---
  const pegSoundRef = useRef<HTMLAudioElement>(null);
  const winSoundRef = useRef<HTMLAudioElement>(null);

  // --- Accessibility Effect ---
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleChange = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // --- Easter Egg Key Listener ---
  useEffect(() => {
    const handleEasterEgg = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        setIsTilted(tilt => !tilt);
      }
      if (e.key === 'g' || e.key === 'G') {
        setShowDebugGrid(grid => !grid);
      }
    };
    window.addEventListener('keydown', handleEasterEgg);
    return () => window.removeEventListener('keydown', handleEasterEgg);
  }, []);


  // --- Sound Player ---
  const playSound = (sound: 'peg' | 'win') => {
    if (isMuted) return;
    const audio = sound === 'peg' ? pegSoundRef.current : winSoundRef.current;
    
    if (audio) {
      audio.currentTime = 0; // Rewind the sound
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  // --- Game Logic ---
  const createNewRound = useCallback(async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/rounds/commit', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create round');
      const data: RoundData = await res.json();
      setRound(data);
    } catch (err) {
      console.error(err);
      alert("Error creating round. Check console.");
    }
    setIsLoading(false);
  }, []);

  // Effect to load the first round on mount
  useEffect(() => {
    createNewRound();
  }, [createNewRound]);

  // --- Animation Function ---
  const animateBall = (path: ('L' | 'R')[], finalBin: number) => {
    setIsAnimating(true);
    
    const startX = BOARD_WIDTH / 2 + (dropColumn - ROWS / 2) * (PEG_SIZE * 1.5);
    setBallPosition({ x: startX, y: 0 });

    if (isReducedMotion) {
      setResult({ roundId: round!.roundId, binIndex: finalBin, path });
      setIsAnimating(false);
      playSound('win');
      createNewRound();
      return;
    }

    let x = startX;
    let y = 40; 

    const animateStep = (row: number) => {
      if (row >= path.length) {
        const binWidth = (BOARD_WIDTH - BOARD_PADDING * 2) / BINS;
        const finalX = (finalBin * binWidth) + (binWidth / 2) + BOARD_PADDING;
        setBallPosition({ x: finalX, y: 450 }); 
        
        setTimeout(() => {
          setResult({ roundId: round!.roundId, binIndex: finalBin, path });
          setIsAnimating(false);
          playSound('win');
          createNewRound(); 
        }, 500); 
        return;
      }

      const direction = path[row];
      const xMove = (direction === 'L' ? -1 : 1) * (PEG_SIZE * 1.5);
      x += xMove;
      y += 34; 
      
      setBallPosition({ x, y });
      playSound('peg'); 

      setTimeout(() => animateStep(row + 1), 150); 
    };
    setTimeout(() => animateStep(0), 100);
  };

  // --- Handlers ---
  const handleDrop = async () => {
    if (!round || isLoading || isAnimating) return;
    setIsLoading(true);
    setResult(null); 
    
    try {
      const res = await fetch(`/api/rounds/${round.roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed: clientSeed,
          dropColumn: dropColumn,
          betCents: bet,
        }),
      });
      if (!res.ok) throw new Error('Failed to start round');
      
      const data: StartResult = await res.json();
      animateBall(data.path, data.binIndex);
      await handleReveal(round.roundId);

    } catch (err) {
      console.error(err);
      alert("Error starting round. Check console.");
      setIsAnimating(false);
    }
    setIsLoading(false);
  };

  const handleReveal = async (roundId: string) => {
    try {
      const res = await fetch(`/api/rounds/${roundId}/reveal`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reveal seed');
      const data = await res.json();
      console.log('Server Seed Revealed:', data.serverSeed);
    } catch (err) {
      console.error('Reveal error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isLoading || isAnimating) return;
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setDropColumn(col => Math.max(0, col - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setDropColumn(col => Math.min(ROWS, col + 1));
    } else if (e.key === ' ') { 
      e.preventDefault();
      handleDrop();
    }
  };

  // --- Render Pegs ---
  const renderPegs = () => {
    const pegs = [];
    for (let r = 0; r < ROWS; r++) {
      const numPegsInRow = r + 1;
      const rowY = 60 + r * 34;
      const rowWidth = numPegsInRow * (PEG_SIZE * 3);
      const rowStartX = (BOARD_WIDTH - rowWidth) / 2 + (PEG_SIZE * 1.5);

      for (let p = 0; p < numPegsInRow; p++) {
        const pegX = rowStartX + p * (PEG_SIZE * 3);
        pegs.push(
          <div
            key={`peg-${r}-${p}`}
            className={`absolute bg-gray-400 rounded-full transition-all duration-300
              ${showDebugGrid ? 'ring-2 ring-red-500' : ''}
            `}
            style={{
              width: PEG_SIZE,
              height: PEG_SIZE,
              left: pegX - PEG_SIZE / 2,
              top: rowY - PEG_SIZE / 2,
            }}
          />
        );
      }
    }
    return pegs;
  };

  // --- Render Bins ---
  const renderBins = () => {
    const bins = [];
    const binWidth = (BOARD_WIDTH - BOARD_PADDING * 2) / BINS;
    for (let i = 0; i < BINS; i++) {
      const isLanded = result?.binIndex === i;
      bins.push(
        <div
          key={`bin-${i}`}
          className={`h-16 border-r border-gray-400 last:border-r-0 flex items-center justify-center font-bold text-gray-700
            ${isLanded ? 'bg-green-300 animate-pulse' : 'bg-gray-200'}
            ${showDebugGrid ? 'ring-2 ring-blue-500' : ''}
          `}
          style={{ width: binWidth }}
        >
          {i === 6 ? '10x' : i === 5 || i === 7 ? '5x' : i === 4 || i === 8 ? '3x' : '1.5x'}
        </div>
      );
    }
    return <div className="absolute bottom-0 left-0 right-0 flex" style={{ padding: `0 ${BOARD_PADDING}px` }}>{bins}</div>;
  };


  return (
    <div 
      className="flex flex-col items-center min-h-screen p-4 bg-gray-900 text-white"
      onKeyDown={handleKeyDown}
      tabIndex={0} 
    >
      <h1 className="text-3xl font-bold mb-4">Plinko Lab</h1>

      {/* --- Plinko Board --- */}
      <div
        className={`relative bg-gray-800 border-4 border-gray-600 rounded-lg mb-4 shadow-lg overflow-hidden transition-transform duration-500
          ${isTilted ? 'rotate-3' : ''}
        `}
        style={{ width: BOARD_WIDTH, height: 500 }}
      >
        {renderPegs()}
        {renderBins()}

        {/* --- Ball --- */}
        <div
          className="absolute bg-red-500 rounded-full border-2 border-red-200"
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            left: ballPosition.x - BALL_SIZE / 2,
            top: ballPosition.y - BALL_SIZE / 2,
            opacity: isAnimating ? 1 : 0,
            transition: isReducedMotion ? 'none' : 'left 150ms ease-out, top 150ms ease-in',
            willChange: 'left, top',
          }}
        />
      </div>

      {/* --- Game Controls --- */}
      <div className="w-full p-4 bg-gray-800 rounded-lg shadow-lg" style={{ maxWidth: BOARD_WIDTH }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <label htmlFor="bet" className="block mb-1 text-sm font-medium text-gray-400">Bet Amount</label>
            <input
              id="bet"
              type="number"
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
            />
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="ml-4 p-3 mt-6 bg-gray-700 rounded-lg text-lg"
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="dropCol" className="block mb-1 text-sm font-medium text-gray-400">Drop Column ({dropColumn})</label>
          <input
            id="dropCol"
            type="range"
            min="0"
            max={ROWS}
            value={dropColumn}
            onChange={(e) => setDropColumn(Number(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="clientSeed" className="block mb-1 text-sm font-medium text-gray-400">Client Seed</label>
          <input
            id="clientSeed"
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
          />
        </div>
        
        <button
          onClick={handleDrop}
          disabled={isLoading || isAnimating || !round}
          className="w-full p-3 text-white bg-green-600 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors"
        >
          {isAnimating ? 'Dropping...' : isLoading ? '...' : 'Drop'}
        </button>
      </div>
      
      {/* --- Fairness Info --- */}
      <div className="w-full p-4 mt-4 text-xs text-gray-400 bg-gray-800 rounded-lg" style={{ maxWidth: BOARD_WIDTH }}>
        <p className="font-bold">Current Round:</p>
        <p className="truncate"><strong>ID:</strong> {round?.roundId}</p>
        <p className="truncate"><strong>Commit Hex:</strong> {round?.commitHex}</p>
        {result && <p className="text-green-400">Landed in Bin: {result.binIndex}</p>}
        <p className="mt-2 text-gray-500">Press 'T' for tilt, 'G' for debug grid.</p>
      </div>

      {/* --- Audio Elements --- */}
      <audio ref={pegSoundRef} src="/sounds/peg-tick.mp3" preload="auto" />
      <audio ref={winSoundRef} src="/sounds/win-sound.mp3" preload="auto" />
    </div>
  );
}