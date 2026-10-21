// TEMPORARY: previews the theme. Replaced next with routing and pages.
import { Box, Button, Stack, Typography } from '@mui/material'

import { RECIPIENT_COLORS } from './theme.js'

function App() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" color="primary">quietcart</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        your private shopping list for the people you love
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained">Save idea</Button>
        <Button variant="contained" color="secondary">Add recipient</Button>
        <Button variant="outlined">Cancel</Button>
      </Stack>

      <Stack direction="row" spacing={1}>
        {RECIPIENT_COLORS.map((color) => (
          <Box key={color} sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: color }} />
        ))}
      </Stack>
    </Box>
  )
}

export default App