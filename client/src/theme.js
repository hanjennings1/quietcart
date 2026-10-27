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
    '#FF4700', // crimson
    '#18DCF2', // cyan
    '#FF2693', // pink
    '#BBFD21', // chartreuse
    '#A77BFF', // purple
    '#F9E900', // lemon
    '#FF00FF', // magenta
    '#2EF5A0', // mint
    '#FF8800', // orange
]

// A recipient's stored color number → its hex color.
// % keeps it safe if a number is ever out of range.
export function recipientColor(colorIndex) {
    return RECIPIENT_COLORS[colorIndex % RECIPIENT_COLORS.length]
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
    shape: { borderRadius: 3 },
})

export default theme
