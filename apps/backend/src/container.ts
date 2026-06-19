/*
Tujuan: Menjadi komposisi dependency backend fase 5 beserta fondasi runtime authorization granular untuk health, auth, profile, paket, ruang belajar, mesin ujian, dan realtime leaderboard.
Caller: Bootstrap `src/index.ts`.
Dependensi: Config service, DB connection, repo, service, middleware, queue scheduler/worker, gateway realtime, dan controller HTTP.
Main Functions: Membuat object dependency yang dipakai bootstrap tanpa hard-code tersebar untuk fase 1-7 awal.
Side Effects: Menyiapkan instance singleton Redis/DB/storage, gateway realtime, service authorization, dan menyatukan dependency runtime backend.
*/

import { AuthService } from './application/services/auth.service'
import { AuthorizationService } from './application/services/authorization.service'
import { ExamService } from './application/services/exam.service'
import { ListBranchesUseCase } from './application/use-cases/branch/list-branches.usecase'
import { LoginUseCase } from './application/use-cases/auth/login.usecase'
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.usecase'
import { RegisterUseCase } from './application/use-cases/auth/register.usecase'
import { CreateExamUseCase } from './application/use-cases/exam/create-exam.usecase'
import { CreateQuestionUseCase } from './application/use-cases/exam/create-question.usecase'
import { GetExamDetailUseCase } from './application/use-cases/exam/get-exam-detail.usecase'
import { GetExamLeaderboardUseCase } from './application/use-cases/exam/get-exam-leaderboard.usecase'
import { GetExamResultUseCase } from './application/use-cases/exam/get-exam-result.usecase'
import { GetSessionSnapshotUseCase } from './application/use-cases/exam/get-session-snapshot.usecase'
import { GetTeacherExamDetailUseCase } from './application/use-cases/exam/get-teacher-exam-detail.usecase'
import { ListExamsUseCase } from './application/use-cases/exam/list-exams.usecase'
import { ListTeacherExamsUseCase } from './application/use-cases/exam/list-teacher-exams.usecase'
import { StartExamUseCase } from './application/use-cases/exam/start-exam.usecase'
import { SubmitAnswerUseCase } from './application/use-cases/exam/submit-answer.usecase'
import { SubmitExamUseCase } from './application/use-cases/exam/submit-exam.usecase'
import { GetAdaptiveRecommendationUseCase } from './application/use-cases/exam/get-adaptive-recommendation.usecase'
import { UpdateQuestionUseCase } from './application/use-cases/exam/update-question.usecase'
import { PaymentService } from './application/services/payment.service'
import { MaterialService } from './application/services/material.service'
import { LeaderboardService } from './application/services/leaderboard.service'
import { CreateMaterialUseCase } from './application/use-cases/material/create-material.usecase'
import { DeleteMaterialUseCase } from './application/use-cases/material/delete-material.usecase'
import { GetMaterialDetailUseCase } from './application/use-cases/material/get-material-detail.usecase'
import { GetTeacherMaterialDetailUseCase } from './application/use-cases/material/get-teacher-material-detail.usecase'
import { ListMaterialsByModuleUseCase } from './application/use-cases/material/list-materials-by-module.usecase'
import { ListModulesBySubjectUseCase } from './application/use-cases/material/list-modules-by-subject.usecase'
import { ListSubjectsUseCase } from './application/use-cases/material/list-subjects.usecase'
import { ListTeacherMaterialsUseCase } from './application/use-cases/material/list-teacher-materials.usecase'
import { TrackMaterialProgressUseCase } from './application/use-cases/material/track-material-progress.usecase'
import { UpdateMaterialUseCase } from './application/use-cases/material/update-material.usecase'
import { UploadMaterialImageUseCase } from './application/use-cases/material/upload-material-image.usecase'
import { GetPackageDetailUseCase } from './application/use-cases/package/get-package-detail.usecase'
import { ListPackagesUseCase } from './application/use-cases/package/list-packages.usecase'
import { ListBranchOrdersUseCase } from './application/use-cases/order/list-branch-orders.usecase'
import { ListMyOrdersUseCase } from './application/use-cases/order/list-my-orders.usecase'
import { PurchasePackageUseCase } from './application/use-cases/order/purchase-package.usecase'
import { VerifyOrderUseCase } from './application/use-cases/order/verify-order.usecase'
import { GetActiveSubscriptionUseCase } from './application/use-cases/subscription/get-active-subscription.usecase'
import { GetProfileUseCase } from './application/use-cases/user/get-profile.usecase'
import { UpdatePasswordUseCase } from './application/use-cases/user/update-password.usecase'
import { UpdateProfileUseCase } from './application/use-cases/user/update-profile.usecase'
import { loadConfig } from './application/services/config.service'
import { db, dbReplica } from './infrastructure/database/connection'
import { ExamProcessingQueue } from './infrastructure/queues/exam-processing.queue'
import { SubscriptionExpiryScheduler } from './infrastructure/queues/subscription-expiry.scheduler'
import { WeeklyReportScheduler } from './infrastructure/queues/weekly-report.scheduler'
import { getRedisClient } from './infrastructure/redis/redis.client'
import { ExamRepositoryImpl } from './infrastructure/repositories/exam.repository.impl'
import { BranchRepositoryImpl } from './infrastructure/repositories/branch.repository.impl'
import { MaterialRepositoryImpl } from './infrastructure/repositories/material.repository.impl'
import { ModuleRepositoryImpl } from './infrastructure/repositories/module.repository.impl'
import { OrderRepositoryImpl } from './infrastructure/repositories/order.repository.impl'
import { PackageRepositoryImpl } from './infrastructure/repositories/package.repository.impl'
import { PermissionRepositoryImpl } from './infrastructure/repositories/permission.repository.impl'
import { SubscriptionRepositoryImpl } from './infrastructure/repositories/subscription.repository.impl'
import { UserRepositoryImpl } from './infrastructure/repositories/user.repository.impl'
import { ObjectStorageService } from './infrastructure/storage/object-storage.service'
import { createAdminOrderController } from './presentation/http/controllers/admin-order.controller'
import { createAuthController } from './presentation/http/controllers/auth.controller'
import { createBranchController } from './presentation/http/controllers/branch.controller'
import { createExamController } from './presentation/http/controllers/exam.controller'
import { createHealthController } from './presentation/http/controllers/health.controller'
import { createMaterialController } from './presentation/http/controllers/material.controller'
import { createOrderController } from './presentation/http/controllers/order.controller'
import { createPackageController } from './presentation/http/controllers/package.controller'
import { createTeacherExamController } from './presentation/http/controllers/teacher-exam.controller'
import { createTeacherMaterialController } from './presentation/http/controllers/teacher-material.controller'
import { createUserController } from './presentation/http/controllers/user.controller'
import { createAuthMiddleware } from './presentation/http/middlewares/auth.middleware'
import { createSubscriptionMiddleware } from './presentation/http/middlewares/subscription.middleware'
import { rateLimit } from './presentation/http/middlewares/rate-limit.middleware'
import { RealtimeGateway } from './presentation/websocket/realtime.gateway'
import { logger } from './shared/utils/logger.util'

