import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { composeProject } from './compose/compose.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

  export async function composeScene(projectName = 'spectra') {
    const projectDir = path.resolve(rootDir, 'projects', projectName);
    const configPath = path.join(projectDir, 'project.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Project configuration not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // If declarative archetype scenes exist in project.json, compile directly!
    if (config.scenes && Array.isArray(config.scenes) && config.scenes.length > 0) {
      console.log(`[Composer] Compiling declarative project.json for '${projectName}' (${config.scenes.length} archetypes)...`);
      return await composeProject(projectName);
    }

    // Legacy fallback if bespoke files are present
    const scenesDir = path.join(projectDir, 'scenes');
    const buildDir = path.join(projectDir, 'build');
    fs.mkdirSync(buildDir, { recursive: true });

    const styleFile = path.join(scenesDir, 'style.css');
    const bodyFile = path.join(scenesDir, 'body.html');
    const jsFile = path.join(scenesDir, 'choreography.js');

    if (!fs.existsSync(styleFile) || !fs.existsSync(bodyFile) || !fs.existsSync(jsFile)) {
      throw new Error(`Missing scene files in ${scenesDir} and no declarative scenes[] in project.json.`);
    }

    console.warn(`[Composer] Warning: Using legacy bespoke scene files in ${scenesDir}. Migrate to project.json archetypes.`);

    let css = fs.readFileSync(styleFile, 'utf8');
    const body = fs.readFileSync(bodyFile, 'utf8');
    const js = fs.readFileSync(jsFile, 'utf8');

    const nodeModulesDir = path.join(rootDir, 'node_modules');
    css = css.replace(/url\(['"]?(?:node_modules|\.\.\/\.\.\/\.\.\/node_modules)\/([^'"]+)['"]?\)/g, (match, subpath) => {
      const fullFontPath = path.join(nodeModulesDir, subpath);
      return `url('${pathToFileURL(fullFontPath).href}')`;
    });

    const gsapUrl = pathToFileURL(path.join(nodeModulesDir, 'gsap', 'dist', 'gsap.min.js')).href;
    const lottieUrl = pathToFileURL(path.join(nodeModulesDir, 'lottie-web', 'build', 'player', 'lottie.min.js')).href;

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${config.name} — Motion Design Film</title>
<style>
${css}
</style>
</head>
<body>
${body}
<script src="${gsapUrl}"></script>
<script src="${lottieUrl}"></script>
<script src="anchors.js"></script>
<script>
${js}
</script>
</body>
</html>`;

    const outputPath = path.join(buildDir, 'index.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`[Composer] Compiled motion canvas to: ${outputPath} (${html.length} bytes)`);
    return outputPath;
  }

  if (process.argv[1] && process.argv[1].endsWith('scene_composer.js')) {
    const p = process.argv[2] || 'spectra';
    composeScene(p);
  }
