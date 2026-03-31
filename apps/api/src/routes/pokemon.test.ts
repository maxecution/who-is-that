import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildServer } from '../server';
import { pokemonClient } from '../clients/pokeapiClient';
import { mockPokemon } from '../test/mocks/pokemon.mock';

describe('Pokemon API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const app = buildServer(true);

  describe('GET /pokemon/index', () => {
    it('returns list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/pokemon/index',
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toEqual(1025);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
    });
  });

  describe('GET /pokemon/:id', () => {
    it('returns correct pokemon summary when all data is available', async () => {
      vi.spyOn(pokemonClient, 'getPokemonById').mockResolvedValue(mockPokemon.full());

      const res = await app.inject({
        method: 'GET',
        url: '/api/pokemon/25',
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body).toMatchObject({
        id: 25,
        name: 'pikachu',
        sprite: 'home.png',
        cry: 'latest.ogg',
      });
    });

    it('falls back to default sprite when home sprite is not available', async () => {
      vi.spyOn(pokemonClient, 'getPokemonById').mockResolvedValue(mockPokemon.withoutHomeSprite());

      const res = await app.inject({
        method: 'GET',
        url: '/api/pokemon/25',
      });

      const body = res.json();

      expect(body.sprite).toBe('default.png');
    });

    it('returns empty string for sprites, when no sprite exists', async () => {
      vi.spyOn(pokemonClient, 'getPokemonById').mockResolvedValue(mockPokemon.withoutSprites());

      const res = await app.inject({
        method: 'GET',
        url: '/api/pokemon/25',
      });

      const body = res.json();

      expect(body.sprite).toBe('');
    });

    it('falls back to legacy cry when latest cry is not available', async () => {
      vi.spyOn(pokemonClient, 'getPokemonById').mockResolvedValue(mockPokemon.withoutLatestCry());

      const body = (
        await app.inject({
          method: 'GET',
          url: '/api/pokemon/25',
        })
      ).json();

      expect(body.cry).toBe('legacy.ogg');
    });

    it('returns empty string for cries, when no cry exists', async () => {
      vi.spyOn(pokemonClient, 'getPokemonById').mockResolvedValue(mockPokemon.withoutAnyCry());

      const body = (
        await app.inject({
          method: 'GET',
          url: '/api/pokemon/25',
        })
      ).json();

      expect(body.cry).toBe('');
    });
    it('returns 400 for invalid id', async () => {
      const resString = await app.inject({
        method: 'GET',
        url: '/api/pokemon/invalid',
      });

      expect(resString.statusCode).toBe(400);

      const resNegative = await app.inject({
        method: 'GET',
        url: '/api/pokemon/-1',
      });

      expect(resNegative.statusCode).toBe(400);

      const resTooHigh = await app.inject({
        method: 'GET',
        url: '/api/pokemon/1026',
      });

      expect(resTooHigh.statusCode).toBe(400);
    });
  });

  describe('Rate limiting', () => {
    it('returns 429 when /index limit is exceeded (40 requests/minute)', async () => {
      const responses = await Promise.all(
        Array.from({ length: 40 }, () => app.inject({ method: 'GET', url: '/api/pokemon/index' })),
      );
      responses.forEach((res) => expect(res.statusCode).toBe(200));

      const limited = await app.inject({ method: 'GET', url: '/api/pokemon/index' });
      expect(limited.statusCode).toBe(429);
    });

    it('returns 429 when /:id limit is exceeded (60 requests/minute)', async () => {
      vi.spyOn(pokemonClient, 'getPokemonById').mockResolvedValue(mockPokemon.full());

      const responses = await Promise.all(
        Array.from({ length: 60 }, () => app.inject({ method: 'GET', url: '/api/pokemon/25' })),
      );
      responses.forEach((res) => expect(res.statusCode).toBe(200));

      const limited = await app.inject({ method: 'GET', url: '/api/pokemon/25' });
      expect(limited.statusCode).toBe(429);
    });
  });
});
