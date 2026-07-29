import { PrismaClient } from "@prisma/client";
import { logger } from "../core/logger";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("DB connected");
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { err: error.message, stack: error.stack },
        "❌ DB connection failed"
      );
    } else {
      logger.error({ err: error }, "❌ DB connection failed");
    }
    process.exit(1);
  }
};
