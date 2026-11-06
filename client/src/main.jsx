// The app's starting point: renders <App /> into index.html's <div id="root">.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeModeProvider } from './context/ThemeModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Picks the regular or winter theme and gives it to every MUI component inside */}
    <ThemeModeProvider>
      {/* Lets the app show different pages based on the address bar */}
      <BrowserRouter>
        {/* Shares the logged-in user with every component in the app */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  </StrictMode>,
)