// Proctoring Phase 6 Imports
import { LogProctorEventUseCase } from './application/use-cases/proctor/log-proctor-event.usecase'
import { WarnStudentUseCase } from './application/use-cases/proctor/warn-student.usecase'
import { GetLiveProctorDataUseCase } from './application/use-cases/proctor/get-live-proctor-data.usecase'
import { GetProctorLogUseCase } from './application/use-cases/proctor/get-proctor-log.usecase'
import { TerminateSessionUseCase } from './application/use-cases/proctor/terminate-session.usecase'
import { ProctorRepositoryImpl } from './infrastructure/repositories/proctor.repository.impl'
import { createProctorController } from './presentation/http/controllers/proctor.controller'

// Admin & Super Admin Phase 7 Imports
import { AdminRepositoryImpl } from './infrastructure/repositories/admin.repository.impl'
import { GetBranchStatsUseCase } from './application/use-cases/admin/get-branch-stats.usecase'
import { GetNationalStatsUseCase } from './application/use-cases/admin/get-national-stats.usecase'
import { GetAuditLogsUseCase } from './application/use-cases/admin/get-audit-logs.usecase'
import { GetSystemSettingsUseCase } from './application/use-cases/admin/get-system-settings.usecase'
import { UpdateSystemSettingsUseCase } from './application/use-cases/admin/update-system-settings.usecase'
import { ExportBranchReportUseCase } from './application/use-cases/admin/export-branch-report.usecase'

