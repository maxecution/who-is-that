import { afterEach, describe, expect, it, vi } from 'vitest';
import { initialiseGame, isGameOver, resetGame, skipPokemon, submitGuess } from './gameEngine';

describe('gameEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialiseGame', () => {
    it('selects random Pokemon based on Math.random and removes it from the remaining pool', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = initialiseGame([1, 2, 3]);

      expect(result).toEqual({
        currentPokemonId: 1,
        lives: 6,
        score: 0,
        remainingPool: [2, 3],
        incorrectPool: [],
      });
    });

    it('uses custom initial lives when provided', () => {
      const result = initialiseGame([1], 3);

      expect(result.lives).toBe(3);
    });
  });

  describe('submitGuess', () => {
    it('increments score and keeps lives on correct guess', () => {
      // Single Pokemon in remaining pool makes next Pokemon deterministic
      const state = { currentPokemonId: 1, lives: 6, score: 0, remainingPool: [2], incorrectPool: [] };

      const result = submitGuess(state, true);

      expect(result.score).toBe(1);
      expect(result.lives).toBe(6);
      expect(result.incorrectPool).toEqual([]);
      expect(result.currentPokemonId).toBe(2);
    });

    it('refills remaining pool from incorrect pool on correct guess when remaining pool is empty', () => {
      const state = { currentPokemonId: 1, lives: 6, score: 0, remainingPool: [], incorrectPool: [5] };

      const result = submitGuess(state, true);

      expect(result.score).toBe(1);
      expect(result.lives).toBe(6);
      expect(result.remainingPool).toEqual([5]);
      expect(result.incorrectPool).toEqual([]);
      expect(result.currentPokemonId).toBe(5);
    });

    it('decrements lives and adds Pokemon to incorrect pool on incorrect guess', () => {
      const state = { currentPokemonId: 2, lives: 6, score: 0, remainingPool: [3], incorrectPool: [1] };

      const result = submitGuess(state, false);

      expect(result.score).toBe(0);
      expect(result.lives).toBe(5);
      expect(result.incorrectPool).toEqual([1, 2]);
      expect(result.currentPokemonId).toBe(3);
    });

    it('does not refill remaining pool when lives reach zero on incorrect guess', () => {
      const state = { currentPokemonId: 2, lives: 1, score: 0, remainingPool: [3], incorrectPool: [1] };

      const result = submitGuess(state, false);

      expect(result.lives).toBe(0);
      expect(result.remainingPool).toEqual([3]);
      expect(result.incorrectPool).toEqual([1, 2]);
      expect(result.currentPokemonId).toBe(3);
    });
  });

  describe('skipPokemon', () => {
    it('decrements lives, adds skipped Pokemon to incorrect pool, and advances to next', () => {
      const state = { currentPokemonId: 2, lives: 6, score: 0, remainingPool: [3], incorrectPool: [1] };

      const result = skipPokemon(state);

      expect(result.lives).toBe(5);
      expect(result.incorrectPool).toEqual([1, 2]);
      expect(result.currentPokemonId).toBe(3);
    });

    it('refills remaining pool from incorrect pool when remaining pool is exhausted on skip', () => {
      const state = { currentPokemonId: 5, lives: 6, score: 0, remainingPool: [], incorrectPool: [] };

      const result = skipPokemon(state);

      expect(result.lives).toBe(5);
      expect(result.remainingPool).toEqual([5]);
      expect(result.incorrectPool).toEqual([]);
      expect(result.currentPokemonId).toBe(5);
    });

    it('does not refill remaining pool when lives reach zero on skip', () => {
      const state = { currentPokemonId: 2, lives: 1, score: 0, remainingPool: [3], incorrectPool: [1] };

      const result = skipPokemon(state);

      expect(result.lives).toBe(0);
      expect(result.remainingPool).toEqual([3]);
      expect(result.incorrectPool).toEqual([1, 2]);
      expect(result.currentPokemonId).toBe(3);
    });
  });

  describe('isGameOver', () => {
    it('returns true when lives are zero', () => {
      expect(isGameOver({ currentPokemonId: 1, lives: 0, score: 0, remainingPool: [2], incorrectPool: [3] })).toBe(
        true,
      );
    });

    it('returns true when both pools are empty', () => {
      expect(isGameOver({ currentPokemonId: 1, lives: 2, score: 0, remainingPool: [], incorrectPool: [] })).toBe(true);
    });

    it('returns false when lives remain and Pokemon are still available', () => {
      expect(isGameOver({ currentPokemonId: 1, lives: 2, score: 0, remainingPool: [2], incorrectPool: [] })).toBe(
        false,
      );
    });
  });

  describe('resetGame', () => {
    it('returns a fresh initial game state', () => {
      const result = resetGame([1]);

      expect(result).toEqual({
        currentPokemonId: 1,
        lives: 6,
        score: 0,
        remainingPool: [],
        incorrectPool: [],
      });
    });
  });
});
