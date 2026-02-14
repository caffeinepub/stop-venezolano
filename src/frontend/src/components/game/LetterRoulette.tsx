import { useEffect, useState, useRef } from 'react';
import { SPANISH_ALPHABET } from '@/utils/spanishAlphabet';
import { cn } from '@/lib/utils';

interface LetterRouletteProps {
  selectedLetter: string | null;
  usedLetters: string[];
  isSpinning: boolean;
  onSpinComplete?: () => void;
}

export function LetterRoulette({
  selectedLetter,
  usedLetters,
  isSpinning,
  onSpinComplete,
}: LetterRouletteProps) {
  const [displayLetter, setDisplayLetter] = useState<string>(selectedLetter || 'A');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinIndexRef = useRef(0);

  useEffect(() => {
    // Clear any existing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isSpinning && selectedLetter) {
      // Animate through letters rapidly
      intervalRef.current = setInterval(() => {
        spinIndexRef.current = (spinIndexRef.current + 1) % SPANISH_ALPHABET.length;
        setDisplayLetter(SPANISH_ALPHABET[spinIndexRef.current]);
      }, 80);

      // Stop after 2 seconds and show selected letter
      timeoutRef.current = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplayLetter(selectedLetter);
        onSpinComplete?.();
      }, 2000);
    } else if (selectedLetter && !isSpinning) {
      // Not spinning, just show the selected letter
      setDisplayLetter(selectedLetter);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSpinning, selectedLetter, onSpinComplete]);

  return (
    <div className="space-y-4">
      {/* Main letter display */}
      <div className="flex items-center justify-center">
        <div
          className={cn(
            'inline-flex items-center justify-center w-32 h-32 rounded-full text-6xl font-black transition-all duration-300',
            isSpinning
              ? 'bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground animate-pulse scale-110'
              : 'bg-primary text-primary-foreground scale-100'
          )}
        >
          {displayLetter}
        </div>
      </div>

      {/* Alphabet grid showing used/available letters */}
      <div className="grid grid-cols-9 gap-1 p-4 bg-muted/50 rounded-lg">
        {SPANISH_ALPHABET.map((letter) => {
          const isUsed = usedLetters.includes(letter);
          const isCurrent = letter === selectedLetter && !isSpinning;

          return (
            <div
              key={letter}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded text-sm font-bold transition-all',
                isUsed && 'opacity-30 line-through',
                isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                !isUsed && !isCurrent && 'bg-background text-foreground'
              )}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}
