import { describe, expect, it } from 'vitest';
import getCorrectPrefixLength from './getCorrectPrefixLength';

describe('getCorrectPrefixLength', () => {
  it.each([
    ['returns 0 for empty strings', '', '', 0],
    ['returns full length for identical strings', 'pikachu', 'pikachu', 7],
    ['returns prefix until first mismatch in middle', 'charizard', 'charcoal', 4],
    ['returns 0 when first character mismatches', 'bulbasaur', 'charmander', 0],
    ['returns guess length when guess is a full prefix of correct name', 'squirtle', 'squir', 5],
    ['returns correct name length when correct name is a full prefix of guess', 'mew', 'mewtwo', 3],
  ])('%s', (_, correctName, guess, expected) => {
    expect(getCorrectPrefixLength(correctName, guess)).toBe(expected);
  });
});
