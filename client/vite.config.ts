import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Without this, Vite's default baseline minifies media queries into the
    // modern range syntax — `@media (width<=640px)` — which Safari only
    // understands from 16.4 (March 2023). Any owner drafting from an older
    // iPhone would silently get none of the phone layout and be handed the
    // desktop board instead. CSS-only target, so the JS bundle is unaffected.
    cssTarget: 'safari14',
  },
})
