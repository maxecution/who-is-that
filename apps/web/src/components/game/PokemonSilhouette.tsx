import { motion } from 'motion/react';
import getCorrectPrefixLength from '@web/game/utils/getCorrectPrefixLength';
import normaliseName from '@web/game/utils/normaliseName';

type PokemonSilhouetteProps = {
  imageUrl: string;
  correctPokemonName: string;
  guess: string;
};

export default function PokemonSilhouette({ imageUrl, correctPokemonName, guess }: PokemonSilhouetteProps) {
  const normalisedCorrectName = normaliseName(correctPokemonName);
  const normalisedGuess = normaliseName(guess);

  const prefixLength = getCorrectPrefixLength(normalisedCorrectName, normalisedGuess);

  const revealPercentage =
    normalisedCorrectName.length > 0
      ? Math.min(100, Math.max(0, (prefixLength / normalisedCorrectName.length) * 100))
      : 0;

  return (
    <div className='relative h-full w-full overflow-hidden rounded-xl bg-slate-200'>
      {/* Base colored image */}
      <img src={imageUrl} alt={correctPokemonName} className='h-full w-full object-contain' />

      {/* Black silhouette overlay that shrinks from the bottom as the guess improves */}
      <motion.img
        key={imageUrl}
        src={imageUrl}
        alt={`${correctPokemonName} silhouette`}
        className='absolute inset-0 h-full w-full object-contain'
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        style={{ filter: 'brightness(0) saturate(0)' }}
        animate={{
          clipPath: `inset(0 0 ${revealPercentage}% 0)`,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
      />
    </div>
  );
}
