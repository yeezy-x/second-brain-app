import {Request, Response, NextFunction} from "express"
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export const errorMiddleware=(err:Error, req:Request, res:Response, next:NextFunction)=>{
    logger.error(err)
    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(env.NODE_ENV==="development" && { stack: err.stack })
        });
    }
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        ...(env.NODE_ENV==="development" && { stack: err.stack })
    });
}