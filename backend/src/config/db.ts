import mongoose from "mongoose";
import {env} from './env'
import { logger } from "../core/logger";

export const connectDB=async()=>{
    try{
        await mongoose.connect(env.MONGO_URI);
        logger.info("DB connected");
    }catch (error) {
        if (error instanceof Error) {
            logger.error({ err: error.message, stack: error.stack }, "❌ DB connection failed");
        } else {
            logger.error({ err: error }, "❌ DB connection failed");
        }
        process.exit(1);
    }
}