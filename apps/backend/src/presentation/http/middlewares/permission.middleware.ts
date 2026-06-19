/*
Tujuan: Menyediakan guard permission granular berbasis hasil resolver authz pada context request.
Caller: Controller privat yang memerlukan pembatasan aksi lebih detail daripada role.
Dependensi: Auth context dari auth middleware dan response helper Elysia.
Main Functions: Memastikan permission yang diminta ada pada context authz sebelum controller dieksekusi.
Side Effects: Tidak ada write; dapat memutus request dengan response 403 terstruktur.
*/

export const requirePermissions = (...requiredPermissions: string[]) =>
  ({ authz, user, status }: any) => {
    if (!user?.id) {
      return status(403, {
        success: false,
        data: null,
        message: 'Sesi user tidak ditemukan',
        error: {
          code: 'FORBIDDEN'
        }
      })
    }

    const grantedPermissions = Array.isArray(authz?.permissions) ? authz.permissions : []
    const missingPermissions = requiredPermissions.filter((permission) => !grantedPermissions.includes(permission))

    if (missingPermissions.length > 0) {
      return status(403, {
        success: false,
        data: null,
        message: `Permission dibutuhkan: ${missingPermissions.join(', ')}`,
        error: {
          code: 'FORBIDDEN',
          details: {
            missingPermissions
          }
        }
      })
    }
  }

export const withPermissions = (
  requiredPermissions: string[],
  handler: (context: any) => unknown | Promise<unknown>
) =>
  async (context: any) => {
    const denial = requirePermissions(...requiredPermissions)(context)

    if (denial) {
      return denial
    }

    return handler(context)
  }
