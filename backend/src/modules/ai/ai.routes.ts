import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middlewares";
import { aiChatRateLimiter } from "../../middlewares/rateLimiter";
import { chatSchema, prefillSchema } from "./ai.validation";
import { chat, prefill } from "./ai.controller";

const aiRoutes = Router();

aiRoutes.use(authMiddleware);

aiRoutes.post("/prefill", validateBody(prefillSchema), prefill);
aiRoutes.post("/chat", aiChatRateLimiter, validateBody(chatSchema), chat);

export default aiRoutes;
