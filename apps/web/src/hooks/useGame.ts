import { useEffect, useState } from 'react';
import { type GameSessionState } from '@web/types/game';
import { type PokemonSummary } from '@who-is-that/shared-types';
import {
  initialiseGame,
  submitGuess as engineSubmitGuess,
  skipPokemon,
  isGameOver as checkIsGameOver,
} from '@web/game/gameEngine';
import generatePokemonPool from '@web/game/utils/generatePokemonPool';
import normaliseName from '@web/game/utils/normaliseName';
import { STORAGE_KEY, API_BASE_URL } from '@web/constants';

function playCry(cryUrl: string) {
  const audio = new Audio(cryUrl);
  void audio.play().catch(() => undefined);
}

function loadState(): Partial<GameSessionState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state: GameSessionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Hook
export function useGame() {
  const [state, setState] = useState<GameSessionState>(() => {
    const saved = loadState();

    if (saved) return saved as GameSessionState;

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
    if (
      state.soundEnabled &&
      state.currentPokemon?.cry &&
      state.currentPokemon.id === state.currentPokemonId &&
      !state.isGameOver
    ) {
      playCry(state.currentPokemon.cry);
    }
  }, [state.currentPokemon, state.currentPokemonId, state.soundEnabled, state.isGameOver]);

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
        playCry(prev.currentPokemon.cry);
      }

      return {
        ...prev,
        soundEnabled: nextEnabled,
      };
    });
  }

  function playSound() {
    if (state.currentPokemon?.cry) {
      playCry(state.currentPokemon.cry);
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
