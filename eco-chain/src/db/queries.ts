import { db } from "@/db";
import {
    creditsInventory,
    projects,
    transactions,
    users,
} from "@/db/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";

// ─── Marketplace Queries ───

/** Fetch all active credit listings with their project info */
export async function getMarketplaceListings() {
    return db
        .select({
            tokenId: creditsInventory.tokenId,
            availableSupply: creditsInventory.availableSupply,
            totalSupply: creditsInventory.totalSupply,
            pricePerTon: creditsInventory.pricePerTon,
            projectName: projects.name,
            projectDescription: projects.description,
            metadata: projects.metadataJson,
            verificationStatus: projects.verificationStatus,
            ownerWallet: users.walletAddress,
        })
        .from(creditsInventory)
        .innerJoin(projects, eq(creditsInventory.projectId, projects.id))
        .innerJoin(users, eq(projects.ownerId, users.id))
        .where(
            and(
                eq(creditsInventory.isRetired, false),
                eq(projects.verificationStatus, "verified"),
                ne(creditsInventory.availableSupply, "0")
            )
        )
        .orderBy(desc(creditsInventory.createdAt));
}

// ─── User Queries ───

/** Get or create user by wallet address */
export async function getOrCreateUser(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    const existing = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalized),
    });

    if (existing) return existing;

    const [newUser] = await db
        .insert(users)
        .values({ walletAddress: normalized })
        .returning();

    return newUser;
}

/** Fetch credits owned by a wallet (via on-chain sync) */
export async function getUserCredits(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    // Credits associated with projects the user owns
    const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalized),
        with: {
            projects: {
                with: {
                    credits: true,
                },
            },
        },
    });

    return user?.projects.flatMap((p) =>
        p.credits.map((c) => ({
            ...c,
            projectName: p.name,
            projectType: (p.metadataJson as Record<string, unknown>)?.projectType || "Unknown",
        }))
    ) || [];
}

/** Fetch projects submitted by a user */
export async function getUserProjects(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    const user = await db.query.users.findFirst({
        where: eq(users.walletAddress, normalized),
        with: {
            projects: true,
        },
    });

    return user?.projects || [];
}

// ─── Impact Map Queries ───

/** Fetch all project locations for the impact map */
export async function getProjectLocations() {
    return db
        .select({
            id: projects.id,
            name: projects.name,
            metadata: projects.metadataJson,
            verificationStatus: projects.verificationStatus,
        })
        .from(projects)
        .where(eq(projects.verificationStatus, "verified"));
}

// ─── Transaction Queries ───

/** Fetch retirement history for a wallet */
export async function getRetirementHistory(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();

    return db
        .select()
        .from(transactions)
        .where(
            and(
                eq(transactions.fromAddress, normalized),
                eq(transactions.type, "retire")
            )
        )
        .orderBy(desc(transactions.timestamp));
}

// ─── Global Stats ───

/** Aggregate stats for the homepage */
export async function getGlobalStats() {
    const [stats] = await db
        .select({
            totalCreditsIssued: sql<string>`COALESCE(SUM(${creditsInventory.totalSupply}), 0)`,
            totalRetired: sql<string>`COALESCE(
                (SELECT SUM(${transactions.amount}) FROM ${transactions} WHERE ${transactions.type} = 'retire'),
                0
            )`,
            totalProjects: sql<number>`COUNT(DISTINCT ${projects.id})`,
            totalTransactions: sql<number>`(SELECT COUNT(*) FROM ${transactions})`,
        })
        .from(creditsInventory)
        .innerJoin(projects, eq(creditsInventory.projectId, projects.id));

    return {
        totalRetired: Math.round(parseFloat(stats?.totalRetired || "0")),
        totalProjects: stats?.totalProjects || 0,
        totalTransactions: stats?.totalTransactions || 0,
        totalCreditsIssued: Math.round(
            parseFloat(stats?.totalCreditsIssued || "0")
        ),
    };
}
