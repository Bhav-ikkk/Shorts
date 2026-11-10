import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

export function getFfmpegPath() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    return ffmpegStatic;
  }
  return 'ffmpeg';
}

export function getFfprobePath() {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }
  if (ffprobeStatic && ffprobeStatic.path && fs.existsSync(ffprobeStatic.path)) {
    return ffprobeStatic.path;
  }
  return 'ffprobe';
}

export function runCommand(bin, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, {
      stdio: options.stdio || ['ignore', 'inherit', 'inherit'],
      ...options
    });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(bin)} failed with exit code ${code}`));
    });
    proc.on('error', err => reject(err));
  });
}

export function runFfmpeg(args, options = {}) {
  return runCommand(getFfmpegPath(), args, options);
}

export function runFfprobe(args, options = {}) {
  return runCommand(getFfprobePath(), args, options);
}

