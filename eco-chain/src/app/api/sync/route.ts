import { NextResponse } from "next/server";
import { processSyncEvent } from "@/lib/sync";

/**
 * POST /api/sync
 * Called by cron job or webhook to sync blockchain events to Neon DB
 */
export async function POST(req: Request) {
    try {
        const { events } = await req.json();

        if (!events || !Array.isArray(events)) {
            return NextResponse.json(
                { error: "Invalid events payload" },
                { status: 400 }
            );
        }

        const results = await Promise.allSettled(
            events.map((event: any) => processSyncEvent(event))
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
        console.error("Sync API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "EcoChain Sync Service - POST events to this endpoint",
    });
}
