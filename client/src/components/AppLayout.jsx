// The frame around every page: a navy sidebar on the left & current page on the right
import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import {
    Box, Button, List, ListItemButton, ListItemIcon, ListItemText, Snackbar, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'

import QuickAddDialog from './QuickAddDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { GOLD } from '../theme.js'

const SIDEBAR_WIDTH = 220

// SIDEBAR'S LINKS
const NAV_LINKS = [
    { to: '/', label: 'Dashboard', icon: <HomeOutlinedIcon /> },
    { to: '/recipients', label: 'Recipients', icon: <PeopleOutlinedIcon /> },
    { to: '/calendar', label: 'Calendar', icon: <CalendarMonthOutlinedIcon /> },
]

function AppLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    // On a recipient's page (/recipients/:id), this is their id.
    // Used to pre-select them in the quick-add pop-up.
    const { id } = useParams()

    // QUICK ADD
    const [quickAddOpen, setQuickAddOpen] = useState(false)
    const [savedMessage, setSavedMessage] = useState('')   // '' = no message showing

    // Goes up by one every time an idea is quick-added.
    // Pages watch it (through the Outlet below) and reload their data when it changes.
    const [dataVersion, setDataVersion] = useState(0)


    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    // Runs after the pop-up saves an idea
    function handleQuickAddSaved(recipient) {
        setQuickAddOpen(false)
        setSavedMessage(`Idea saved for ${recipient.name}`)
        setDataVersion((version) => version + 1)
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
                    // STICKY: exactly one screen tall and pinned while the page scrolls,
                    // so + Idea stays at the top and Log out at the bottom, always visible
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflowY: 'auto',           // a very short window can still scroll the sidebar itself
                }}
            >
                <Typography variant="h4" sx={{ color: 'inherit', mb: 4, px: 1 }}>
                    quietcart
                </Typography>

                {/* QUICK ADD: gold so it stands out, at the top so it's always in the same spot on every page */}
                <Button
                    variant="contained"
                    color="secondary"       // gold
                    startIcon={<AddIcon />}
                    onClick={() => {
                        document.activeElement?.blur()   // let the dialog take focus cleanly
                        setQuickAddOpen(true)
                    }}
                    sx={{ mb: 3 }}
                >
                    Idea
                </Button>

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
            <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
                {/* "context" shares dataVersion with whichever page is showing */}
                <Outlet context={{ dataVersion }} />
            </Box>

            {/* ─── QUICK ADD ─── */}
            <QuickAddDialog
                open={quickAddOpen}
                onClose={() => setQuickAddOpen(false)}
                onSaved={handleQuickAddSaved}
                // On a recipient's page, pre-select them (ids in the address are text)
                defaultRecipientId={id ? Number(id) : null}
            />

            {/* A brief "Idea saved for Emma" message at the bottom of the screen */}
            <Snackbar
                open={savedMessage !== ''}
                message={savedMessage}
                autoHideDuration={3000}   // disappears after 3 seconds
                onClose={() => setSavedMessage('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />


        </Box>
    )
}

export default AppLayout