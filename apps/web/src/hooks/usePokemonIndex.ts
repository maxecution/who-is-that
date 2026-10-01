import { useEffect, useMemo, useState } from 'react';
import { type PokemonIndex } from '@who-is-that/shared-types';
import { API_BASE_URL } from '@web/constants';
import generatePokemonPool from '@web/game/utils/generatePokemonPool';

export function usePokemonIndex(enabledGenerations: number[]) {
  const [pokemonIndex, setPokemonIndex] = useState<PokemonIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadPokemonIndex = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/pokemon/index`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setError('Unable to load Pokemon names. Please try again.');
          return;
        }

        const data: PokemonIndex[] = await response.json();

        setPokemonIndex(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setError('Unable to load Pokemon names. Please check your connection.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadPokemonIndex();

    return () => {
      controller.abort();
    };
  }, []);

  // Keyed on the serialised list so a new array with identical generations does not re-filter.
  const enabledGenerationsKey = enabledGenerations.join(',');

  const enabledIds = useMemo(() => {
    const generations = enabledGenerationsKey ? enabledGenerationsKey.split(',').map(Number) : [];

    return new Set(generatePokemonPool(generations));
  }, [enabledGenerationsKey]);

  const pokemonOptions = useMemo(
    () => pokemonIndex.filter((pokemon) => enabledIds.has(pokemon.id)).map((pokemon) => pokemon.name),
    [pokemonIndex, enabledIds],
  );

  return { pokemonOptions, isLoading, error };
}
