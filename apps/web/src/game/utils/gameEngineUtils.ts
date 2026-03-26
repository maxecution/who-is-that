function getNextPokemon(remainingPool: number[]): number {
  const randomIndex = Math.floor(Math.random() * remainingPool.length);
  return remainingPool[randomIndex];
}

// intentionally keeping final Pokemon when game ends. Game will be disabled via isGameOver check. This avoids null checks for currentPokemonId across the app.
function getNextPokemonOrKeepCurrent(remainingPool: number[], currentId: number): number {
  return remainingPool.length > 0 ? getNextPokemon(remainingPool) : currentId;
}

function updateRemainingPool(remainingPool: number[], currentId: number): number[] {
  return remainingPool.filter((id) => id !== currentId);
}

function updateIncorrectPool(incorrectPool: number[], currentId: number): number[] {
  return incorrectPool.includes(currentId) ? incorrectPool : [...incorrectPool, currentId];
}

function refillRemainingPool(
  remainingPool: number[],
  incorrectPool: number[],
): { remainingPool: number[]; incorrectPool: number[] } {
  if (remainingPool.length === 0 && incorrectPool.length > 0) {
    return {
      remainingPool: [...incorrectPool],
      incorrectPool: [],
    };
  }

  return { remainingPool, incorrectPool };
}

export { getNextPokemon, getNextPokemonOrKeepCurrent, updateRemainingPool, updateIncorrectPool, refillRemainingPool };
