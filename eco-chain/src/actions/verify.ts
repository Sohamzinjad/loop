"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

interface EmissionsData {
    co2_tons: number;
    source: string;
    confidence: number;
    timestamp: string;
    verified: boolean;
}

/**
 * Mock IoT/Satellite verification endpoint
 * In production, this would call a Chainlink Function or external API
 */
async function fetchEmissionsData(apiEndpoint: string): Promise<EmissionsData> {
    // Simulate external data fetch
    // In production: const res = await fetch(apiEndpoint);
    const mockData: EmissionsData = {
        co2_tons: Math.floor(Math.random() * 1000) + 100,
        source: "satellite-imagery-v3",
        confidence: 0.85 + Math.random() * 0.15,
        timestamp: new Date().toISOString(),
        verified: true,
    };

    return mockData;
}

/**
 * Verify emissions for a project
 * Fetches external data and updates project verification status
 */
export async function verifyEmissions(projectId: number) {
    try {
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Fetch external emissions data
        const emissionsData = await fetchEmissionsData(
            project.apiEndpoint || "https://mock-iot-api.ecochain.app/emissions"
        );

        if (!emissionsData.verified || emissionsData.confidence < 0.8) {
            await db
                .update(projects)
                .set({
                    verificationStatus: "rejected",
                    updatedAt: new Date(),
                })
                .where(eq(projects.id, projectId));

            return {
                success: false,
                error: "Verification failed: confidence below threshold",
                data: emissionsData,
            };
        }

        // Update project status
        await db
            .update(projects)
            .set({
                verificationStatus: "verified",
                metadataJson: {
                    ...((project.metadataJson as Record<string, unknown>) || {}),
                    verifiedEmissions: emissionsData,
                } as any,
                updatedAt: new Date(),
            })
            .where(eq(projects.id, projectId));

        return {
            success: true,
            data: emissionsData,
            message: `Verified ${emissionsData.co2_tons} tons CO2 offset with ${(emissionsData.confidence * 100).toFixed(1)}% confidence`,
        };
    } catch (error) {
        console.error("Verification error:", error);
        return { success: false, error: "Verification service unavailable" };
    }
}
