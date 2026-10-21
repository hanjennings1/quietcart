// TEMPORARY: tests the auth context. Replaced next with routing and pages.
import { Box, Button, Stack, Typography } from '@mui/material'

import { useAuth } from './context/AuthContext.jsx'

function App() {
  const { user, checkingSession, login, logout } = useAuth()

  if (checkingSession) {
    return <Typography sx={{ p: 4 }}>Checking session...</Typography>
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" color="primary">quietcart</Typography>
      <Typography sx={{ my: 2 }}>
        {user ? `Logged in as ${user.username}` : 'Not logged in'}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => login('hannah', 'giftsecret1')}>
          Log in as hannah
        </Button>
        <Button variant="outlined" onClick={logout}>Log out</Button>
      </Stack>
    </Box>
  )
}

export default App