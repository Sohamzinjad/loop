"use server";

import { db } from "@/db";
import { creditsInventory, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Sync blockchain events to Neon DB
 * In production, this runs as a cron job or webhook
 * Queries Polygon for TransferSingle/TransferBatch events
 */

interface BlockchainEvent {
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
 * Process a single blockchain event
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
                await db
                    .update(creditsInventory)
                    .set({
                        availableSupply: (
                            parseFloat(existing.availableSupply) + event.amount
                        ).toString(),
                        totalSupply: (
                            parseFloat(existing.totalSupply) + event.amount
                        ).toString(),
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
                const newSupply = parseFloat(existing.availableSupply) - event.amount;
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
        console.error("Sync error:", error);
        return { success: false, error: "Failed to process event" };
    }
}

/**
 * Batch sync multiple events
 */
export async function syncBlockchainEvents(events: BlockchainEvent[]) {
    const results = await Promise.allSettled(
        events.map((event) => processSyncEvent(event))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
        success: true,
        processed: successful,
        failed,
        total: events.length,
    };
}
