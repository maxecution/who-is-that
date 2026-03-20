import { FastifyPluginAsync } from 'fastify';
import { pokemonClient } from '../clients/pokeapiClient';
import { type Pokemon } from 'pokenode-ts';
import { PokemonIndex, PokemonSummary } from '@who-is-that/shared-types';
import pokemonIndex from '../data/pokemon-index.json';

export interface PokemonWithCries extends Pokemon {
  cries?: {
    latest?: string | null;
    legacy?: string | null;
  };
}

const pokemonRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/index', async () => {
    return pokemonIndex as PokemonIndex[];
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id < 1 || id > 1025) {
      return reply.status(400).send({
        error: 'Invalid pokemon id',
      });
    }

    const pokemon: PokemonWithCries = await pokemonClient.getPokemonById(id);
    const pokemonSummary: PokemonSummary = {
      id,
      name: pokemon.species.name,
      sprite: pokemon.sprites.other?.home.front_default ?? pokemon.sprites.front_default ?? null,
      cry: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
    };

    return pokemonSummary;
  });
};

export default pokemonRoutes;
