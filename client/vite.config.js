// Vite configuration for the quietcart frontend.
// Docs: https://vite.dev/config/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // DEVELOPMENT ONLY: any request starting with /api is forwarded to the Flask server.
      // To the browser, React and Flask look like one site (localhost:5173), so:
      //    - no CORS errors (no Flask-CORS needed), and
      //    - the session cookie Flask sets is sent back automatically.
      // In deployment, Flask serves the built React files itself, so this proxy isn't used there.

      '/api': 'http://localhost:5555',
    },
  },
})