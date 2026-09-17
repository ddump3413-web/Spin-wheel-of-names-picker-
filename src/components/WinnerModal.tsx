import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SliceSlice } from '../utils/wheelMath';
import { Trophy, RefreshCw, Trash2, EyeOff, X } from 'lucide-react';

interface WinnerModalProps {
  winner: SliceSlice | null;
  isOpen: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveWinner: (id: string) => void;
  onDisableWinner: (id: string) => void;
  confettiEnabled: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  isOpen,
  onClose,
  onSpinAgain,
  onRemoveWinner,
  onDisableWinner,
  confettiEnabled,
}) => {
  useEffect(() => {
    if (isOpen && winner && confettiEnabled) {
      // Trigger festive multi-burst confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen, winner, confettiEnabled]);

  if (!isOpen || !winner) return null;

  return (
    <div
      id="winner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="winner-modal-content"
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-center transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="winner-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Badge */}
        <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-md shadow-amber-500/10">
          <Trophy className="w-9 h-9 text-amber-500 animate-bounce" />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-amber-600">
          We Have A Winner!
        </span>

        {/* Winner Name with Custom Segment Color Styling */}
        <div className="my-5">
          <div
            className="inline-block px-6 py-3 rounded-2xl font-black text-2xl sm:text-3xl text-white shadow-lg border border-white/40 break-words max-w-full"
            style={{
              backgroundColor: winner.item.color,
              boxShadow: `0 8px 24px ${winner.item.color}44`,
            }}
          >
            {winner.item.name}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-4">
          <button
            id="winner-spin-again-btn"
            onClick={onSpinAgain}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Spin Again
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="winner-remove-btn"
              onClick={() => {
                onRemoveWinner(winner.item.id);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Remove this name from the wheel completely"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Winner
            </button>

            <button
              id="winner-disable-btn"
              onClick={() => {
                onDisableWinner(winner.item.id);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Keep in list but exclude from next spins"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Disable for Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
