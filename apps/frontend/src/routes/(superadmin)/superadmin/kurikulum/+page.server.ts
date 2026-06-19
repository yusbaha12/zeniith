import type { PageServerLoad } from './$types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const load: PageServerLoad = async ({ fetch, request }) => {
  const cookieHeader = request.headers.get('cookie')
  const subjectRes = await fetch(`${API_BASE_URL}/superadmin/subjects`, {
    headers: {
      cookie: cookieHeader || ''
    }
  })

  const subjects = subjectRes.ok ? (await subjectRes.json()).data : []

  // Load modules for each subject
  const subjectsWithModules = await Promise.all(
    subjects.map(async (subj: any) => {
      const moduleRes = await fetch(`${API_BASE_URL}/subjects/${subj.id}/modules`, {
        headers: {
          cookie: cookieHeader || ''
        }
      })
      const modules = moduleRes.ok ? (await moduleRes.json()).data : []
      return { ...subj, modules }
    })
  )

  return { subjects: subjectsWithModules }
}
