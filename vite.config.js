import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
    
  ],
  server: {
    host: '127.0.0.1', // Forces Vite to run on http://127.0.0.1:5173/
    port: 5173,
  },
  
  //for testing on phone in local network, but cookies does not work correctly. change base url to "/"
  // server: { 
  //   host: true,
  //   port: 5173,
  //   proxy: {
  //     '^/(accounts|reports|analytics|audits)': {
  //       target: 'http://127.0.0.1:8000/',
  //       changeOrigin: true,
  //     },
  //   },
  // },

})
