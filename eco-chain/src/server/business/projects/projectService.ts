import { ProjectSubmissionPayload } from "@/server/infrastructure/validation/projectSchemas";
import {
  verifyProjectSubmissionSignature,
  verifyProjectReviewSignature,
} from "@/server/infrastructure/security/signatureAuth";
import { sanitizeRichText } from "@/server/infrastructure/security/sanitize";
import { ensureSafeEndpoint } from "@/server/infrastructure/security/ssrf";
import { userRepository } from "@/server/data/userRepository";
import { projectRepository } from "@/server/data/projectRepository";
import { AppError } from "@/server/infrastructure/errors";

class ProjectService {
  async createProject(payload: ProjectSubmissionPayload) {
    await verifyProjectSubmissionSignature({
      walletAddress: payload.walletAddress,
      signature: payload.signature,
      timestamp: payload.timestamp,
    });

    if (payload.apiEndpoint) {
      ensureSafeEndpoint(payload.apiEndpoint);
    }

    const user = await userRepository.getOrCreate(payload.walletAddress);

    const project = await projectRepository.create({
      ownerId: user.id,
      name: sanitizeRichText(payload.name),
      description: payload.description
        ? sanitizeRichText(payload.description)
        : null,
      projectType: payload.type,
      country: payload.country ?? null,
      latitude:
        typeof payload.lat === "number" ? payload.lat.toFixed(6) : null,
      longitude:
        typeof payload.lng === "number" ? payload.lng.toFixed(6) : null,
      apiEndpoint: payload.apiEndpoint ?? null,
      metadataJson: {
        projectType: payload.type,
        country: payload.country ?? undefined,
        location:
          typeof payload.lat === "number" && typeof payload.lng === "number"
            ? { lat: payload.lat, lng: payload.lng }
            : undefined,
      },
    });

    return project;
  }

  async updateStatus(input: {
    projectId: number;
    reviewerWallet: string;
    newStatus: "pending" | "verified" | "rejected";
    reason?: string;
    signature: string;
    timestamp: number;
  }) {
    await verifyProjectReviewSignature({
      walletAddress: input.reviewerWallet,
      signature: input.signature,
      timestamp: input.timestamp,
    });

    const reviewer = await userRepository.findByWallet(input.reviewerWallet);
    if (!reviewer || reviewer.role !== "admin") {
      throw new AppError(
        "Forbidden — admin privileges required",
        "FORBIDDEN",
        403
      );
    }

    return projectRepository.updateStatus({
      projectId: input.projectId,
      reviewerId: reviewer.id,
      newStatus: input.newStatus,
      reason: input.reason,
    });
  }
}

export const projectService = new ProjectService();
