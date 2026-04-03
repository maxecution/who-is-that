import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import PokemonSilhouette from './PokemonSilhouette';

vi.mock('motion/react', () => ({
  motion: {
    img: ({
      animate,
      style,
      ...props
    }: React.ImgHTMLAttributes<HTMLImageElement> & { animate?: React.CSSProperties }) => (
      <img {...props} style={{ ...style, ...animate }} />
    ),
  },
}));

describe('PokemonSilhouette', () => {
  it('is fully blacked out on initial empty guess', () => {
    render(<PokemonSilhouette imageUrl='https://img.test/charmander.png' correctPokemonName='Charmander' guess='' />);

    const overlay = screen.getByAltText('Charmander silhouette');
    expect(overlay).toHaveStyle('clip-path: inset(0 0 0% 0)');
    expect(overlay).toHaveStyle('filter: brightness(0) saturate(0)');
  });

  it('is fully revealed when guess exactly matches the correct name', () => {
    render(
      <PokemonSilhouette
        imageUrl='https://img.test/charmander.png'
        correctPokemonName='Charmander'
        guess='Charmander'
      />,
    );

    const overlay = screen.getByAltText('Charmander silhouette');
    expect(overlay).toHaveStyle('clip-path: inset(0 0 100% 0)');
  });

  it('reveals 50% when half of the prefix is correct', () => {
    render(
      <PokemonSilhouette
        imageUrl='https://img.test/charmander.png'
        correctPokemonName='Charmander'
        guess='Charmeleon'
      />,
    );

    const overlay = screen.getByAltText('Charmander silhouette');
    expect(overlay).toHaveStyle('clip-path: inset(0 0 50% 0)');
  });

  it('does not reveal when guess does not match the correct name prefix', () => {
    render(
      <PokemonSilhouette
        imageUrl='https://img.test/charmander.png'
        correctPokemonName='Charmander'
        guess='Bulbasaur'
      />,
    );

    const overlay = screen.getByAltText('Charmander silhouette');
    expect(overlay).toHaveStyle('clip-path: inset(0 0 0% 0)');
  });

  it('stays blacked out when correct name is empty', () => {
    render(<PokemonSilhouette imageUrl='https://img.test/unknown.png' correctPokemonName='' guess='abc' />);

    const overlay = screen.getByAltText('silhouette');
    expect(overlay).toHaveStyle('clip-path: inset(0 0 0% 0)');
  });
});
