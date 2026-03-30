import { type PokemonGeneration } from '@web/types/game';
export default function generatePokemonPool(enabledGenerations: number[]): number[] {
  const pokemonPool: number[] = [];
  const validGenerations = sanitiseGenerations(enabledGenerations);

  validGenerations.forEach((generation) => {
    const { generationStartId, generationEndId } = getGenerationIds(generation);

    for (let id = generationStartId; id <= generationEndId; id++) {
      pokemonPool.push(id);
    }
  });

  return pokemonPool;
}

function sanitiseGenerations(enabledGenerations: number[]): PokemonGeneration[] {
  const uniqueGenerations = new Set<PokemonGeneration>();

  enabledGenerations.forEach((generation) => {
    if (Number.isInteger(generation) && generation >= 1 && generation <= 9) {
      uniqueGenerations.add(generation as PokemonGeneration);
    }
  });

  return Array.from(uniqueGenerations).sort((a, b) => a - b);
}

function getGenerationIds(generation: PokemonGeneration): { generationStartId: number; generationEndId: number } {
  switch (generation) {
    case 1:
      return { generationStartId: 1, generationEndId: 151 };
    case 2:
      return { generationStartId: 152, generationEndId: 251 };
    case 3:
      return { generationStartId: 252, generationEndId: 386 };
    case 4:
      return { generationStartId: 387, generationEndId: 494 };
    case 5:
      return { generationStartId: 495, generationEndId: 650 };
    case 6:
      return { generationStartId: 651, generationEndId: 722 };
    case 7:
      return { generationStartId: 723, generationEndId: 810 };
    case 8:
      return { generationStartId: 811, generationEndId: 906 };
    case 9:
      return { generationStartId: 907, generationEndId: 1008 };
  }
}
