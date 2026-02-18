import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

class UserRepository {
  async findByWallet(walletAddress: string) {
    const normalized = walletAddress.toLowerCase();
    return db.query.users.findFirst({
      where: eq(users.walletAddress, normalized),
    });
  }

  async getOrCreate(walletAddress: string) {
    const existing = await this.findByWallet(walletAddress);
    if (existing) return existing;

    const [inserted] = await db
      .insert(users)
      .values({ walletAddress: walletAddress.toLowerCase() })
      .returning();
    return inserted;
  }
}

export const userRepository = new UserRepository();
