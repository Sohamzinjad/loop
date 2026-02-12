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
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: varchar("wallet_address", { length: 42 }).unique().notNull(),
  role: userRoleEnum("role").default("buyer").notNull(),
  orgName: text("org_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Projects Table ───
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  metadataJson: jsonb("metadata_json").$type<{
    location?: { lat: number; lng: number };
    country?: string;
    projectType?: string;
    methodology?: string;
    vintage?: string;
    imageUrl?: string;
  }>(),
  apiEndpoint: text("api_endpoint"),
  verificationStatus: verificationStatusEnum("verification_status")
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Credits Inventory Table ───
export const creditsInventory = pgTable("credits_inventory", {
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
});

// ─── Transactions Table ───
export const transactions = pgTable("transactions", {
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
});

// ─── Relations ───
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  credits: many(creditsInventory),
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
export type CreditInventory = typeof creditsInventory.$inferSelect;
export type NewCreditInventory = typeof creditsInventory.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
