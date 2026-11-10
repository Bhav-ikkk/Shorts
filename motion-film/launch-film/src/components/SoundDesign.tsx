import React from 'react';
import { Audio, staticFile } from 'remotion';

export const SoundDesign: React.FC = () => {
  return (
    <Audio
      src={staticFile('assets/spectra-soundtrack.wav')}
      volume={1.0}
    />
  );
};
