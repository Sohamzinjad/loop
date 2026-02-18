"use server";

import { z } from "zod";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Input Validation ───
const certificateSchema = z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
    tokenId: z.number().int().nonnegative(),
    amount: z.number().positive(),
    projectName: z.string().min(1).max(200),
    retireeName: z.string().min(1).max(200),
    reason: z.string().max(500).optional(),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

type CertificateParams = z.infer<typeof certificateSchema>;

/**
 * Generate a PDF certificate for retired carbon credits.
 *
 * TODO (Production): Upload the generated PDF to S3/R2 cloud storage
 * instead of returning it as a data URI. This avoids DB size bloat.
 * 1. Upload PDF buffer to S3/R2
 * 2. Store the CDN URL in `transactions.certificateUrl`
 * 3. Return the CDN URL to the client
 */
export async function generateCertificate(params: CertificateParams) {
    try {
        // Validate inputs
        const parsed = certificateSchema.safeParse(params);
        if (!parsed.success) {
            return {
                success: false,
                error: "Invalid certificate parameters",
                details: parsed.error.flatten().fieldErrors,
            };
        }

        const { txHash, tokenId, amount, projectName, retireeName, reason, walletAddress } =
            parsed.data;

        // Sanitize text for PDF embedding (prevent injection)
        const sanitize = (s: string) =>
            s.replace(/[^\w\s.,!?@#$%&*()\-=+[\]{};:'"<>/\\|~`]/g, "").trim();

        const safeName = sanitize(retireeName);
        const safeProject = sanitize(projectName);
        const safeReason = sanitize(reason || "Carbon offset retirement");

        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // US Letter
        const { width, height } = page.getSize();

        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Background
        page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(0.04, 0.06, 0.05),
        });

        // Border
        page.drawRectangle({
            x: 20,
            y: 20,
            width: width - 40,
            height: height - 40,
            borderColor: rgb(0.2, 0.75, 0.45),
            borderWidth: 2,
        });

        // Inner border
        page.drawRectangle({
            x: 30,
            y: 30,
            width: width - 60,
            height: height - 60,
            borderColor: rgb(0.15, 0.55, 0.35),
            borderWidth: 0.5,
        });

        // Title
        const title = "CERTIFICATE OF CARBON RETIREMENT";
        page.drawText(title, {
            x: (width - helveticaBold.widthOfTextAtSize(title, 18)) / 2,
            y: height - 100,
            size: 18,
            font: helveticaBold,
            color: rgb(0.2, 0.8, 0.5),
        });

        // Leaf icon (text approximation)
        page.drawText("🌿", {
            x: width / 2 - 10,
            y: height - 140,
            size: 24,
            font: helvetica,
        });

        // Certificate body
        const lineHeight = 28;
        let yPos = height - 200;

        const drawRow = (label: string, value: string) => {
            page.drawText(label, {
                x: 80,
                y: yPos,
                size: 10,
                font: helvetica,
                color: rgb(0.5, 0.55, 0.52),
            });
            page.drawText(value, {
                x: 230,
                y: yPos,
                size: 11,
                font: helveticaBold,
                color: rgb(0.85, 0.9, 0.87),
            });
            yPos -= lineHeight;
        };

        drawRow("Retiree:", safeName);
        drawRow("Project:", safeProject);
        drawRow("Amount:", `${amount} tons CO₂`);
        drawRow("Token ID:", `#${tokenId}`);
        drawRow("Reason:", safeReason.slice(0, 60));
        drawRow("Date:", new Date().toISOString().split("T")[0]);
        drawRow("Wallet:", `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);

        yPos -= 20;

        // Transaction hash
        page.drawText("Transaction Hash:", {
            x: 80,
            y: yPos,
            size: 10,
            font: helvetica,
            color: rgb(0.5, 0.55, 0.52),
        });
        yPos -= 18;
        page.drawText(txHash, {
            x: 80,
            y: yPos,
            size: 7,
            font: helvetica,
            color: rgb(0.4, 0.7, 0.5),
        });
        yPos -= 40;

        // Footer badge
        const badge = "VERIFIED ON POLYGON • IMMUTABLE • PERMANENT";
        page.drawText(badge, {
            x: (width - helvetica.widthOfTextAtSize(badge, 8)) / 2,
            y: 60,
            size: 8,
            font: helvetica,
            color: rgb(0.3, 0.5, 0.4),
        });

        // Serialize to base64
        const pdfBytes = await pdfDoc.save();
        const base64 = Buffer.from(pdfBytes).toString("base64");
        const certificateUrl = `data:application/pdf;base64,${base64}`;

        // Update transaction with certificate URL
        await db
            .update(transactions)
            .set({ certificateUrl })
            .where(eq(transactions.txHash, txHash));

        return { success: true, certificateUrl };
    } catch (error) {
        console.error("[generateCertificate] Error:", error);
        return { success: false, error: "Failed to generate certificate" };
    }
}
