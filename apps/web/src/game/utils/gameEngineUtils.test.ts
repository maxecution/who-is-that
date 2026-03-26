import { describe, expect, it, vi } from 'vitest';
import {
  getNextPokemon,
  getNextPokemonOrKeepCurrent,
  refillRemainingPool,
  updateIncorrectPool,
  updateRemainingPool,
} from './gameEngineUtils';

describe('gameEngineUtils', () => {
  describe('getNextPokemon', () => {
    it('returns the first Pokemon when Math.random is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      expect(getNextPokemon([1, 2, 3])).toBe(1);
    });

    it('returns the last Pokemon when Math.random is close to 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999);

      expect(getNextPokemon([1, 2, 3])).toBe(3);
    });
  });

  describe('getNextPokemonOrKeepCurrent', () => {
    it('returns a random Pokemon when remaining pool is not empty', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      expect(getNextPokemonOrKeepCurrent([10, 20, 30], 999)).toBe(20);
    });

    it('keeps current Pokemon when remaining pool is empty', () => {
      expect(getNextPokemonOrKeepCurrent([], 999)).toBe(999);
    });
  });

  describe('updateRemainingPool', () => {
    it('removes the current Pokemon from remaining pool', () => {
      expect(updateRemainingPool([1, 2, 3], 2)).toEqual([1, 3]);
    });

    it('returns same pool when current Pokemon is not in remaining pool', () => {
      expect(updateRemainingPool([1, 2, 3], 99)).toEqual([1, 2, 3]);
    });
  });

  describe('updateIncorrectPool', () => {
    it('adds current Pokemon if it is not already present', () => {
      expect(updateIncorrectPool([4, 5], 6)).toEqual([4, 5, 6]);
    });

    it('returns the same array if current Pokemon is already present', () => {
      const incorrectPool = [4, 5, 6];

      expect(updateIncorrectPool(incorrectPool, 6)).toBe(incorrectPool);
    });
  });

  describe('refillRemainingPool', () => {
    it('refills remaining pool from incorrect pool when remaining pool is empty', () => {
      const incorrectPool = [7, 8, 9];
      const result = refillRemainingPool([], incorrectPool);

      expect(result).toEqual({
        remainingPool: incorrectPool,
        incorrectPool: [],
      });
      expect(result.remainingPool).not.toBe(incorrectPool);
    });

    it('returns original pools when refill condition is not met', () => {
      const remainingPool = [1, 2];
      const incorrectPool = [7, 8];
      const result = refillRemainingPool(remainingPool, incorrectPool);

      expect(result.remainingPool).toBe(remainingPool);
      expect(result.incorrectPool).toBe(incorrectPool);
    });
  });
});
