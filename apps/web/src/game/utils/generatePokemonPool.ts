export default function generatePokemonPool(enabledGenerations: number[]): number[] {
  const pokemonPool: number[] = [];

  enabledGenerations.forEach((generation) => {
    const { generationStartId, generationEndId } = getGenerationIds(generation);

    for (let id = generationStartId; id <= generationEndId; id++) {
      pokemonPool.push(id);
    }
  });

  return pokemonPool;
}

function getGenerationIds(generation: number): { generationStartId: number; generationEndId: number } {
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
    default:
      return { generationStartId: 1, generationEndId: 151 };
  }
}
