import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───
export const userRoleEnum = pgEnum("user_role", ["buyer", "seller", "admin"]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

// ─── Users Table ───
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletAddress: varchar("wallet_address", { length: 42 })
      .unique()
      .notNull(),
    role: userRoleEnum("role").default("buyer").notNull(),
    orgName: text("org_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_wallet_idx").on(table.walletAddress),
  ]
);

// ─── Projects Table ───
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    ownerId: uuid("owner_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    projectType: varchar("project_type", { length: 64 }).default("conservation").notNull(),
    country: varchar("country", { length: 100 }),
    latitude: decimal("latitude", { precision: 9, scale: 6 }),
    longitude: decimal("longitude", { precision: 9, scale: 6 }),
    metadataJson: jsonb("metadata_json").$type<{
      location?: { lat: number; lng: number };
      country?: string;
      projectType?: string;
      methodology?: string;
      vintage?: string;
      imageUrl?: string;
      verifiedEmissions?: {
        co2_tons: number;
        source: string;
        confidence: number;
        timestamp: string;
        verified: boolean;
      };
    }>(),
    apiEndpoint: text("api_endpoint"),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    statusReason: text("status_reason"),
    statusChangedAt: timestamp("status_changed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_owner_idx").on(table.ownerId),
    index("projects_status_idx").on(table.verificationStatus),
    index("projects_type_idx").on(table.projectType),
    index("projects_country_idx").on(table.country),
  ]
);

// ─── Project Status History ───
export const projectStatusHistory = pgTable(
  "project_status_history",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .references(() => projects.id)
      .notNull(),
    previousStatus: verificationStatusEnum("previous_status"),
    newStatus: verificationStatusEnum("new_status").notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("project_status_history_project_idx").on(table.projectId)]
);

// ─── Credits Inventory Table ───
export const creditsInventory = pgTable(
  "credits_inventory",
  {
    id: serial("id").primaryKey(),
    tokenId: integer("token_id").notNull(),
    projectId: integer("project_id")
      .references(() => projects.id)
      .notNull(),
    availableSupply: decimal("available_supply", {
      precision: 18,
      scale: 4,
    }).notNull(),
    totalSupply: decimal("total_supply", { precision: 18, scale: 4 }).notNull(),
    pricePerTon: decimal("price_per_ton", {
      precision: 18,
      scale: 2,
    }).notNull(),
    isRetired: boolean("is_retired").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("credits_token_idx").on(table.tokenId),
    index("credits_project_idx").on(table.projectId),
    index("credits_retired_idx").on(table.isRetired),
  ]
);

// ─── Transactions Table ───
export const transactions = pgTable(
  "transactions",
  {
    txHash: varchar("tx_hash", { length: 66 }).primaryKey(),
    fromAddress: varchar("from_address", { length: 42 }).notNull(),
    toAddress: varchar("to_address", { length: 42 }).notNull(),
    tokenId: integer("token_id").notNull(),
    amount: decimal("amount", { precision: 18, scale: 4 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'mint' | 'transfer' | 'retire' | 'purchase'
    retireeName: text("retiree_name"),
    retireReason: text("retire_reason"),
    certificateUrl: text("certificate_url"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("tx_token_idx").on(table.tokenId),
    index("tx_from_idx").on(table.fromAddress),
    index("tx_to_idx").on(table.toAddress),
    index("tx_type_idx").on(table.type),
  ]
);

// ─── Relations ───
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  credits: many(creditsInventory),
  statusHistory: many(projectStatusHistory),
}));

export const creditsRelations = relations(creditsInventory, ({ one }) => ({
  project: one(projects, {
    fields: [creditsInventory.projectId],
    references: [projects.id],
  }),
}));

// ─── Types ───
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectStatusChange = typeof projectStatusHistory.$inferSelect;
export type CreditInventory = typeof creditsInventory.$inferSelect;
export type NewCreditInventory = typeof creditsInventory.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
