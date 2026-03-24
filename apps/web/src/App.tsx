import { type PokemonSummary } from '@who-is-that/shared-types';

export default function App() {
  const pokemon: PokemonSummary = {
    id: 25,
    name: 'Pikachu',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png',
    cry: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg',
  };

  return (
    <div className='min-h-screen bg-slate-100 flex items-center justify-center p-6'>
      <main className='w-full max-w-md rounded-2xl bg-white shadow-lg p-8 flex flex-col items-center gap-6'>
        {/* Title */}
        <h1 className='text-4xl font-extrabold text-center bg-linear-to-r from-pokemonYellow via-pokemonBlue to-pokeballRed bg-clip-text text-transparent'>
          Who&apos;s That Pokémon?
        </h1>

        <div className='w-full aspect-square rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-sm'>
          Silhouette for {pokemon.id}
        </div>

        <p className='text-slate-700 text-lg'>
          It&apos;s <span className='font-semibold'>{pokemon.name}</span>
        </p>

        <div className='flex gap-3 w-full'>
          <button className='flex-1 rounded-lg bg-pokemonBlue text-white py-2 font-medium hover:opacity-90 transition'>
            Guess
          </button>

          <button className='flex-1 rounded-lg bg-slate-200 py-2 font-medium hover:bg-slate-300 transition'>
            Skip
          </button>
        </div>
      </main>
    </div>
  );
}
