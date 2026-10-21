// The frame around every page: a navy sidebar on the left & current page on the right
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Box, Button, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import LogoutIcon from '@mui/icons-material/Logout'

import { useAuth } from '../context/AuthContext.jsx'
import { GOLD } from '../theme.js'

const SIDEBAR_WIDTH = 220

// SIDEBAR'S LINKS
const NAV_LINKS = [
    { to: '/', label: 'Dashboard', icon: <HomeOutlinedIcon /> },
{ to: '/recipients', label: 'Recipients', icon: <PeopleOutlinedIcon /> },
]

function AppLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    return (
        // Two-column layout: sidebar | current page
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>

        {/* ─── SIDEBAR ─── */}
        <Box
            component="nav"
            sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,               // never squeeze the sidebar
            bgcolor: 'primary.main',     // navy
            color: 'primary.contrastText',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            }}
        >
            <Typography variant="h4" sx={{ color: 'inherit', mb: 4, px: 1 }}>
            quietcart
            </Typography>

            {/* flexGrow: 1 makes the links take up the free space,
                which pushes the username and Log out to the bottom */}
            <List sx={{ flexGrow: 1 }}>
            {NAV_LINKS.map((link) => (
                <ListItemButton
                key={link.to}
                // NavLink adds the "active" class when its page is open
                component={NavLink}
                to={link.to}
                // Without "end", Dashboard ("/") would count as active on
                // every page, since every address starts with "/"
                end={link.to === '/'}
                sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    color: 'rgba(255, 255, 255, 0.75)',
                    // The current page: white text and a gold marker
                    '&.active': {
                    color: '#FFFFFF',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    borderLeft: `4px solid ${GOLD}`,
                    },
                }}
                >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} />
                </ListItemButton>
            ))}
            </List>

            <Typography variant="body2" sx={{ px: 1, mb: 1, opacity: 0.75 }}>
            Signed in as {user.username}
            </Typography>
            <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ color: 'inherit', justifyContent: 'flex-start' }}
            >
            Log out
            </Button>
        </Box>

        {/* ─── PAGE ─── */}
        {/* The current private page appears here */}
        <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
            <Outlet />
        </Box>
        </Box>
    )
}

export default AppLayout