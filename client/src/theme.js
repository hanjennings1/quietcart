// quietcart's Material UI theme: colors, fonts, and shapes set once here,
// so every MUI component (buttons, text fields, cards) uses them
// automatically. Change a color here and it changes everywhere.
import { createTheme } from '@mui/material/styles'

// ─── COLORS ────────────────────────────────────────────────────────────
export const NAVY = '#090E2F'   // primary: sidebar, main buttons, headings
export const GOLD = '#D3AF37'   // page accent: secondary buttons, active nav

// Neon colors for RECIPIENTS ONLY (card stripe, idea chips, budget bar).
// Always pair them with navy text: white text on neon is hard to read.
export const RECIPIENT_COLORS = [
    '#EB5E28', // paprika
    '#18DCF2', // cyan
    '#FF4FD8', // pink
    '#BBFD21', // chartreuse
    '#A77BFF', // violet
    '#F9E900', // lemon
]

// A recipient's color, based on their id.
// Using the id (not their spot in a list) means a recipient keeps the same color on every page.
export function recipientColor(recipientId) {
    return RECIPIENT_COLORS[recipientId % RECIPIENT_COLORS.length]
}


// ─── THEME ─────────────────────────────────────────────────────────────
const theme = createTheme({
    palette: {
        primary: { main: NAVY, contrastText: '#FFFFFF' },
        secondary: { main: GOLD, contrastText: NAVY },
        error: { main: '#D62839' },   // over-budget warnings, form errors
        background: {
            default: '#F5F7FB',         // soft off-white page, so neon pops
            paper: '#FFFFFF',           // cards and dialogs
        },
        text: {
            primary: '#0F1E33',
            secondary: '#55627A',
        },
    },
    typography: {
        fontFamily: '"Nunito", system-ui, sans-serif',
        // Serif headings, matching the "quietcart" title in the pitch
        h1: { fontFamily: '"DM Serif Display", Georgia, serif' },
        h2: { fontFamily: '"DM Serif Display", Georgia, serif' },
        h3: { fontFamily: '"DM Serif Display", Georgia, serif' },
        h4: { fontFamily: '"DM Serif Display", Georgia, serif' },
        h5: { fontFamily: '"DM Serif Display", Georgia, serif' },
        // MUI buttons default to ALL CAPS - changed to normal case:
        button: { textTransform: 'none', fontWeight: 600 },
    },

    // Rounded corners for cards, buttons, and inputs:
    shape: { borderRadius: 12 },
})

export default theme
