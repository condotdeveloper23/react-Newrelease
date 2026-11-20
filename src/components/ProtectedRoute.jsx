import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api/axios'

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, data: null, ok: false })

  useEffect(() => {
    api
      .get('/spa/me')
      .then(({ data }) => setState({ loading: false, data, ok: true }))
      .catch(async (e) => {
        // Only a 401 means "not logged in". axios.js interceptor already
        // redirects to SSO on 401, so this is just a safety net.
        if (e.response?.status === 401) {
          try {
            // plain axios so the interceptor is not triggered again
            const { data } = await axios.get('/spa/login-url')
            window.location.href = data.url
            return
          } catch {
            // fall through to error state
          }
        }
        setState({ loading: false, data: null, ok: false, error: true })
      })
  }, [])

  if (state.loading) {
    return <div className="p-5 text-center">Loading...</div>
  }

  if (!state.ok) {
    return (
      <div className="p-5 text-center">
        {state.error ? 'Unable to reach the server. Please refresh.' : 'Redirecting to login...'}
      </div>
    )
  }

  return typeof children === 'function' ? children(state.data) : children
}