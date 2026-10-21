// The app's map: which page shows at which address.
import { Route, Routes } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import GuestRoute from './components/GuestRoute.jsx'


// TEMPORARY: stands in for the dashboard until it's built
function DashboardPlaceholder() {
  const { user, logout } = useAuth()
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" color="primary">Dashboard</Typography>
      <Typography sx={{ my: 2 }}>
        {user ? `Logged in as ${user.username}` : 'Not logged in'}
      </Typography>
      <Button variant="outlined" onClick={logout}>Log out</Button>
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

      {/* Private pages: ProtectedRoute checks login first, then
          shows the matching page inside it (through its <Outlet />) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPlaceholder />} />
      </Route>
    </Routes>
  )
}

export default App