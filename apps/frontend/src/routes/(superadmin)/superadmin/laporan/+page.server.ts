import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request }) => {
  const cookieHeader = request.headers.get('cookie')
  const statsRes = await fetch(`${API_BASE_URL}/superadmin/reports/stats`, {
    headers: {
      cookie: cookieHeader || ''
    }
  })

  const stats = statsRes.ok ? (await statsRes.json()).data : null
  return { stats }
}
