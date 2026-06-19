/*
Tujuan: Menjalankan seed database backend untuk auth, RBAC, paket, ruang belajar, dan ujian secara berurutan dan idempoten.
Caller: Script `bun run db:seed`.
Dependensi: Drizzle db, schema auth/RBAC/paket/learning/exam, dan data seed backend aktif.
Main Functions: Menghapus data development lama dengan urutan aman lalu mengisi ulang baseline authz, katalog, ruang belajar, dan ujian.
Side Effects: Menulis dan menghapus data pada tabel permission, role permission, learning, subscriptions, orders, users, branches, packages, dan exam engine.
*/

import { db, sql } from '../connection'
import {
  answers,
  branches,
  examResults,
  exams,
  examSessions,
  materialProgresses,
  materials,
  modules,
  options,
  orders,
  packageFeatures,
  packageSubjects,
  packages,
  permissionAudits,
  permissions,
  questions,
  rolePermissions,
  subjects,
  subscriptions,
  userPermissions,
  users
} from '../schema'
import { branchesSeed } from './01-branches.seed'
import { usersSeed } from './02-users.seed'
import { packageFeaturesSeed, packagesSeed } from './03-packages.seed'
import { permissionsSeed, rolePermissionCodes } from './04-rbac.seed'
import { materialsSeed, modulesSeed, subjectsSeed } from './04-learning.seed'
import { buildExamsSeed } from './05-exams.seed'

const run = async () => {
  try {
    const { examsSeed, questionsSeed, optionsSeed } = buildExamsSeed()
    await db.transaction(async (transaction) => {
      await transaction.delete(examResults)
      await transaction.delete(answers)
      await transaction.delete(examSessions)
      await transaction.delete(options)
      await transaction.delete(questions)
      await transaction.delete(exams)
      await transaction.delete(permissionAudits)
      await transaction.delete(userPermissions)
      await transaction.delete(rolePermissions)
      await transaction.delete(permissions)
      await transaction.delete(materialProgresses)
      await transaction.delete(materials)
      await transaction.delete(modules)
      await transaction.delete(subjects)
      await transaction.delete(subscriptions)
      await transaction.delete(orders)
      await transaction.delete(users)
      await transaction.delete(packageFeatures)
      await transaction.delete(packageSubjects)
      await transaction.delete(packages)
      await transaction.delete(branches)

      await transaction.insert(branches).values(branchesSeed.map((branch) => ({
        ...branch
      })))

      await transaction.insert(packages).values(packagesSeed.map((packageItem) => ({
        ...packageItem
      })))

      await transaction.insert(packageFeatures).values(packageFeaturesSeed.map((feature) => ({
        ...feature
      })))

      const hashedUsers = await Promise.all(
        usersSeed.map(async (user) => ({
          id: user.id,
          branchId: user.branchId,
          name: user.name,
          email: user.email,
          passwordHash: await Bun.password.hash(user.password, {
            algorithm: 'bcrypt',
            cost: 12
          }),
          phone: user.phone,
          role: user.role,
          avatarUrl: null,
          isActive: user.isActive
        }))
      )

      await transaction.insert(users).values(hashedUsers)

      const insertedPermissions = await transaction.insert(permissions).values(
        permissionsSeed.map((permission) => ({
          ...permission
        }))
      ).returning({
        id: permissions.id,
        code: permissions.code
      })

      const permissionIdByCode = new Map(
        insertedPermissions.map((permission) => [permission.code, permission.id])
      )

      const rolePermissionRows = Object.entries(rolePermissionCodes).flatMap(([role, codes]) =>
        codes.map((code) => {
          const permissionId = permissionIdByCode.get(code)

          if (!permissionId) {
            throw new Error(`Permission code tidak ditemukan saat seed RBAC: ${code}`)
          }

          return {
            role: role as keyof typeof rolePermissionCodes,
            permissionId
          }
        })
      )

      await transaction.insert(rolePermissions).values(rolePermissionRows)

      await transaction.insert(subjects).values(subjectsSeed.map((subject) => ({
        ...subject
      })))

      await transaction.insert(modules).values(modulesSeed.map((moduleItem) => ({
        ...moduleItem
      })))

      await transaction.insert(materials).values(materialsSeed.map((material) => ({
        ...material
      })))

      await transaction.insert(exams).values(examsSeed.map((exam) => ({
        ...exam
      })))

      await transaction.insert(questions).values(questionsSeed.map((question) => ({
        ...question
      })))

      await transaction.insert(options).values(optionsSeed.map((option) => ({
        ...option
      })))
    })

    console.log(JSON.stringify({
      status: 'ok',
      message: 'Seed auth, RBAC, paket, ruang belajar, dan ujian berhasil dijalankan'
    }))
  } catch (error) {
    console.error('[db:seed]', error)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

void run()
