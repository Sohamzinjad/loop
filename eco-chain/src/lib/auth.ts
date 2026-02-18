export const PROJECT_SUBMISSION_SCOPE = "project_submission" as const;
export const PROJECT_REVIEW_SCOPE = "project_review" as const;

export function buildAuthMessage(scope: string, wallet: string, timestamp: number) {
  return `EcoChain:${scope}:${wallet.toLowerCase()}:${timestamp}`;
}

export function buildProjectSubmissionMessage(wallet: string, timestamp: number) {
  return buildAuthMessage(PROJECT_SUBMISSION_SCOPE, wallet, timestamp);
}

export function buildProjectReviewMessage(wallet: string, timestamp: number) {
  return buildAuthMessage(PROJECT_REVIEW_SCOPE, wallet, timestamp);
}
