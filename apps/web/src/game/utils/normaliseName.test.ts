import { describe, it, expect } from 'vitest';
import normaliseName from './normaliseName';

describe('normaliseName', () => {
  it.each([
    ['converts uppercase to lowercase', 'Pikachu', 'pikachu'],
    ['strips diacritics / accent marks', 'Flabébé', 'flabebe'],
    ['replaces hyphens with spaces', 'ho-oh', 'ho oh'],
    ["removes straight apostrophes (')", "farfetch'd", 'farfetchd'],
    ['removes curly apostrophes (\u2019)', 'farfetch\u2019d', 'farfetchd'],
    ['trims leading and trailing whitespace', '  bulbasaur  ', 'bulbasaur'],
    ['handles a combination of transforms', 'Porygon-Z', 'porygon z'],
    ['returns an empty string unchanged', '', ''],
    ['leaves already-normalised names alone', 'charizard', 'charizard'],
  ])('%s', (_, input, expected) => {
    expect(normaliseName(input)).toBe(expected);
  });
});
