import {
  submitProjectRequestSchema,
  type ProjectSubmissionPayload,
} from "@/server/infrastructure/validation/projectSchemas";
import { projectService } from "@/server/business/projects/projectService";
import { AppError, ValidationError } from "@/server/infrastructure/errors";
import { logger } from "@/server/infrastructure/logger";

export type SubmitProjectCommandInput = ProjectSubmissionPayload;

export async function submitProjectCommand(input: SubmitProjectCommandInput) {
  const parsed = submitProjectRequestSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details,
    };
  }

  try {
    const project = await projectService.createProject(parsed.data);
    return {
      success: true,
      projectId: project.id,
      message: `Project "${project.name}" submitted for verification.`,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        details: error.details,
      };
    }

    if (error instanceof AppError) {
      logger.warn("[submitProject] application error", {
        error: error.message,
        code: error.code,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    logger.error("[submitProject] unexpected error", error);
    return {
      success: false,
      error: "Failed to submit project. Please try again.",
    };
  }
}
