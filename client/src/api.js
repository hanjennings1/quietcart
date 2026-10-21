// One helper for every request to the Flask API.
//
// Usage:
//   const recipients = await apiFetch('/recipients')
//   const gift = await apiFetch('/gifts', { method: 'POST', body: { name: 'Mug' } })
//
// On success, returns the parsed JSON.
// On failure, throws an error containing Flask's error message,
// so pages can display it to the user.

export async function apiFetch(path, { method = 'GET', body } = {}) {
    const response = await fetch(`/api${path}`, {
        method,
        //only send a body (as JSON text) when there is one:
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        // session cookie sent automatically;
        // Vite proxy makes Flask look like the same site (no extra setting)
    })

    // 204 No Content (logout, delete) has no body to read
    const data = response.status === 204 ? null : await response.json().catch(() => null)

    // response.ok is true for any 2xx status
    if (!response.ok) {
        const error = new Error(data?.error ?? 'Something went wrong. Please try again.')
        // attach the status code so callers can react to it:
        error.status = response.status
        throw error
    }

    return data
}