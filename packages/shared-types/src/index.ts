export interface PokemonIndex {
  id: number;
  name: string;
}
export interface PokemonSummary extends PokemonIndex {
  sprite: string;

  cry: string;
}
