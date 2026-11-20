import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 
const target = 'http://192.168.1.98:8001'
 
export default defineConfig({
  plugins: [react()],
  server: {
      host: true,
    port: 5174,
    proxy: {
      '/spa': { target, changeOrigin: true },
      '/sso': { target, changeOrigin: true },
      '/logout-chain': { target, changeOrigin: true },
      '/global-logout': { target, changeOrigin: true },
      // '/first-login-password': { target, changeOrigin: true },
      '/logout-done': { target, changeOrigin: true },
                  '/user': { target, changeOrigin: true },
      '/report/audit_trial_user_report_pdf': { target, changeOrigin: true },
      '/download': { target, changeOrigin: false },
      '/projects/data': { target, changeOrigin: true },
'/projects/edit': { target, changeOrigin: true },
'/project/store': { target, changeOrigin: true },
'/project/update': { target, changeOrigin: true },
 
     
    },
  },
})