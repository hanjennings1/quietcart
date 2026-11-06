/*
 * ThemeModeContext: remembers whether the winter theme is on,
 * and wraps the app in the matching MUI theme.
 * The choice is saved in this browser (localStorage), so it survives a refresh.
 */

import { createContext, useContext, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { themes } from '../theme.js'

const STORAGE_KEY = 'quietcart-theme'
const ThemeModeContext = createContext(null)

// Read the saved choice; some private windows block storage, so fall back to regular
function loadWinter() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'winter'
    } catch {
        return false
    }
}

export function ThemeModeProvider({ children }) {
    // passing the function (not loadWinter()) reads storage once, on the first render only
    const [winter, setWinter] = useState(loadWinter)

    function toggleWinter() {
        const next = !winter
        setWinter(next)
        try {
            localStorage.setItem(STORAGE_KEY, next ? 'winter' : 'regular')
        } catch {
            // couldn't save; the theme still switches for this visit
        }
    }

    return (
        <ThemeModeContext.Provider value={{ winter, toggleWinter }}>
            <ThemeProvider theme={winter ? themes.winter : themes.regular}>
                {/* Resets browser default styles and applies the theme's background and font */}
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    )
}

// Any component can call useThemeMode() to read or flip the choice
export function useThemeMode() {
    return useContext(ThemeModeContext)
}