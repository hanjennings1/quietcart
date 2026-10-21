// Shares "Who's Logged In" with whole app and actions that change it (login. logout, signup)

// Any component can read it with:
//  const { user, login, logout } = useAuth()
import { createContext, useContext, useEffect, useState } from 'react'

import { apiFetch } from '../api.js'

// The shared space that holds the auth values (starts empty (null)):
const AuthContext = createContext(null)

// Wraps the app (in main.jsx), so everything inside can use useAuth()
export function AuthProvider({ children }) {

    // the logged-in user from Flask, or null
    const [user, setUser] = useState(null)

    // True until the first session check finishes.
    // Without it, page refresh would briefly look like log-out/redirct to /login
    const [checkingSession, setCheckingSession] = useState(true)

    // On first load and every refresh, ask Flask if someone's logged in
    // The session cookie survives refreshes, so this restores the user
    useEffect(() => {
        apiFetch('/check_session')
            .then((sessionUser) => setUser(sessionUser))
            .catch(() => setUser(null))     // 401: no one's logged in
            .finally(() => setCheckingSession(false))
    }, [])

    // Each action calls Flask, then updates the shared user.
    // Errors (like "Invalid username or password.") are NOT caught here
    async function login(username, password) {
        const loggedInUser = await apiFetch('/login', {
            method: 'POST',
            body: { username, password }
        })
        setUser(loggedInUser)
    }

    async function signup(username, password) {
        const newUser = await apiFetch('/signup', {
            method: 'POST',
            body: { username, password }
        })
        setUser(newUser)        // signup also logs in
    }

    async function logout() {
        await apiFetch('/logout', {method: 'DELETE' })
        setUser(null)
    }

    // Everything inside this Provider can read these values:
    return (
        <AuthContext.Provider value={{ user, checkingSession, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Lets any component read the auth valus [like: const { user } = useAuth()]
// eslint-disable-next-line react-refresh/only-export-components -- safe to ignore; this hook belongs with its Provider
export function useAuth() {
    const context = useContext(AuthContext)

    // Catches a common mistake [using useAuth() outside of <AuthProvider>]
    if (context === null) {
        throw new Error('useAuth must be used inside <AuthProvider>')
    }

    return context
}