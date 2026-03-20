import { PokemonWithCries } from '../../routes/pokemon';

const base = {
  id: 25,
  species: { name: 'pikachu' },
  sprites: {
    other: {
      home: {
        front_default: 'home.png',
      },
    },
    front_default: 'default.png',
  },
  cries: {
    latest: 'latest.ogg',
    legacy: 'legacy.ogg',
  },
};

export const mockPokemon = {
  full(): PokemonWithCries {
    return base as unknown as PokemonWithCries;
  },

  withoutHomeSprite(): PokemonWithCries {
    return {
      ...base,
      sprites: {
        ...base.sprites,
        other: {
          home: {
            front_default: null,
          },
        },
      },
    } as unknown as PokemonWithCries;
  },

  withoutSprites(): PokemonWithCries {
    return {
      ...base,
      sprites: {
        ...base.sprites,
        other: undefined,
        front_default: null,
      },
    } as unknown as PokemonWithCries;
  },

  withoutLatestCry(): PokemonWithCries {
    return {
      ...base,
      cries: {
        latest: null,
        legacy: 'legacy.ogg',
      },
    } as unknown as PokemonWithCries;
  },

  withoutAnyCry(): PokemonWithCries {
    return {
      ...base,
      cries: {
        latest: null,
        legacy: null,
      },
    } as unknown as PokemonWithCries;
  },
};
