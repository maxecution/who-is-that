import { useEffect, useState } from 'react';
import { type UseGameState } from '@web/types/game';
import { type PokemonSummary } from '@who-is-that/shared-types';
import {
  initialiseGame,
  submitGuess as engineSubmitGuess,
  skipPokemon,
  isGameOver as checkIsGameOver,
} from '@web/game/gameEngine';
import generatePokemonPool from '@web/game/utils/generatePokemonPool';
import normaliseName from '@web/game/utils/normaliseName';

// Local Storage
const STORAGE_KEY = 'who-is-that:game';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

function loadState(): Partial<UseGameState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state: UseGameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Hook
export function useGame() {
  const [state, setState] = useState<UseGameState>(() => {
    const saved = loadState();

    if (saved) return saved as UseGameState;

    const enabledGenerations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const pool = generatePokemonPool(enabledGenerations);
    const initial = initialiseGame(pool);

    return {
      ...initial,
      isGameOver: false,
      currentPokemon: null,
      isLoading: false,
      error: null,
      enabledGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      soundEnabled: false,
    };
  });
  console.log('Loaded state:', state);

  // Fetch Pokemon
  useEffect(() => {
    if (state.isGameOver) return;

    const fetchPokemon = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await fetch(`${API_BASE_URL}/api/pokemon/${state.currentPokemonId}`);
        if (!res.ok) throw new Error('API error');

        const data: PokemonSummary = await res.json();

        setState((prev) => ({
          ...prev,
          currentPokemon: data,
          isLoading: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          error: 'Failed to load Pokémon',
          isLoading: false,
        }));
      }
    };

    fetchPokemon();
  }, [state.currentPokemonId, state.isGameOver]);

  // Persist state
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Sound
  useEffect(() => {
    if (state.soundEnabled && state.currentPokemon?.cry && !state.isGameOver) {
      new Audio(state.currentPokemon.cry);
    }
  }, [state.currentPokemonId, state.soundEnabled, state.isGameOver]);

  // Actions
  function submitGuess(guess: string) {
    if (!state.currentPokemon || state.isGameOver) return;

    const normalisedGuess = normaliseName(guess);
    const normalisedName = normaliseName(state.currentPokemon.name);

    const isCorrect = normalisedGuess === normalisedName;

    setState((prev) => {
      const next = engineSubmitGuess(prev, isCorrect);

      return {
        ...prev,
        ...next,
        isGameOver: checkIsGameOver(next),
      };
    });
  }

  function skip() {
    if (state.isGameOver) return;

    setState((prev) => {
      const next = skipPokemon(prev);

      return {
        ...prev,
        ...next,
        isGameOver: checkIsGameOver(next),
      };
    });
  }

  function reset() {
    const pool = generatePokemonPool(state.enabledGenerations);
    const next = initialiseGame(pool);

    setState({
      ...next,
      isGameOver: false,
      currentPokemon: null,
      isLoading: false,
      error: null,
      enabledGenerations: state.enabledGenerations,
      soundEnabled: state.soundEnabled,
    });
  }

  function toggleSound() {
    setState((prev) => {
      const nextEnabled = !prev.soundEnabled;

      // play immediately if enabling
      if (nextEnabled && prev.currentPokemon?.cry) {
        new Audio(prev.currentPokemon.cry);
      }

      return {
        ...prev,
        soundEnabled: nextEnabled,
      };
    });
  }

  function playSound() {
    if (state.currentPokemon?.cry) {
      new Audio(state.currentPokemon.cry);
    }
  }

  function toggleGeneration(gen: number) {
    setState((prev) => {
      const gens = prev.enabledGenerations.includes(gen)
        ? prev.enabledGenerations.filter((g) => g !== gen)
        : [...prev.enabledGenerations, gen];

      return {
        ...prev,
        enabledGenerations: gens.sort((a, b) => a - b),
      };
    });
  }

  return {
    state,

    actions: {
      submitGuess,
      skip,
      reset,
      toggleSound,
      playSound,
      toggleGeneration,
    },
  };
}
