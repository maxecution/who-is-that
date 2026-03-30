import { useGame } from './hooks/useGame';

export default function App() {
  const { state, actions } = useGame();

  return (
    <div className='min-h-screen bg-slate-100 flex items-center justify-center p-6'>
      <main className='w-full max-w-md rounded-2xl bg-white shadow-lg p-8 flex flex-col items-center gap-6'>
        {/* Title */}
        <h1 className='text-4xl font-extrabold text-center bg-linear-to-r from-pokemonYellow via-pokemonBlue to-pokeballRed bg-clip-text text-transparent'>
          Who&apos;s That Pokémon?
        </h1>
        {/* Game Scores */}
        <div className='flex justify-between w-full h-px bg-slate-200 mb-4'>
          <span>Lives: {state.lives}/6</span>
          <span>Score: {state.score}</span>
        </div>

        {/* Generations */}
        <div className='flex gap-2 flex-wrap justify-center'>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
            <button
              key={gen}
              className={`px-3 py-1 rounded-full border-2 ${state.enabledGenerations.includes(gen) ? 'border-pokemonBlue bg-pokemonBlue text-white' : 'border-slate-300 bg-slate-200 text-slate-500'} hover:bg-opacity-80 transition`}
              onClick={() => {
                actions.toggleGeneration(gen);
              }}>
              Gen {gen}
            </button>
          ))}
        </div>

        <div className='w-full aspect-square rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-sm'>
          <img src={state.currentPokemon?.sprite} alt={state.currentPokemon?.name} />
        </div>

        <p className='text-slate-700 text-lg'>
          It&apos;s <span className='font-semibold'>{state.currentPokemon?.name}</span>
        </p>

        <div className='flex flex-col gap-4 w-full'>
          <input className='w-full rounded-lg border-2 border-black focus:border-pokemonBlue' name='pokemon-guess' />
          <div className='flex gap-3 w-full'>
            <button
              className='flex-1 rounded-lg bg-pokemonBlue text-white py-2 font-medium hover:opacity-90 transition'
              onClick={() => {
                actions.submitGuess((document.querySelector('input[name="pokemon-guess"]') as HTMLInputElement).value);
              }}>
              Guess
            </button>

            <button
              className='flex-1 rounded-lg bg-slate-200 py-2 font-medium hover:bg-slate-300 transition'
              onClick={() => {
                actions.skip();
              }}>
              Skip
            </button>
          </div>
          <div className='flex gap-3 w-full'>
            <button
              className={`flex-1 rounded-lg py-2 font-medium transition ${state.soundEnabled ? 'bg-pokemonYellow hover:bg-yellow-500 hover:line-through' : 'bg-slate-200 hover:bg-slate-300 line-through'} `}
              onClick={actions.toggleSound}>
              Sound
            </button>
            <button
              className='flex-1 rounded-lg bg-slate-200 py-2 font-medium hover:bg-slate-300 transition'
              onClick={actions.playSound}>
              Play Sound
            </button>
            <button
              className='flex-1 rounded-lg bg-slate-200 py-2 font-medium hover:bg-slate-300 transition'
              onClick={() => {
                actions.reset();
              }}>
              Reset
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
