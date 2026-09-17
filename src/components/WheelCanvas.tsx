import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SliceSlice, getContrastColor, getSliceAtNeedle, pickRandomWinner } from '../utils/wheelMath';
import { soundEngine } from '../utils/audio';
import { Play, Sparkles } from 'lucide-react';

interface WheelCanvasProps {
  slices: SliceSlice[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winner: SliceSlice) => void;
  spinDuration: number; // in seconds
  soundEnabled: boolean;
  showPercentageOnWheel?: boolean;
}

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  slices,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  spinDuration,
  soundEnabled,
  showPercentageOnWheel = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Current rotation angle in radians
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Pointer deflection angle for physical flapper click effect
  const [pointerDeflection, setPointerDeflection] = useState<number>(0);
  const lastSliceIdRef = useRef<string | null>(null);

  // Render wheel onto canvas
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const minDimension = Math.min(centerX, centerY);
    const radius = minDimension - (minDimension < 170 ? 16 : 24) * dpr;

    if (radius <= 0) return;

    // 1. Draw outer glowing rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 14 * dpr;
    ctx.fill();
    ctx.restore();

    // Outer border ring (classic silver/slate rim)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6 * dpr, 0, 2 * Math.PI);
    ctx.lineWidth = 10 * dpr;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Concentric metallic accent ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 1 * dpr, 0, 2 * Math.PI);
    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    if (slices.length === 0) {
      // Empty placeholder
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = `600 ${16 * dpr}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to the list to build your wheel', centerX, centerY);
      return;
    }

    // 2. Draw Slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    slices.forEach((slice) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, slice.startAngle, slice.endAngle);
      ctx.closePath();

      // Slice fill
      ctx.fillStyle = slice.item.color;
      ctx.fill();

      // Slice border (crisp white boundary)
      ctx.lineWidth = 2.5 * dpr;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Subtle classic lighting highlight over slice
      const midAngle = slice.centerAngle;
      const gradX = Math.cos(midAngle) * radius * 0.7;
      const gradY = Math.sin(midAngle) * radius * 0.7;
      const grad = ctx.createRadialGradient(0, 0, radius * 0.1, gradX, gradY, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw Slice Text
      ctx.save();
      ctx.rotate(slice.centerAngle);

      const textColor = getContrastColor(slice.item.color);
      ctx.fillStyle = textColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Dynamic font size depending on slice count, radius, and sweep angle
      const arcWidthAtPerimeter = radius * slice.sweepAngle;
      let fontSize = Math.min(18 * dpr, Math.max(9 * dpr, Math.min(radius * 0.13, arcWidthAtPerimeter * 0.35)));
      if (slice.sweepAngle < 0.12) {
        fontSize = 9 * dpr;
      }

      ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;

      // Text drop shadow for maximum readability
      ctx.shadowColor = textColor === '#FFFFFF' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 3 * dpr;

      // Text truncation if needed to avoid overlapping center hub
      const maxTextWidth = radius * 0.58;
      let displayName = slice.item.name;
      if (ctx.measureText(displayName).width > maxTextWidth) {
        while (displayName.length > 3 && ctx.measureText(displayName + '…').width > maxTextWidth) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '…';
      }

      // Render slice text (centered cleanly, omitting percentage by default)
      const textX = radius - (radius < 140 ? 12 : 18) * dpr;
      if (showPercentageOnWheel && slice.sweepAngle > 0.3) {
        ctx.fillText(displayName, textX, -fontSize * 0.45);
        ctx.font = `600 ${Math.max(8 * dpr, fontSize * 0.75)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = textColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)';
        ctx.fillText(`${slice.percentage.toFixed(1)}%`, textX, fontSize * 0.65);
      } else {
        ctx.fillText(displayName, textX, 0);
      }

      ctx.restore();
    });

    // 3. Draw perimeter studs/pins at slice intersections
    slices.forEach((slice) => {
      const pinAngle = slice.startAngle;
      const px = Math.cos(pinAngle) * (radius - 2 * dpr);
      const py = Math.sin(pinAngle) * (radius - 2 * dpr);

      ctx.beginPath();
      ctx.arc(px, py, 3.5 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 2 * dpr;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 2 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    });

    ctx.restore();

    // 4. Center hub (classic white & silver concentric ring)
    const hubRadius = Math.max(28 * dpr, radius * 0.22);

    // Hub shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 3 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8 * dpr;
    ctx.fill();
    ctx.restore();

    // Hub outer bezel
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3 * dpr;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // Inner subtle ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius - 4 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

  }, [slices, showPercentageOnWheel]);

  // Handle Resize and Initial Render
  const updateDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height > 100 ? rect.height : rect.width);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    drawWheel(currentRotationRef.current);
  }, [drawWheel]);

  useEffect(() => {
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  // Re-draw whenever slices change and we're not spinning
  useEffect(() => {
    if (!isSpinning) {
      drawWheel(currentRotationRef.current);
    }
  }, [slices, isSpinning, drawWheel]);

  // Execute Spin Action
  const triggerSpin = useCallback(() => {
    if (isSpinning || slices.length === 0) return;

    onSpinStart();

    // Determine winner & target angle
    const { winner, targetAngle } = pickRandomWinner(slices);

    // Physics parameters
    const startRotation = currentRotationRef.current;
    // Calculate how many full rotations (between 5 and 7 full rotations for suspense)
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotationDelta = 2 * Math.PI * extraSpins + ((targetAngle - (startRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const targetTotalRotation = startRotation + totalRotationDelta;

    const durationMs = spinDuration * 1000;
    const startTime = performance.now();

    // Realistic quintic ease-out deceleration curve: 1 - Math.pow(1 - t, 4.5)
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth custom deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4.2);
      const currentRot = startRotation + totalRotationDelta * easeOut;
      currentRotationRef.current = currentRot;

      // Draw updated frame
      drawWheel(currentRot);

      // Check which slice is currently under needle to trigger physical tick
      const currentSlice = getSliceAtNeedle(slices, currentRot);
      if (currentSlice && currentSlice.item.id !== lastSliceIdRef.current) {
        lastSliceIdRef.current = currentSlice.item.id;
        if (soundEnabled) {
          // Speed ratio: 1 at start, down to 0.1 at end
          const speedRatio = 1 - progress;
          soundEngine.playTick(speedRatio);
        }

        // Pointer flapper spring deflection
        const direction = Math.sin(currentRot * 10) > 0 ? 1 : -1;
        setPointerDeflection(direction * (14 * (1 - progress * 0.7)));
        setTimeout(() => setPointerDeflection(0), 45);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setPointerDeflection(0);
        if (soundEnabled) {
          soundEngine.playWin();
        }
        onSpinEnd(winner);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isSpinning, slices, onSpinStart, spinDuration, drawWheel, soundEnabled, onSpinEnd]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Spacebar to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (e.code === 'Space' && !isSpinning && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        e.preventDefault();
        triggerSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSpin, isSpinning]);

  return (
    <div
      id="wheel-container"
      ref={containerRef}
      className="relative w-full aspect-square max-w-[min(90vw,540px,56vh)] max-h-[min(90vw,540px,56vh)] flex items-center justify-center select-none mx-auto"
    >
      {/* Top Pointer Indicator / Needle */}
      <div
        id="wheel-pointer"
        className="absolute top-0 z-20 flex flex-col items-center pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `rotate(${pointerDeflection}deg)`,
          transformOrigin: 'top center',
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Classic Ruby Red Pointer Needle */}
          <div
            className="w-6 h-8 sm:w-7 sm:h-9 md:w-8 md:h-10 bg-gradient-to-b from-red-500 via-rose-600 to-red-700 shadow-md"
            style={{
              clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
              filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4))',
            }}
          />
          {/* Silver Pivot Pin */}
          <div className="absolute -top-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 border-2 border-slate-400 shadow-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          </div>
        </div>
      </div>

      {/* HTML5 Canvas */}
      <canvas
        id="wheel-canvas"
        ref={canvasRef}
        className="block drop-shadow-xl cursor-pointer"
        onClick={() => {
          if (!isSpinning) triggerSpin();
        }}
        title="Click to spin the wheel"
      />

      {/* Center Interactive SPIN Button - Classic Wheel of Names Style */}
      <div className="absolute z-10 flex items-center justify-center pointer-events-auto">
        <button
          id="wheel-center-spin-btn"
          onClick={triggerSpin}
          disabled={isSpinning || slices.length === 0}
          className={`group relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/40 shadow-xl ${
            isSpinning
              ? 'bg-slate-100 border-slate-300 cursor-not-allowed text-blue-600 scale-95'
              : slices.length === 0
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-blue-500 hover:scale-105 active:scale-95 text-slate-800 cursor-pointer shadow-slate-400/30'
          }`}
          aria-label={isSpinning ? 'Spinning wheel' : 'Spin the wheel'}
        >
          {isSpinning ? (
            <div className="flex flex-col items-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-600 mb-0.5" />
              <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-blue-600">
                SPINNING
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-900">
                SPIN
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
