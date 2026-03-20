import { PokemonClient } from 'pokenode-ts';
export const pokemonClient = new PokemonClient({
  cacheOptions: {
    ttl: 1000 * 60 * 60 * 24,
  },
});
