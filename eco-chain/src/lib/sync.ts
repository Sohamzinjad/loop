import { db } from "@/db";
import { creditsInventory, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Blockchain event sync — processes events from the chain into Neon DB.
 * In production, invoked by cron job or webhook via /api/sync.
 *
 * NOTE: This is NOT a server action. It is imported only by the sync API route.
 */

export interface BlockchainEvent {
    txHash: string;
    from: string;
    to: string;
    tokenId: number;
    amount: number;
    type: "mint" | "transfer" | "retire";
    retireeName?: string;
    reason?: string;
    timestamp: Date;
}

/**
 * Process a single blockchain event and persist to database.
 */
export async function processSyncEvent(event: BlockchainEvent) {
    try {
        // Upsert transaction record
        await db
            .insert(transactions)
            .values({
                txHash: event.txHash,
                fromAddress: event.from,
                toAddress: event.to,
                tokenId: event.tokenId,
                amount: event.amount.toString(),
                type: event.type,
                retireeName: event.retireeName,
                retireReason: event.reason,
                timestamp: event.timestamp,
            })
            .onConflictDoNothing();

        // Update credits inventory based on event type
        if (event.type === "mint") {
            const existing = await db.query.creditsInventory.findFirst({
                where: eq(creditsInventory.tokenId, event.tokenId),
            });

            if (existing) {
                const newAvailable =
                    parseFloat(existing.availableSupply) + event.amount;
                const newTotal =
                    parseFloat(existing.totalSupply) + event.amount;

                await db
                    .update(creditsInventory)
                    .set({
                        availableSupply: newAvailable.toString(),
                        totalSupply: newTotal.toString(),
                        updatedAt: new Date(),
                    })
                    .where(eq(creditsInventory.tokenId, event.tokenId));
            }
        }

        if (event.type === "retire") {
            const existing = await db.query.creditsInventory.findFirst({
                where: eq(creditsInventory.tokenId, event.tokenId),
            });

            if (existing) {
                const newSupply =
                    parseFloat(existing.availableSupply) - event.amount;

                await db
                    .update(creditsInventory)
                    .set({
                        availableSupply: Math.max(0, newSupply).toString(),
                        isRetired: newSupply <= 0,
                        updatedAt: new Date(),
                    })
                    .where(eq(creditsInventory.tokenId, event.tokenId));
            }
        }

        return { success: true, txHash: event.txHash };
    } catch (error) {
        console.error("[sync] Error processing event:", event.txHash, error);
        return { success: false, error: "Failed to process event" };
    }
}
