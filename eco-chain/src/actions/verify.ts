"use server";

import { z } from "zod";
import { projectService } from "@/server/business/projects/projectService";

const projectReviewSchema = z.object({
    projectId: z.number().int().positive(),
    reviewerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    signature: z.string().min(1),
    timestamp: z.number(),
    status: z.enum(["verified", "rejected"]),
    reason: z.string().max(500).optional(),
});

export type ProjectReviewInput = z.input<typeof projectReviewSchema>;

export async function verifyEmissions(input: ProjectReviewInput) {
    const parsed = projectReviewSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
        };
    }

    try {
        const updated = await projectService.updateStatus({
            projectId: parsed.data.projectId,
            reviewerWallet: parsed.data.reviewerWallet,
            newStatus: parsed.data.status,
            reason: parsed.data.reason,
            signature: parsed.data.signature,
            timestamp: parsed.data.timestamp,
        });

        return {
            success: true,
            status: updated.verificationStatus,
            projectId: updated.id,
        };
    } catch (error) {
        console.error("[verifyEmissions] Error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Verification process failed",
        };
    }
}
