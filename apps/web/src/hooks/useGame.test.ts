import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initialiseGame,
  isGameOver as checkIsGameOver,
  skipPokemon,
  submitGuess as engineSubmitGuess,
} from '@web/game/gameEngine';
import generatePokemonPool from '@web/game/utils/generatePokemonPool';
import { type GameSessionState } from '@web/types/game';
import { useGame } from './useGame';
import { STORAGE_KEY } from '@web/constants';

vi.mock('@web/game/gameEngine', () => ({
  initialiseGame: vi.fn(),
  submitGuess: vi.fn(),
  skipPokemon: vi.fn(),
  isGameOver: vi.fn(),
}));

vi.mock('@web/game/utils/generatePokemonPool', () => ({
  default: vi.fn(),
}));

// Mocks
const mockPokemon = {
  id: 25,
  name: 'pikachu',
  sprite: 'https://example.com/pikachu.png',
  cry: 'https://example.com/pikachu.ogg',
};

const mockGameState = {
  currentPokemonId: 25,
  lives: 6,
  score: 0,
  remainingPool: [151],
  incorrectPool: [],
};

function makeGameSessionState(overrides: Partial<GameSessionState> = {}): GameSessionState {
  return {
    ...mockGameState,
    isGameOver: false,
    currentPokemon: null,
    isLoading: false,
    error: null,
    enabledGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    soundEnabled: false,
    ...overrides,
  };
}

// Setup

