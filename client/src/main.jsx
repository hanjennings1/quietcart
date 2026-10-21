// The app's starting point: renders <App /> into index.html's <div id="root">.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import theme from './theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Gives every MUI component inside access to quietcart's theme */}
    <ThemeProvider theme={theme}>
      {/* Resets browser default styles and applies the theme's
          background color and font to the whole page */}
      <CssBaseline />
      {/* Shares the logged-in user with every component in the app */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)