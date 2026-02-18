import { NextResponse } from "next/server";
import { processSyncEvent } from "@/lib/sync";
import { z } from "zod";

// ─── Input Validation Schema ───
const blockchainEventSchema = z.object({
    txHash: z
        .string()
        .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
    from: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid from address"),
    to: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid to address"),
    tokenId: z.number().int().nonnegative(),
    amount: z.number().positive(),
    type: z.enum(["mint", "transfer", "retire"]),
    retireeName: z.string().max(200).optional(),
    reason: z.string().max(500).optional(),
    timestamp: z.string().datetime().transform((s) => new Date(s)),
});

const syncPayloadSchema = z.object({
    events: z.array(blockchainEventSchema).min(1).max(100),
});

/**
 * POST /api/sync
 * Syncs blockchain events to Neon DB.
 * Protected by API key via middleware.ts
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate payload
        const parsed = syncPayloadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { events } = parsed.data;

        const results = await Promise.allSettled(
            events.map((event) => processSyncEvent(event))
        );

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return NextResponse.json({
            success: true,
            processed: successful,
            failed,
            total: events.length,
        });
    } catch (error) {
        console.error("[/api/sync] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "EcoChain Sync Service — POST events to this endpoint",
        docs: {
            method: "POST",
            headers: { "x-api-key": "required" },
            body: "{ events: BlockchainEvent[] }",
        },
    });
}