import { SuperadminListExamsUseCase } from './application/use-cases/superadmin/list-all-exams.usecase'
import { SuperadminGetExamDetailUseCase } from './application/use-cases/superadmin/get-exam-detail.usecase'
import { SuperadminCreateQuestionUseCase } from './application/use-cases/superadmin/create-question.usecase'
import { SuperadminUpdateQuestionUseCase } from './application/use-cases/superadmin/update-question.usecase'
import { ListAllBranchesUseCase } from './application/use-cases/branch/list-all-branches.usecase'
import { CreateBranchUseCase } from './application/use-cases/branch/create-branch.usecase'
import { UpdateBranchUseCase } from './application/use-cases/branch/update-branch.usecase'
import { DeleteBranchUseCase } from './application/use-cases/branch/delete-branch.usecase'

import { ListUsersUseCase } from './application/use-cases/user/list-users.usecase'
import { CreateUserUseCase } from './application/use-cases/user/create-user.usecase'
import { UpdateUserUseCase } from './application/use-cases/user/update-user.usecase'
import { DeleteUserUseCase } from './application/use-cases/user/delete-user.usecase'

import { ListAllPackagesUseCase } from './application/use-cases/package/list-all-packages.usecase'
import { CreatePackageUseCase } from './application/use-cases/package/create-package.usecase'
import { UpdatePackageUseCase } from './application/use-cases/package/update-package.usecase'
import { DeletePackageUseCase } from './application/use-cases/package/delete-package.usecase'
import { ListPackageFeaturesUseCase } from './application/use-cases/package/list-package-features.usecase'
import { CreatePackageFeatureUseCase } from './application/use-cases/package/create-package-feature.usecase'
import { UpdatePackageFeatureUseCase } from './application/use-cases/package/update-package-feature.usecase'
import { DeletePackageFeatureUseCase } from './application/use-cases/package/delete-package-feature.usecase'
import { ListPackageSubjectsUseCase } from './application/use-cases/package/list-package-subjects.usecase'
import { AssignPackageSubjectsUseCase } from './application/use-cases/package/assign-package-subjects.usecase'

import { ListAllSubjectsUseCase } from './application/use-cases/material/list-all-subjects.usecase'
import { CreateSubjectUseCase } from './application/use-cases/material/create-subject.usecase'
import { UpdateSubjectUseCase } from './application/use-cases/material/update-subject.usecase'
import { DeleteSubjectUseCase } from './application/use-cases/material/delete-subject.usecase'
import { CreateModuleUseCase } from './application/use-cases/material/create-module.usecase'
import { UpdateModuleUseCase } from './application/use-cases/material/update-module.usecase'
import { DeleteModuleUseCase } from './application/use-cases/material/delete-module.usecase'

import { createBranchAdminController } from './presentation/http/controllers/branch-admin.controller'
import { createSuperAdminController } from './presentation/http/controllers/super-admin.controller'


