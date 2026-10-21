// Guards the login and signup pages: only logged-OUT users see them.
// (Logged-in users are sent to the dashboard instead; the mirror image of ProtectedRoute.)

import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { useAuth } from '../context/AuthContext.jsx'

function GuestRoute() {
    const { user, checkingSession } = useAuth()

    // Waiting for Flask to answer "WHO IS LOGGED IN"
    if (checkingSession) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    // LOGGED IN: go to dashboard
    if (user) {
        return <Navigate to="/" replace />
    }

    // LOGGED OUT: show login/signup page
    return <Outlet />
}

export default GuestRoute
