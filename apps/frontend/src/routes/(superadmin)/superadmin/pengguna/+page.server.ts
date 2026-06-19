import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request, url }) => {
  const cookieHeader = request.headers.get('cookie')
  const searchQuery = url.searchParams.get('q') ?? ''
  const role = url.searchParams.get('role') ?? ''
  const branchId = url.searchParams.get('branchId') ?? ''
  const page = url.searchParams.get('page') ?? '1'
  const limit = url.searchParams.get('limit') ?? '10'

  // Fetch branches
  const branchRes = await fetch(`${API_BASE_URL}/superadmin/branches`, {
    headers: {
      cookie: cookieHeader || ''
    }
  })

  // Fetch users
  const userRes = await fetch(
    `${API_BASE_URL}/superadmin/users?searchQuery=${encodeURIComponent(searchQuery)}&role=${encodeURIComponent(role)}&branchId=${encodeURIComponent(branchId)}&page=${page}&limit=${limit}`,
    {
      headers: {
        cookie: cookieHeader || ''
      }
    }
  )

  const branches = branchRes.ok ? (await branchRes.json()).data : []
  const users = userRes.ok ? (await userRes.json()).data : { items: [], total: 0, page: 1, limit: 10, totalPages: 0 }

  return { branches, users }
}
