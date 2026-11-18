import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, data: null, ok: false })

  useEffect(() => {
    api.get('/spa/me')
      .then(({ data }) => setState({ loading: false, data, ok: true }))
      .catch(() => {
        // Not logged in: go to SSO, then come back via /sso-login
        const back = encodeURIComponent(window.location.origin + '/sso-login')
        window.location.href = `${import.meta.env.VITE_SSO_URL}/sso/check?redirect=${back}`
      })
  }, [])

  if (state.loading || !state.ok) {
    return <div className="p-5 text-center">Loading...</div>
  }

  return typeof children === 'function' ? children(state.data) : children
}