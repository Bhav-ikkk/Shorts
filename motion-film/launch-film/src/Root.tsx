import React from 'react';
import { Composition } from 'remotion';
import { VIDEO_CONFIG } from './constants';
import { SpectraFilm } from './SpectraFilm';
import { XFeedFilm } from './XFeedFilm';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="SpectraLaunchFilm"
        component={SpectraFilm}
        durationInFrames={VIDEO_CONFIG.durationInFrames}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />
      <Composition
        id="SpectraXFeed"
        component={XFeedFilm}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
