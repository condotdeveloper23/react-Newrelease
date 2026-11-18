import axios from 'axios'

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

// 419 = CSRF token mismatch / session expired.
// 401 = session khatam / account inactive / access expired -> login page.

api.interceptors.response.use(
  (res) => {
    sessionStorage.removeItem('csrf_retry')
    return res
  },
  (err) => {
    if (err.response?.status === 419 && !sessionStorage.getItem('csrf_retry')) {
      sessionStorage.setItem('csrf_retry', '1')
      window.location.reload()
    }

    // Login request ko chhod ke, kisi bhi 401 par login page
    const isLoginCall = err.config?.url?.includes('/spa/login')
    if (
      err.response?.status === 401 &&
      !isLoginCall &&
      !window.location.pathname.startsWith('/login')
    ) {
      const code = err.response?.data?.code
      if (code) sessionStorage.setItem('logout_reason', code)
      window.location.href = '/login'
    }

    return Promise.reject(err)
  }
)

export default api