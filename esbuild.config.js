// ... (importaciones y configuraciones iniciales como antes) ...
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const { dependencies, peerDependencies } = require('./package.json');

const isDev = process.env.NODE_ENV !== 'production';
const outdir = 'dist';
const outfile = path.join(outdir, 'index.js');

const externalPackages = [...Object.keys(dependencies || {}), ...Object.keys(peerDependencies || {})];
if (!externalPackages.includes('playwright')) {
    externalPackages.push('playwright');
}

async function runBuild() {
  // Limpiar directorio solo si no es dev o si no existe
  if (!isDev && fs.existsSync(outdir)) {
    console.log(`Cleaning ${outdir}...`);
    fs.rmSync(outdir, { recursive: true, force: true });
  }
   if (!fs.existsSync(outdir)){ // Asegurar que exista para la salida
      fs.mkdirSync(outdir, { recursive: true }); // Asegura que el directorio exista
  }

  const buildOptions = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs', // o 'esm'
    outfile: outfile,
    external: externalPackages,
    sourcemap: isDev ? 'inline' : false,
    minify: !isDev,
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    },
    logLevel: 'info',
  };

  const ctx = await esbuild.context(buildOptions);

  if (isDev) {
    // En desarrollo, solo inicia el watcher de esbuild.
    await ctx.watch();
    console.log(`[esbuild] Watching for changes... Output: ${outfile}`);
    // ¡No iniciamos nodemon desde aquí!
  } else {
    // Build de producción (sin watch)
    console.log(`[esbuild] Building for production... Output: ${outfile}`);
    await ctx.rebuild();
    await ctx.dispose(); // Libera recursos después del build de producción
    console.log('[esbuild] Production build finished successfully!');
  }
}

runBuild().catch((e) => {
  console.error('[esbuild] Build failed:', e);
  process.exit(1);
});

// const esbuild = require('esbuild');

// console.log('Starting esbuild build...'); // Agrega un log para confirmar que se ejecuta

// esbuild.build({
//   entryPoints: ['src/index.ts'], // Punto de entrada de tu aplicación
//   bundle: true,                  // Empaqueta todo en un solo archivo
//   platform: 'node',              // Plataforma de destino (Node.js)
//   target: 'node22',              // Versión específica de Node.js
//   outfile: 'dist/index.js',      // Archivo de salida
//   external: [
//     'playwright'                 // Marca solo 'playwright' como externo
//                                  // Esbuild no intentará empaquetarlo.
//                                  // Se usará la versión de node_modules en tiempo de ejecución.
//   ],
//   // Opcional: sourcemap puede ser útil para depurar
//   // sourcemap: true,
// }).then(() => {
//   console.log('Build finished successfully!');
// }).catch((e) => {
//   console.error('Build failed:', e); // Muestra el error si falla
//   process.exit(1);
// });