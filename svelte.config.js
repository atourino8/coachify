import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Runtime explícito porque tu Node local (v24) está por delante de lo
      // que adapter-vercel soporta para autodetectar. Node 22 es el LTS actual
      // y el más reciente soportado por Vercel.
      runtime: 'nodejs22.x'
    }),
    alias: {
      $lib: './src/lib',
      '$lib/*': './src/lib/*'
    }
  }
};

export default config;
