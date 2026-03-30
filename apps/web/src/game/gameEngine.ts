import { type GameState } from '../types/game';
import {
  getNextPokemon,
  getNextPokemonOrKeepCurrent,
  updateRemainingPool,
  updateIncorrectPool,
  refillRemainingPool,
} from './utils/gameEngineUtils';

function initialiseGame(pokemonPool: number[], initialLives: number = 6): GameState {
  const firstPokemon = getNextPokemon(pokemonPool);

  return {
    currentPokemonId: firstPokemon,
    lives: initialLives,
    score: 0,
    remainingPool: pokemonPool.filter((id) => id !== firstPokemon),
    incorrectPool: [],
  };
}

function submitGuess(state: GameState, isCorrect: boolean): GameState {
  const nextRemainingPool = updateRemainingPool(state.remainingPool, state.currentPokemonId);
  const nextIncorrectPool = isCorrect
    ? state.incorrectPool
    : updateIncorrectPool(state.incorrectPool, state.currentPokemonId);
  const nextLives = isCorrect ? state.lives : state.lives - 1;

  const { remainingPool, incorrectPool } =
    nextLives > 0
      ? refillRemainingPool(nextRemainingPool, nextIncorrectPool)
      : { remainingPool: nextRemainingPool, incorrectPool: nextIncorrectPool };

  return {
    ...state,
    score: isCorrect ? state.score + 1 : state.score,
    lives: nextLives,
    remainingPool,
    incorrectPool,
    currentPokemonId: getNextPokemonOrKeepCurrent(remainingPool, state.currentPokemonId),
  };
}

function skipPokemon(state: GameState): GameState {
  const nextRemainingPool = updateRemainingPool(state.remainingPool, state.currentPokemonId);
  const nextIncorrectPool = updateIncorrectPool(state.incorrectPool, state.currentPokemonId);
  const nextLives = state.lives - 1;
  const { remainingPool, incorrectPool } =
    nextLives > 0
      ? refillRemainingPool(nextRemainingPool, nextIncorrectPool)
      : { remainingPool: nextRemainingPool, incorrectPool: nextIncorrectPool };

  return {
    ...state,
    lives: nextLives,
    incorrectPool,
    remainingPool,
    currentPokemonId: getNextPokemonOrKeepCurrent(remainingPool, state.currentPokemonId),
  };
}

function isGameOver(state: GameState): boolean {
  const noMorePokemon = state.remainingPool.length === 0 && state.incorrectPool.length === 0;

  return state.lives <= 0 || noMorePokemon;
}

function resetGame(pokemonPool: number[], initialLives: number = 6): GameState {
  return initialiseGame(pokemonPool, initialLives);
}

export { initialiseGame, submitGuess, skipPokemon, isGameOver, resetGame };
