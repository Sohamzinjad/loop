import { ethers } from "ethers";
import { AuthenticationError, ValidationError } from "@/server/infrastructure/errors";
import { buildAuthMessage, PROJECT_REVIEW_SCOPE, PROJECT_SUBMISSION_SCOPE } from "@/lib/auth";

const SIGNATURE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const usedSignatures = new Map<string, number>();

interface SignaturePayload {
  walletAddress: string;
  signature: string;
  timestamp: number;
  scope: string;
}

const cleanupUsedSignatures = () => {
  const now = Date.now();
  for (const [key, expiresAt] of usedSignatures) {
    if (expiresAt <= now) {
      usedSignatures.delete(key);
    }
  }
};

if (typeof setInterval !== "undefined") {
  setInterval(cleanupUsedSignatures, SIGNATURE_WINDOW_MS);
}

async function verifySignature(payload: SignaturePayload) {
  if (!payload.signature || !payload.timestamp) {
    throw new ValidationError("Missing signature payload");
  }

  const now = Date.now();
  if (Math.abs(now - payload.timestamp) > SIGNATURE_WINDOW_MS) {
    throw new AuthenticationError("Signature expired");
  }

  const message = buildAuthMessage(payload.scope, payload.walletAddress, payload.timestamp);

  let recovered: string;
  try {
    recovered = ethers.verifyMessage(message, payload.signature);
  } catch {
    throw new AuthenticationError("Invalid signature");
  }

  if (recovered.toLowerCase() !== payload.walletAddress.toLowerCase()) {
    throw new AuthenticationError("Signature does not match wallet");
  }

  const signatureKey = `${payload.signature}:${payload.scope}`;
  if (usedSignatures.has(signatureKey)) {
    throw new AuthenticationError("Signature already used");
  }
  usedSignatures.set(signatureKey, now + SIGNATURE_WINDOW_MS);
}

export async function verifyProjectSubmissionSignature(
  payload: Omit<SignaturePayload, "scope">
) {
  return verifySignature({ ...payload, scope: PROJECT_SUBMISSION_SCOPE });
}

export async function verifyProjectReviewSignature(
  payload: Omit<SignaturePayload, "scope">
) {
  return verifySignature({ ...payload, scope: PROJECT_REVIEW_SCOPE });
}
