import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request }) => {
  const cookieHeader = request.headers.get('cookie')
  const res = await fetch(`${API_BASE_URL}/superadmin/audit-logs?limit=100`, {
    headers: {
      cookie: cookieHeader || ''
    }
  })

  if (!res.ok) {
    return { logs: [] }
  }

  const result = await res.json()
  return { logs: result.data }
}
