import { type PokemonSummary } from '@who-is-that/shared-types';
export type GameState = {
  currentPokemonId: number;
  lives: number;
  score: number;
  remainingPool: number[];
  incorrectPool: number[];
};

export type UseGameState = GameState & {
  isGameOver: boolean;
  currentPokemon: PokemonSummary | null;
  isLoading: boolean;
  error: string | null;

  enabledGenerations: number[];
  soundEnabled: boolean;
};

export type PokemonGeneration = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
