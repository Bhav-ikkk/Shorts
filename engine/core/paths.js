import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory of video-gen
export const ROOT_DIR = path.resolve(__dirname, '..', '..');

export function getRootDir() {
  return ROOT_DIR;
}

export function getProjectDir(projectName) {
  return path.resolve(ROOT_DIR, 'projects', projectName);
}

export function getProjectBuildDir(projectName) {
  return path.resolve(ROOT_DIR, 'projects', projectName, 'build');
}

export function getProjectAudioDir(projectName) {
  return path.resolve(ROOT_DIR, 'projects', projectName, 'audio');
}

export function getProjectScenesDir(projectName) {
  return path.resolve(ROOT_DIR, 'projects', projectName, 'scenes');
}

export function getProjectConfigFile(projectName) {
  return path.resolve(ROOT_DIR, 'projects', projectName, 'project.json');
}

export function getOutDir() {
  return path.resolve(ROOT_DIR, 'out');
}

export function getNodeModulesDir() {
  return path.resolve(ROOT_DIR, 'node_modules');
}

export function toFileUrl(absPath) {
  return pathToFileURL(absPath).href;
}

