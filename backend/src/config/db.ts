import mongoose from "mongoose";
import {env} from './env'
import { logger } from "../utils/logger";

export const connectDB=async()=>{
    try{
        await mongoose.connect(env.MONGO_URI);
        logger.info("DB connected");
    }catch(error){
        logger.error("❌ DB connection failed", error);
        process.exit(1);
    }
}