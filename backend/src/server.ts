import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './core/logger';


let server: any;
const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${String(error)}`);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection",(err: any)=>{
  console.error("UNHANDLED REJECTION 💥", err);
  logger.error("UNHANDLED REJECTION!💥Shutting down...",err);
  shutdown();
});

process.on("uncaughtException",(err: any) =>{
  logger.error("UNCAUGHT EXCEPTION!💥Shutting down...", err);
  shutdown();
});

process.on("SIGINT",shutdown);
process.on("SIGTERM",shutdown);

function shutdown() {
  if (server) {
    server.close(() => {
      logger.info("💤 Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}