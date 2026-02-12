"use server";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a PDF retirement certificate
 * Called after a successful retire() transaction on-chain
 */
export async function generateCertificate(params: {
    txHash: string;
    retireeName: string;
    reason: string;
    tokenId: number;
    amount: number;
    projectName: string;
}) {
    try {
        const { txHash, retireeName, reason, tokenId, amount, projectName } = params;

        // ─── Create PDF Document ───
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 Landscape
        const { width, height } = page.getSize();

        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

        // ─── Background ───
        page.drawRectangle({
            x: 0, y: 0, width, height,
            color: rgb(0.04, 0.09, 0.07), // Dark green-black
        });

        // Border
        page.drawRectangle({
            x: 20, y: 20, width: width - 40, height: height - 40,
            borderColor: rgb(0.2, 0.75, 0.5),
            borderWidth: 2,
        });

        // Inner border
        page.drawRectangle({
            x: 30, y: 30, width: width - 60, height: height - 60,
            borderColor: rgb(0.15, 0.6, 0.4),
            borderWidth: 0.5,
        });

        // ─── Header ───
        const headerY = height - 80;
        page.drawText("🌿 ECOCHAIN", {
            x: width / 2 - 100,
            y: headerY,
            size: 28,
            font: titleFont,
            color: rgb(0.3, 0.85, 0.55),
        });

        page.drawText("CARBON RETIREMENT CERTIFICATE", {
            x: width / 2 - 180,
            y: headerY - 40,
            size: 20,
            font: titleFont,
            color: rgb(0.9, 0.95, 0.9),
        });

        // ─── Decorative Line ───
        page.drawLine({
            start: { x: 60, y: headerY - 60 },
            end: { x: width - 60, y: headerY - 60 },
            thickness: 1,
            color: rgb(0.2, 0.75, 0.5),
        });

        // ─── Certificate Body ───
        const bodyY = headerY - 100;
        const leftMargin = 80;

        page.drawText("This certifies that", {
            x: width / 2 - 70,
            y: bodyY,
            size: 12,
            font: italicFont,
            color: rgb(0.7, 0.8, 0.75),
        });

        page.drawText(retireeName, {
            x: width / 2 - titleFont.widthOfTextAtSize(retireeName, 24) / 2,
            y: bodyY - 35,
            size: 24,
            font: titleFont,
            color: rgb(0.3, 0.95, 0.6),
        });

        page.drawText("has permanently retired carbon credits from the blockchain.", {
            x: width / 2 - 210,
            y: bodyY - 65,
            size: 12,
            font: bodyFont,
            color: rgb(0.7, 0.8, 0.75),
        });

        // ─── Details ───
        const detailsY = bodyY - 110;
        const details = [
            ["Project:", projectName],
            ["Token ID:", `#${tokenId}`],
            ["Amount Retired:", `${amount} tons CO₂`],
            ["Reason:", reason],
            ["Transaction:", `${txHash.slice(0, 10)}...${txHash.slice(-8)}`],
            ["Date:", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
        ];

        details.forEach(([label, value], i) => {
            const y = detailsY - i * 28;

            page.drawText(label, {
                x: leftMargin + 100,
                y,
                size: 11,
                font: titleFont,
                color: rgb(0.5, 0.7, 0.6),
            });

            page.drawText(value, {
                x: leftMargin + 250,
                y,
                size: 11,
                font: bodyFont,
                color: rgb(0.9, 0.95, 0.9),
            });
        });

        // ─── Footer ───
        page.drawLine({
            start: { x: 60, y: 70 },
            end: { x: width - 60, y: 70 },
            thickness: 0.5,
            color: rgb(0.2, 0.6, 0.4),
        });

        page.drawText("Verified on Polygon Blockchain • EcoChain Carbon Credit Marketplace", {
            x: width / 2 - 200,
            y: 50,
            size: 9,
            font: italicFont,
            color: rgb(0.4, 0.6, 0.5),
        });

        // ─── Generate PDF bytes ───
        const pdfBytes = await pdfDoc.save();

        // In production, upload to S3/R2
        // For now, return a data URI and store in DB
        const base64 = Buffer.from(pdfBytes).toString("base64");
        const certificateUrl = `data:application/pdf;base64,${base64}`;

        // Update transaction with certificate URL
        await db
            .update(transactions)
            .set({ certificateUrl })
            .where(eq(transactions.txHash, txHash));

        return {
            success: true,
            certificateUrl,
            message: "Certificate generated successfully",
        };
    } catch (error) {
        console.error("Certificate generation error:", error);
        return { success: false, error: "Failed to generate certificate" };
    }
}
