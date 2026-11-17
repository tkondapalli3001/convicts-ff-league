// npm run workers (and automatically before build and dev): bundles each Web
// Worker entry into public/workers/<name>.js. Turbopack (Next 16.2) copies a
// `new Worker(new URL('x.ts', import.meta.url))` target as a raw .ts file
// instead of compiling it, so the browser can't run it; esbuild does the
// bundling instead. The output is generated, not committed (.gitignore).

import { build } from 'esbuild'

const WORKERS = {
  'odds-worker': 'lib/current-season/odds-worker.ts',
  'schedule-worker': 'lib/stats/schedule-worker.ts',
}

await build({
  entryPoints: WORKERS,
  outdir: 'public/workers',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  logLevel: 'warning',
})
console.log(`workers: ${Object.keys(WORKERS).join(', ')} → public/workers/`)
