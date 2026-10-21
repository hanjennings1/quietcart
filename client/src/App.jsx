// The app's map: which page shows at which address.
import { Route, Routes } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import AppLayout from './components/AppLayout.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'


// TEMPORARY: stands in for the dashboard until it's built
function DashboardPlaceholder() {
  const { user } = useAuth()
  return (
    <Box>
      <Typography variant="h3" color="primary">Dashboard</Typography>
      <Typography sx={{ my: 2 }}>Logged in as {user.username}</Typography>
    </Box>
  )
}

function App() {
  return (
    // Routes shows the FIRST Route whose path matches the address bar
    <Routes>
      {/* Guest pages: only for logged-out users */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Private pages: ProtectedRoute checks login first, then AppLayout
          draws the sidebar, then the matching page appears inside it */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPlaceholder />} />
          {/* "*" matches any address no other route matched */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App