const mockAudioPlay = vi.fn().mockResolvedValue(undefined);
const mockAudio = vi.fn(function MockAudio() {
  return { play: mockAudioPlay };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubGlobal('Audio', mockAudio);
  vi.stubGlobal('fetch', vi.fn());

  vi.mocked(generatePokemonPool).mockReturnValue([25, 151]);
  vi.mocked(initialiseGame).mockReturnValue(mockGameState);
  vi.mocked(engineSubmitGuess).mockReturnValue({ ...mockGameState, score: 1 });
  vi.mocked(skipPokemon).mockReturnValue({ ...mockGameState, currentPokemonId: 151, lives: 5 });
  vi.mocked(checkIsGameOver).mockReturnValue(false);

  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => mockPokemon,
  } as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// Tests

describe('useGame', () => {
  describe('initial state', () => {
    it('initialises a fresh game when no saved state exists', async () => {
      const { result } = renderHook(() => useGame());

      expect(generatePokemonPool).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(initialiseGame).toHaveBeenCalledWith([25, 151]);
      expect(result.current.state.currentPokemonId).toBe(25);
      expect(result.current.state.lives).toBe(6);
      expect(result.current.state.score).toBe(0);
      expect(result.current.state.isGameOver).toBe(false);
      expect(result.current.state.soundEnabled).toBe(false);
      expect(result.current.state.enabledGenerations).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('restores state from localStorage when a saved state exists', () => {
      const savedState = makeGameSessionState({
        currentPokemonId: 151,
        lives: 3,
        score: 5,
        soundEnabled: true,
        enabledGenerations: [1, 2],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      expect(initialiseGame).not.toHaveBeenCalled();
      expect(result.current.state.currentPokemonId).toBe(151);
      expect(result.current.state.lives).toBe(3);
      expect(result.current.state.score).toBe(5);
      expect(result.current.state.soundEnabled).toBe(true);
      expect(result.current.state.enabledGenerations).toEqual([1, 2]);
    });

    it('falls back to a fresh game when localStorage contains invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useGame());

      expect(initialiseGame).toHaveBeenCalled();
      expect(result.current.state.currentPokemonId).toBe(25);
    });
  });

  describe('fetch effect', () => {
    it('sets currentPokemon on a successful fetch', async () => {
      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.currentPokemon).toEqual(mockPokemon);
      });

      expect(fetch).toHaveBeenCalledWith('/api/pokemon/25');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('sets a generic client error message when the fetch response is 4xx', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe('Unable to load Pokémon right now. Please try again.');
      });

      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.currentPokemon).toBeNull();
    });

    it('sets a rate limit message with retry-after when status is 429', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '10' }),
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe('Too many requests. Please wait 10 seconds and try again.');
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('sets a fallback rate limit message when retry-after header is a non-numeric value', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': 'Some time later' }),
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe('Too many requests. Please wait a moment and try again.');
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('sets a fallback rate limit message when the 429 response has no retry-after header', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers(),
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe('Too many requests. Please wait a moment and try again.');
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('sets a server error message when the fetch response is 5xx', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers(),
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe('Server error while loading Pokémon. Please try again.');
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('sets a generic error message for unexpected non-ok responses outside 4xx/5xx range', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 302,
        headers: new Headers(),
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe('Failed to load Pokémon');
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('sets a network-specific message when fetch throws', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useGame());

      await waitFor(() => {
        expect(result.current.state.error).toBe(
          'Network error while loading Pokémon. Check your connection and try again.',
        );
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('skips the fetch when the game is over', async () => {
      const savedState = makeGameSessionState({ isGameOver: true, currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      renderHook(() => useGame());
      await act(async () => {});

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('persist effect', () => {
    it('saves state to localStorage after a state change', async () => {
      const { result } = renderHook(() => useGame());

      await waitFor(() => expect(result.current.state.currentPokemon).not.toBeNull());

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved.currentPokemonId).toBe(25);
      expect(saved.currentPokemon).toEqual(mockPokemon);
    });
  });

  describe('sound effect', () => {
    it('plays the cry when soundEnabled, cry exists, and game is not over', () => {
      const savedState = makeGameSessionState({ soundEnabled: true, currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      renderHook(() => useGame());

      expect(mockAudio).toHaveBeenCalledWith(mockPokemon.cry);
    });

    it('does not play when soundEnabled is false', () => {
      const savedState = makeGameSessionState({ soundEnabled: false, currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      renderHook(() => useGame());

      expect(mockAudio).not.toHaveBeenCalled();
    });

    it('does not play when game is over', () => {
      const savedState = makeGameSessionState({ soundEnabled: true, currentPokemon: mockPokemon, isGameOver: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      renderHook(() => useGame());

      expect(mockAudio).not.toHaveBeenCalled();
    });

    it('does not play when currentPokemon has no cry', () => {
      const savedState = makeGameSessionState({
        soundEnabled: true,
        currentPokemon: { ...mockPokemon, cry: '' },
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      renderHook(() => useGame());

      expect(mockAudio).not.toHaveBeenCalled();
    });
  });

  describe('submitGuess action', () => {
    it('does nothing when currentPokemon is null', async () => {
      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.submitGuess('pikachu');
      });

      expect(engineSubmitGuess).not.toHaveBeenCalled();
    });

    it('does nothing when the game is already over', async () => {
      const savedState = makeGameSessionState({ isGameOver: true, currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.submitGuess('pikachu');
      });

      expect(engineSubmitGuess).not.toHaveBeenCalled();
    });

    it('calls the engine with isCorrect=true when the guess matches the Pokemon name', async () => {
      const savedState = makeGameSessionState({ currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.submitGuess('pikachu');
      });

      expect(engineSubmitGuess).toHaveBeenCalledWith(expect.anything(), true);
    });

    it('calls the engine with isCorrect=false when the guess does not match', async () => {
      const savedState = makeGameSessionState({ currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.submitGuess('bulbasaur');
      });

      expect(engineSubmitGuess).toHaveBeenCalledWith(expect.anything(), false);
    });

    it('sets isGameOver when the engine signals the game is over', async () => {
      const savedState = makeGameSessionState({ currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      vi.mocked(checkIsGameOver).mockReturnValue(true);

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.submitGuess('pikachu');
      });

      expect(result.current.state.isGameOver).toBe(true);
    });
  });

  describe('skip action', () => {
    it('does nothing when the game is already over', async () => {
      const savedState = makeGameSessionState({ isGameOver: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.skip();
      });

      expect(skipPokemon).not.toHaveBeenCalled();
    });

    it('moves to the next Pokemon and decrements lives', async () => {
      const savedState = makeGameSessionState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.skip();
      });

      expect(skipPokemon).toHaveBeenCalled();
      expect(result.current.state.currentPokemonId).toBe(151);
      expect(result.current.state.lives).toBe(5);
    });

    it('sets isGameOver when the engine signals the game is over after a skip', async () => {
      const savedState = makeGameSessionState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      vi.mocked(checkIsGameOver).mockReturnValue(true);

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.skip();
      });

      expect(result.current.state.isGameOver).toBe(true);
    });
  });

  describe('reset action', () => {
    it('resets game state while preserving enabledGenerations and soundEnabled', async () => {
      const savedState = makeGameSessionState({ enabledGenerations: [1, 2], soundEnabled: true, score: 10, lives: 1 });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
      vi.mocked(initialiseGame).mockReturnValue(mockGameState);

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.reset();
      });

      expect(generatePokemonPool).toHaveBeenLastCalledWith([1, 2]);
      expect(result.current.state.score).toBe(0);
      expect(result.current.state.lives).toBe(6);
      expect(result.current.state.enabledGenerations).toEqual([1, 2]);
      expect(result.current.state.soundEnabled).toBe(true);
      expect(result.current.state.isGameOver).toBe(false);
    });
  });

  describe('toggleSound action', () => {
    it('toggles soundEnabled from false to true', async () => {
      const savedState = makeGameSessionState({ soundEnabled: false });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.toggleSound();
      });

      expect(result.current.state.soundEnabled).toBe(true);
    });

    it('toggles soundEnabled from true to false', async () => {
      const savedState = makeGameSessionState({ soundEnabled: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.toggleSound();
      });

      expect(result.current.state.soundEnabled).toBe(false);
    });

    it('plays the cry immediately when enabling sound and cry exists', async () => {
      const savedState = makeGameSessionState({ soundEnabled: false, currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());
      mockAudio.mockClear();

      await act(async () => {
        result.current.actions.toggleSound();
      });

      expect(mockAudio).toHaveBeenCalledWith(mockPokemon.cry);
    });

    it('does not play the cry when enabling sound but currentPokemon has no cry', async () => {
      const noCryPokemon = { ...mockPokemon, cry: '' };
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => noCryPokemon } as Response);

      const savedState = makeGameSessionState({ soundEnabled: false, currentPokemon: noCryPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.toggleSound();
      });

      expect(mockAudio).not.toHaveBeenCalled();
    });

    it('does not play the cry when disabling sound', async () => {
      const savedState = makeGameSessionState({ soundEnabled: true, currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());
      mockAudio.mockClear();

      await act(async () => {
        result.current.actions.toggleSound();
      });

      expect(mockAudio).not.toHaveBeenCalled();
    });
  });

  describe('playSound action', () => {
    it('plays the cry when currentPokemon has a cry URL', async () => {
      const savedState = makeGameSessionState({ currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());
      mockAudio.mockClear();

      await act(async () => {
        result.current.actions.playSound();
      });

      expect(mockAudio).toHaveBeenCalledWith(mockPokemon.cry);
    });

    it('does nothing when currentPokemon is null', async () => {
      const savedState = makeGameSessionState({ currentPokemon: null });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());
      mockAudio.mockClear();

      await act(async () => {
        result.current.actions.playSound();
      });

      expect(mockAudio).not.toHaveBeenCalled();
    });

    it('silently swallows errors when audio playback is rejected', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAudioPlay.mockRejectedValueOnce(new DOMException('Autoplay blocked', 'NotAllowedError'));

      const savedState = makeGameSessionState({ currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());
      mockAudio.mockClear();

      await expect(
        act(async () => {
          result.current.actions.playSound();
        }),
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to play cry:', expect.any(DOMException));

      consoleErrorSpy.mockRestore();
    });

    it('logs nothing in production when audio playback fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.stubEnv('DEV', false);
      mockAudioPlay.mockRejectedValueOnce(new DOMException('Autoplay blocked', 'NotAllowedError'));

      const savedState = makeGameSessionState({ currentPokemon: mockPokemon });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());
      mockAudio.mockClear();

      await expect(
        act(async () => {
          result.current.actions.playSound();
        }),
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      vi.unstubAllEnvs();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('toggleGeneration action', () => {
    it('removes a generation that is already enabled', async () => {
      const savedState = makeGameSessionState({ enabledGenerations: [1, 2, 3] });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.toggleGeneration(2);
      });

      expect(result.current.state.enabledGenerations).toEqual([1, 3]);
    });

    it('adds a generation and keeps the list sorted', async () => {
      const savedState = makeGameSessionState({ enabledGenerations: [1, 3] });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      const { result } = renderHook(() => useGame());

      await act(async () => {
        result.current.actions.toggleGeneration(2);
      });

      expect(result.current.state.enabledGenerations).toEqual([1, 2, 3]);
    });
  });
});
