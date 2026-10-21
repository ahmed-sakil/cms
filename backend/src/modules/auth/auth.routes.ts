import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authGuard } from "../../middleware/authGuard.js";
import { loginSchema, studentSelfRegisterSchema } from "../../schemas/index.js";

const router = Router();

router.post("/login", validateRequest(loginSchema), AuthController.login);
router.post(
  "/register-student",
  validateRequest(studentSelfRegisterSchema),
  AuthController.registerStudent
);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authGuard, AuthController.logout);
router.get("/me", authGuard, AuthController.me);

export default router;
