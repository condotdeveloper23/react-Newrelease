import axios from 'axios'

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

let redirecting = false

const goToSso = async () => {
  if (redirecting) return
  redirecting = true
  try {
    // plain axios (not `api`) so this call never triggers the interceptor
    const { data } = await axios.get('/spa/login-url')
    window.location.href = data.url
  } catch {
    redirecting = false
  }
}

api.interceptors.response.use(
  (res) => {
    sessionStorage.removeItem('csrf_retry')
    return res
  },
  (err) => {
    // 419 = CSRF mismatch / session expired -> reload once
    if (err.response?.status === 419 && !sessionStorage.getItem('csrf_retry')) {
      sessionStorage.setItem('csrf_retry', '1')
      window.location.reload()
    }

    // 401 = session ended / inactive account -> SSO login (URL comes from backend)
    const isLoginCall = err.config?.url?.includes('/spa/login')
    if (err.response?.status === 401 && !isLoginCall) {
      const code = err.response?.data?.code
      if (code) sessionStorage.setItem('logout_reason', code)
      goToSso()
    }

    return Promise.reject(err)
  }
)

export default api