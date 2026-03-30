export default function getCorrectPrefixLength(correctName: string, guess: string): number {
  const minLength = Math.min(correctName.length, guess.length);

  for (let i = 0; i < minLength; i++) {
    if (correctName[i] !== guess[i]) {
      return i;
    }
  }

  return minLength;
}
