import { FastifyPluginAsync } from 'fastify';
import { type Pokemon, PokemonClient } from 'pokenode-ts';
import { PokemonIndex, PokemonSummary } from '@who-is-that/shared-types';

import pokemonIndex from '../data/pokemon-index.json';

interface PokemonWithCries extends Pokemon {
  cries?: {
    latest?: string | null;
    legacy?: string | null;
  };
}

const pokemonRoutes: FastifyPluginAsync = async (fastify) => {
  const pokemonClient = new PokemonClient();

  fastify.get('/index', async () => {
    return pokemonIndex as PokemonIndex[];
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id < 0) {
      return reply.status(400).send({
        error: 'Invalid pokemon id',
      });
    }

    if (id === 0) {
      const missingNo: PokemonSummary = { id, name: 'MissingNo' };

      return missingNo;
    }

    const pokemon: PokemonWithCries = await pokemonClient.getPokemonById(id);
    const pokemonSummary: PokemonSummary = {
      id,
      name: pokemon.species.name,
      sprite: pokemon.sprites.other?.dream_world.front_default ?? null,
      cry: pokemon.cries?.latest ?? null,
    };

    return pokemonSummary;
  });
};

export default pokemonRoutes;
