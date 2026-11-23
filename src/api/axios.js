
import axios from 'axios'

const api = axios.create({
    baseURL: '',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
    },
})

let redirecting = false

const goToSso = async () => {
    if (redirecting) return

    redirecting = true

    try {
        // Use plain axios to avoid triggering the interceptor again.
        const { data } = await axios.get('/spa/login-url')

        if (data?.url) {
            window.location.href = data.url
        } else {
            redirecting = false
            console.error('SSO login URL not received from backend.')
        }
    } catch (error) {
        redirecting = false
        console.error('Unable to redirect to SSO:', error)
    }
}

api.interceptors.response.use(
    (res) => {
        sessionStorage.removeItem('csrf_retry')
        return res
    },

    (err) => {
        const status = err.response?.status
        const requestUrl = err.config?.url || ''

        // 419 = CSRF mismatch / session expired.
        // Reload only once to retry the request.
        if (
            status === 419 &&
            !sessionStorage.getItem('csrf_retry')
        ) {
            sessionStorage.setItem('csrf_retry', '1')
            window.location.reload()
        }

        // 401 = Unauthorized.
        // Temporarily disable automatic SSO redirect for debugging.
        const isLoginCall = requestUrl.includes('/spa/login')

        if (status === 401 && !isLoginCall) {
            console.error('401 Unauthorized API:', {
                url: requestUrl,
                status: status,
                response: err.response?.data,
            })

            // Temporary debugging:
            // Do not redirect to SSO until the 401 issue is identified.
        }

        return Promise.reject(err)
    }
)

export default api
