"use server";

import { submitProjectCommand } from "@/server/application/projects/submitProject";
import type { SubmitProjectCommandInput } from "@/server/application/projects/submitProject";

export type SubmitProjectInput = SubmitProjectCommandInput;

export async function submitProject(input: SubmitProjectInput) {
  return submitProjectCommand(input);
}