export const createContainer = () => {
  const config = loadConfig()
  const branchRepository = new BranchRepositoryImpl(db)
  const examRepository = new ExamRepositoryImpl(db, dbReplica)
  const moduleRepository = new ModuleRepositoryImpl(db)
  const materialRepository = new MaterialRepositoryImpl(db)
  const packageRepository = new PackageRepositoryImpl(db, () => getRedisClient(config))
  const orderRepository = new OrderRepositoryImpl(db)
  const permissionRepository = new PermissionRepositoryImpl(db)
  const subscriptionRepository = new SubscriptionRepositoryImpl(db)
  const userRepository = new UserRepositoryImpl(db)
  const adminRepository = new AdminRepositoryImpl(db)
  const authService = new AuthService(config)
  const authorizationService = new AuthorizationService(
    permissionRepository,
    () => getRedisClient(config)
  )
  const paymentService = new PaymentService(config)
  const examService = new ExamService()
  const leaderboardService = new LeaderboardService(config, examRepository)
  const objectStorageService = new ObjectStorageService(config)
  const materialService = new MaterialService(config, objectStorageService)
  const authMiddleware = createAuthMiddleware(authService, userRepository, authorizationService)

  const loginUseCase = new LoginUseCase(userRepository, authService)
  const registerUseCase = new RegisterUseCase(db, userRepository, branchRepository, authService)
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, authService)
  const listBranchesUseCase = new ListBranchesUseCase(branchRepository)
  const listPackagesUseCase = new ListPackagesUseCase(packageRepository)
  const getPackageDetailUseCase = new GetPackageDetailUseCase(packageRepository)
  const listExamsUseCase = new ListExamsUseCase(examRepository)
  const getExamDetailUseCase = new GetExamDetailUseCase(examRepository)
  const getAdaptiveRecommendationUseCase = new GetAdaptiveRecommendationUseCase(examRepository)
  const listSubjectsUseCase = new ListSubjectsUseCase(moduleRepository, subscriptionRepository, packageRepository)
  const listModulesBySubjectUseCase = new ListModulesBySubjectUseCase(moduleRepository)
  const listMaterialsByModuleUseCase = new ListMaterialsByModuleUseCase(moduleRepository, materialRepository, subscriptionRepository, packageRepository)
  const getMaterialDetailUseCase = new GetMaterialDetailUseCase(materialRepository, materialService, objectStorageService)
  const trackMaterialProgressUseCase = new TrackMaterialProgressUseCase(materialRepository)
  const listTeacherMaterialsUseCase = new ListTeacherMaterialsUseCase(materialRepository)
  const getTeacherMaterialDetailUseCase = new GetTeacherMaterialDetailUseCase(materialRepository, materialService, objectStorageService)
  const createMaterialUseCase = new CreateMaterialUseCase(
    db,
    moduleRepository,
    materialRepository,
    materialService,
    objectStorageService
  )
  const updateMaterialUseCase = new UpdateMaterialUseCase(
    db,
    materialRepository,
    materialService,
    objectStorageService
  )
  const deleteMaterialUseCase = new DeleteMaterialUseCase(db, materialRepository)
  const uploadMaterialImageUseCase = new UploadMaterialImageUseCase(materialService, objectStorageService)
  const purchasePackageUseCase = new PurchasePackageUseCase(
    db,
    packageRepository,
    orderRepository,
    paymentService,
    objectStorageService
  )
  const listMyOrdersUseCase = new ListMyOrdersUseCase(orderRepository, objectStorageService)
  const listBranchOrdersUseCase = new ListBranchOrdersUseCase(orderRepository, objectStorageService)
  const getActiveSubscriptionUseCase = new GetActiveSubscriptionUseCase(subscriptionRepository)
  const verifyOrderUseCase = new VerifyOrderUseCase(
    db,
    orderRepository,
    packageRepository,
    subscriptionRepository,
    paymentService
  )
  const getProfileUseCase = new GetProfileUseCase(userRepository)
  const updateProfileUseCase = new UpdateProfileUseCase(db, userRepository)
  const updatePasswordUseCase = new UpdatePasswordUseCase(db, userRepository, authService)
  const subscriptionMiddleware = createSubscriptionMiddleware(getActiveSubscriptionUseCase)
  const loginRateLimiter = rateLimit(getRedisClient(config), { max: 5, durationSeconds: 60 })

  // Admin & Super Admin Use Cases (Phase 7)
  const getBranchStatsUseCase = new GetBranchStatsUseCase(adminRepository)
  const getNationalStatsUseCase = new GetNationalStatsUseCase(adminRepository)
  const getAuditLogsUseCase = new GetAuditLogsUseCase(adminRepository)
  const getSystemSettingsUseCase = new GetSystemSettingsUseCase(adminRepository)
  const updateSystemSettingsUseCase = new UpdateSystemSettingsUseCase(adminRepository)
  const exportBranchReportUseCase = new ExportBranchReportUseCase(adminRepository)

  const listAllBranchesUseCase = new ListAllBranchesUseCase(branchRepository)
  const createBranchUseCase = new CreateBranchUseCase(branchRepository)
  const updateBranchUseCase = new UpdateBranchUseCase(branchRepository)
  const deleteBranchUseCase = new DeleteBranchUseCase(branchRepository)

  const listUsersUseCase = new ListUsersUseCase(userRepository)
  const createUserUseCase = new CreateUserUseCase(db, userRepository, branchRepository, authService)
  const updateUserUseCase = new UpdateUserUseCase(db, userRepository, branchRepository, authService, authorizationService)
  const deleteUserUseCase = new DeleteUserUseCase(userRepository, authorizationService)

  const listAllPackagesUseCase = new ListAllPackagesUseCase(packageRepository)
  const createPackageUseCase = new CreatePackageUseCase(packageRepository)
  const updatePackageUseCase = new UpdatePackageUseCase(packageRepository)
  const deletePackageUseCase = new DeletePackageUseCase(packageRepository)
  const listPackageFeaturesUseCase = new ListPackageFeaturesUseCase(packageRepository)
  const createPackageFeatureUseCase = new CreatePackageFeatureUseCase(packageRepository)
  const updatePackageFeatureUseCase = new UpdatePackageFeatureUseCase(packageRepository)
  const deletePackageFeatureUseCase = new DeletePackageFeatureUseCase(packageRepository)
  const listPackageSubjectsUseCase = new ListPackageSubjectsUseCase(packageRepository)
  const assignPackageSubjectsUseCase = new AssignPackageSubjectsUseCase(packageRepository, db)

  const listAllSubjectsUseCase = new ListAllSubjectsUseCase(moduleRepository)
  const createSubjectUseCase = new CreateSubjectUseCase(moduleRepository)
  const updateSubjectUseCase = new UpdateSubjectUseCase(moduleRepository)
  const deleteSubjectUseCase = new DeleteSubjectUseCase(moduleRepository)
  const createModuleUseCase = new CreateModuleUseCase(moduleRepository)
  const updateModuleUseCase = new UpdateModuleUseCase(moduleRepository)
  const deleteModuleUseCase = new DeleteModuleUseCase(moduleRepository)
  const superadminListExamsUseCase = new SuperadminListExamsUseCase(examRepository)
  const superadminGetExamDetailUseCase = new SuperadminGetExamDetailUseCase(examRepository)
  const superadminCreateQuestionUseCase = new SuperadminCreateQuestionUseCase(examRepository, examService)
  const superadminUpdateQuestionUseCase = new SuperadminUpdateQuestionUseCase(examRepository, examService)

  const branchAdminController = createBranchAdminController(
    authMiddleware,
    userRepository,
    getBranchStatsUseCase,
    exportBranchReportUseCase,
    listUsersUseCase,
    createUserUseCase,
    updateUserUseCase,
    deleteUserUseCase
  )

  const superAdminController = createSuperAdminController(
    authMiddleware,
    listAllBranchesUseCase,
    createBranchUseCase,
    updateBranchUseCase,
    deleteBranchUseCase,
    listUsersUseCase,
    createUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    listAllPackagesUseCase,
    createPackageUseCase,
    updatePackageUseCase,
    deletePackageUseCase,
    listPackageFeaturesUseCase,
    createPackageFeatureUseCase,
    updatePackageFeatureUseCase,
    deletePackageFeatureUseCase,
    listPackageSubjectsUseCase,
    assignPackageSubjectsUseCase,
    listAllSubjectsUseCase,
    createSubjectUseCase,
    updateSubjectUseCase,
    deleteSubjectUseCase,
    createModuleUseCase,
    updateModuleUseCase,
    deleteModuleUseCase,
    getNationalStatsUseCase,
    exportBranchReportUseCase,
    getSystemSettingsUseCase,
    updateSystemSettingsUseCase,
    getAuditLogsUseCase,
    superadminListExamsUseCase,
    superadminGetExamDetailUseCase,
    superadminCreateQuestionUseCase,
    superadminUpdateQuestionUseCase
  )


  // Instansiasi Proctoring (Fase 6)
  const proctorRepository = new ProctorRepositoryImpl(db)
  const logProctorEventUseCase = new LogProctorEventUseCase(proctorRepository, examRepository)
  
  const realtimeGateway = new RealtimeGateway(
    examRepository,
    userRepository,
    leaderboardService,
    logProctorEventUseCase,
    config.redisUrl
  )

  const warnStudentUseCase = new WarnStudentUseCase(
    proctorRepository,
    examRepository,
    async (sessionId, userId, message, warningCount, terminated) => {
      await realtimeGateway.sendProctorWarning(sessionId, userId, message, warningCount, terminated)
    }
  )

  const terminateSessionUseCase = new TerminateSessionUseCase(
    examRepository,
    async (sessionId) => {
      await realtimeGateway.terminateSessionRealtime(sessionId)
    }
  )

  const getLiveProctorDataUseCase = new GetLiveProctorDataUseCase(proctorRepository, examRepository)
  const getProctorLogUseCase = new GetProctorLogUseCase(proctorRepository, examRepository)

  const proctorController = createProctorController(
    authMiddleware,
    getLiveProctorDataUseCase,
    getProctorLogUseCase,
    terminateSessionUseCase,
    warnStudentUseCase
  )

  const examProcessingQueue = new ExamProcessingQueue(
    config,
    examRepository,
    examService,
    async (sessionId, examId) => {
      await leaderboardService.recordResult(sessionId)
      await realtimeGateway.broadcastLeaderboardUpdate(examId)
    }
  )
  const startExamUseCase = new StartExamUseCase(examRepository, examService, examProcessingQueue)
  const getSessionSnapshotUseCase = new GetSessionSnapshotUseCase(examRepository, examProcessingQueue)
  const submitAnswerUseCase = new SubmitAnswerUseCase(examRepository, () => getRedisClient(config), examProcessingQueue)
  const submitExamUseCase = new SubmitExamUseCase(examRepository, examProcessingQueue)
  const getExamResultUseCase = new GetExamResultUseCase(examRepository, examProcessingQueue, leaderboardService)
  const getExamLeaderboardUseCase = new GetExamLeaderboardUseCase(examRepository, leaderboardService)
  const listTeacherExamsUseCase = new ListTeacherExamsUseCase(examRepository)
  const getTeacherExamDetailUseCase = new GetTeacherExamDetailUseCase(examRepository)
  const createExamUseCase = new CreateExamUseCase(examRepository, examService)
  const createQuestionUseCase = new CreateQuestionUseCase(examRepository, examService)
  const updateQuestionUseCase = new UpdateQuestionUseCase(examRepository, examService)
  const subscriptionExpiryScheduler = new SubscriptionExpiryScheduler(
    config,
    subscriptionRepository
  )
  const weeklyReportScheduler = new WeeklyReportScheduler(
    config,
    adminRepository
  )

  return {

    config,
    db,
    logger,
    getRedisClient: () => getRedisClient(config),
    subscriptionExpiryScheduler,
    weeklyReportScheduler,
    examProcessingQueue,
    healthController: createHealthController(config),
    authController: createAuthController(config, loginUseCase, registerUseCase, refreshTokenUseCase, loginRateLimiter),
    branchController: createBranchController(listBranchesUseCase),
    userController: createUserController(authMiddleware, getProfileUseCase, updateProfileUseCase, updatePasswordUseCase),
    packageController: createPackageController(listPackagesUseCase, getPackageDetailUseCase),
    examController: createExamController(
      authMiddleware,
      subscriptionMiddleware,
      listExamsUseCase,
      getExamDetailUseCase,
      getExamLeaderboardUseCase,
      startExamUseCase,
      getSessionSnapshotUseCase,
      submitAnswerUseCase,
      submitExamUseCase,
      getExamResultUseCase,
      getAdaptiveRecommendationUseCase
    ),
    realtimeController: realtimeGateway.controller(),
    materialController: createMaterialController(
      authMiddleware,
      subscriptionMiddleware,
      listSubjectsUseCase,
      listModulesBySubjectUseCase,
      listMaterialsByModuleUseCase,
      getMaterialDetailUseCase,
      trackMaterialProgressUseCase
    ),
    orderController: createOrderController(
      authMiddleware,
      purchasePackageUseCase,
      listMyOrdersUseCase,
      getActiveSubscriptionUseCase
    ),
    adminOrderController: createAdminOrderController(authMiddleware, listBranchOrdersUseCase, verifyOrderUseCase),
    teacherMaterialController: createTeacherMaterialController(
      authMiddleware,
      listTeacherMaterialsUseCase,
      getTeacherMaterialDetailUseCase,
      createMaterialUseCase,
      updateMaterialUseCase,
      deleteMaterialUseCase,
      uploadMaterialImageUseCase
    ),
    teacherExamController: createTeacherExamController(
      authMiddleware,
      listTeacherExamsUseCase,
      getTeacherExamDetailUseCase,
      createExamUseCase,
      createQuestionUseCase,
      updateQuestionUseCase
    ),
    proctorController,
    subscriptionMiddleware,
    branchAdminController,
    superAdminController
  }
}
