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
  void audio.play().catch((error: unknown) => {
    if (import.meta.env.DEV) {
      console.error('Failed to play cry:', error);
    }
  });
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

function getApiErrorMessage(response: Response): string {
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after');

    if (retryAfter) {
      const retryAfterSeconds = Number(retryAfter);

      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return `Too many requests. Please wait ${retryAfterSeconds} seconds and try again.`;
      }

      return 'Too many requests. Please wait a moment and try again.';
    }

    return 'Too many requests. Please wait a moment and try again.';
  }

  if (response.status >= 500) {
    return 'Server error while loading Pokémon. Please try again.';
  }

  if (response.status >= 400) {
    return 'Unable to load Pokémon right now. Please try again.';
  }

  return 'Failed to load Pokémon';
}

async function fetchPokemonSummary(id: number): Promise<{ data: PokemonSummary | null; error: string | null }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pokemon/${id}`);

    if (!res.ok) {
      return { data: null, error: getApiErrorMessage(res) };
    }

    const data: PokemonSummary = await res.json();
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: 'Network error while loading Pokémon. Check your connection and try again.',
    };
  }
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
    if (state.isGameOver || state.currentPokemon?.id === state.currentPokemonId) return;

    const fetchPokemon = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await fetchPokemonSummary(state.currentPokemonId);

      if (error) {
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        currentPokemon: data,
        isLoading: false,
      }));
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
    if (!state.currentPokemon || state.isGameOver || state.isLoading) return;

    const normalisedGuess = normaliseName(guess);
    const normalisedName = normaliseName(state.currentPokemon.name);

    const isCorrect = normalisedGuess === normalisedName;

    const next = engineSubmitGuess(state, isCorrect);
    const nextIsGameOver = checkIsGameOver(next);

    if (nextIsGameOver) {
      setState((prev) => ({
        ...prev,
        ...next,
        isGameOver: true,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    void fetchPokemonSummary(next.currentPokemonId).then(({ data, error }) => {
      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        ...next,
        isGameOver: false,
        currentPokemon: data,
        isLoading: false,
        error: null,
      }));
    });
  }

  function skip() {
    if (state.isGameOver || state.isLoading) return;

    const next = skipPokemon(state);
    const nextIsGameOver = checkIsGameOver(next);

    if (nextIsGameOver) {
      setState((prev) => ({
        ...prev,
        ...next,
        isGameOver: true,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    void fetchPokemonSummary(next.currentPokemonId).then(({ data, error }) => {
      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        ...next,
        isGameOver: false,
        currentPokemon: data,
        isLoading: false,
        error: null,
      }));
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
