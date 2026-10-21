// Shown for any address that doesn't match a page, with a way back to the dashboard.
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

function NotFoundPage() {
    return (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h3" color="primary">Page not found</Typography>
        <Typography color="text.secondary" sx={{ my: 2 }}>
            This page doesn't exist, or it may have moved.
        </Typography>
        {/* A gold button that works like a link, using React Router */}
        <Button variant="contained" color="secondary" component={RouterLink} to="/">
            Back to dashboard
        </Button>
        </Box>
    )
}

export default NotFoundPage