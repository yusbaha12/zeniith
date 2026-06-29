/*
Tujuan: Mendefinisikan schema database gamifikasi untuk profil murid, XP ledger, badge, dan quest.
Caller: Drizzle Kit, GamificationRepositoryImpl, dan migration G1-G3.
Dependensi: drizzle-orm/pg-core dan tabel users.
Main Functions: Menyediakan enum karakter/event/badge/quest serta tabel student_profiles, xp_ledger, badges, student_badges, quests, dan student_quests.
Side Effects: Menjadi sumber kebenaran schema saat migration database dijalankan.
*/

import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const gamificationCharacterEnum = pgEnum('gamification_character', [
  'ASTRA',
  'NOVA',
  'LUMI',
  'RAKA'
])

export const gamificationEventTypeEnum = pgEnum('gamification_event_type', [
  'MATERIAL_COMPLETED',
  'MODULE_COMPLETED',
  'PRACTICE_COMPLETED',
  'EXAM_SUBMITTED',
  'EXAM_GRADED',
  'PROCTOR_CLEAN_EXAM',
  'DAILY_STREAK',
  'QUEST_CLAIMED'
])

export const badgeTierEnum = pgEnum('badge_tier', [
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM'
])

export const questTypeEnum = pgEnum('quest_type', [
  'DAILY',
  'WEEKLY',
  'EVENT'
])

export const questStatusEnum = pgEnum('quest_status', [
  'ACTIVE',
  'COMPLETED',
  'CLAIMED',
  'EXPIRED'
])

export const studentProfiles = pgTable('student_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  characterCode: gamificationCharacterEnum('character_code').notNull().default('ASTRA'),
  level: integer('level').notNull().default(1),
  totalXp: integer('total_xp').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  streakShields: smallint('streak_shields').notNull().default(0),
  lastActivityDate: date('last_activity_date'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  levelXpIndex: index('idx_student_profiles_level_xp').on(table.level, table.totalXp),
  streakIndex: index('idx_student_profiles_streak').on(table.currentStreak)
}))

export const xpLedger = pgTable('xp_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: gamificationEventTypeEnum('event_type').notNull(),
  sourceId: uuid('source_id').notNull(),
  xpDelta: integer('xp_delta').notNull(),
  reason: text('reason').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  idempotencyUnique: unique('xp_ledger_student_event_source_unique').on(table.studentId, table.eventType, table.sourceId),
  studentCreatedIndex: index('idx_xp_ledger_student_created').on(table.studentId, table.createdAt),
  eventCreatedIndex: index('idx_xp_ledger_event_created').on(table.eventType, table.createdAt)
}))

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 40 }).notNull(),
  tier: badgeTierEnum('tier').notNull(),
  criteria: jsonb('criteria').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  categoryTierIndex: index('idx_badges_category_tier').on(table.category, table.tier)
}))

export const studentBadges = pgTable('student_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
  sourceEventId: uuid('source_event_id')
}, (table) => ({
  studentBadgeUnique: unique('student_badges_student_badge_unique').on(table.studentId, table.badgeId),
  studentEarnedIndex: index('idx_student_badges_student_earned').on(table.studentId, table.earnedAt)
}))

export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull(),
  type: questTypeEnum('type').notNull(),
  title: varchar('title', { length: 120 }).notNull(),
  description: text('description').notNull(),
  xpReward: integer('xp_reward').notNull(),
  criteria: jsonb('criteria').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  activeWindowIndex: index('idx_quests_active_window').on(table.isActive, table.startsAt, table.endsAt)
}))

export const studentQuests = pgTable('student_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questId: uuid('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  progressValue: integer('progress_value').notNull().default(0),
  targetValue: integer('target_value').notNull(),
  status: questStatusEnum('status').notNull().default('ACTIVE'),
  claimedAt: timestamp('claimed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  studentQuestUnique: unique('student_quests_student_quest_unique').on(table.studentId, table.questId),
  studentStatusIndex: index('idx_student_quests_student_status').on(table.studentId, table.status, table.updatedAt),
  questStatusIndex: index('idx_student_quests_quest_status').on(table.questId, table.status)
}))

export type SelectStudentProfile = typeof studentProfiles.$inferSelect
export type SelectBadge = typeof badges.$inferSelect
export type SelectStudentBadge = typeof studentBadges.$inferSelect
export type SelectQuest = typeof quests.$inferSelect
export type SelectStudentQuest = typeof studentQuests.$inferSelect
