import { describe, expect, it } from 'vitest';
import generatePokemonPool from './generatePokemonPool';

describe('generatePokemonPool', () => {
  it('returns an empty pool when no generations are enabled', () => {
    expect(generatePokemonPool([])).toEqual([]);
  });

  it('returns all IDs for generation 1', () => {
    const pool = generatePokemonPool([1]);

    expect(pool).toHaveLength(151);
    expect(pool[0]).toBe(1);
    expect(pool[pool.length - 1]).toBe(151);
  });

  it('returns all IDs for generation 9', () => {
    const pool = generatePokemonPool([9]);

    expect(pool).toHaveLength(102);
    expect(pool[0]).toBe(907);
    expect(pool[pool.length - 1]).toBe(1008);
  });

  it('concatenates IDs in ascending order even when generations are provided out of order', () => {
    const pool = generatePokemonPool([3, 2]);

    expect(pool[0]).toBe(152);
    expect(pool[99]).toBe(251);
    expect(pool[100]).toBe(252);
    expect(pool[pool.length - 1]).toBe(386);
    expect(pool).toHaveLength(235);
  });

  it('ignores unknown generation values', () => {
    const pool = generatePokemonPool([99]);
    expect(pool).toEqual([]);
  });

  it('keeps only unique generation values between 1 and 9', () => {
    const pool = generatePokemonPool([-1, 0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(pool).toHaveLength(1008);
    expect(pool[0]).toBe(1);
    expect(pool[150]).toBe(151);
    expect(pool[151]).toBe(152);
    expect(pool[250]).toBe(251);
    expect(pool[251]).toBe(252);
    expect(pool[pool.length - 1]).toBe(1008);
  });
});
