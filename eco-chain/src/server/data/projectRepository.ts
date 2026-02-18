import { db } from "@/db";
import {
  projectStatusHistory,
  projects,
  type Project,
} from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateProjectParams {
  ownerId: string;
  name: string;
  description: string | null;
  projectType: string;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  apiEndpoint: string | null;
  metadataJson: Record<string, unknown>;
}

class ProjectRepository {
  async create(params: CreateProjectParams) {
    const [created] = await db
      .insert(projects)
      .values({
        ownerId: params.ownerId,
        name: params.name,
        description: params.description,
        projectType: params.projectType,
        country: params.country,
        latitude: params.latitude,
        longitude: params.longitude,
        apiEndpoint: params.apiEndpoint,
        metadataJson: params.metadataJson,
      })
      .returning();
    return created;
  }

  async updateStatus(input: {
    projectId: number;
    reviewerId: string;
    newStatus: Project["verificationStatus"];
    reason?: string;
  }) {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, input.projectId),
    });
    if (!existing) {
      throw new Error("Project not found");
    }

    const metadata =
      (existing.metadataJson as Record<string, unknown> | null) ?? {};

    const [updated] = await db
      .update(projects)
      .set({
        verificationStatus: input.newStatus,
        statusReason: input.reason ?? existing.statusReason,
        statusChangedAt: new Date(),
        metadataJson: {
          ...metadata,
          verifiedEmissions:
            input.newStatus === "verified"
              ? {
                co2_tons: (metadata?.verifiedEmissions as Record<string, unknown> | undefined)?.co2_tons as number ?? 0,
                source: (metadata?.verifiedEmissions as Record<string, unknown> | undefined)?.source as string ?? "manual_review",
                confidence: (metadata?.verifiedEmissions as Record<string, unknown> | undefined)?.confidence as number ?? 1.0,
                verified: true,
                timestamp: new Date().toISOString(),
              }
              : undefined,
        },
      })
      .where(eq(projects.id, input.projectId))
      .returning();

    await db.insert(projectStatusHistory).values({
      projectId: input.projectId,
      reviewerId: input.reviewerId,
      previousStatus: existing.verificationStatus,
      newStatus: input.newStatus,
      reason: input.reason,
    });

    return updated;
  }
}

export const projectRepository = new ProjectRepository();
