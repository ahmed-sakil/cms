import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import path from "path";
// Domain Routes
import authRoutes from "./modules/auth/auth.routes.js";
import publicRoutes from "./modules/public/public.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import { uploadRouter } from "./modules/upload/upload.routes.js";
import batchRoutes from "./modules/batches/batch.routes.js";
import financeRoutes from "./modules/finance/finance.routes.js";
import opsRoutes from "./modules/academic-ops/academic-ops.routes.js";

export const createApp = () => {
  const app = express();

  // Global Security & Utility Middlewares (Allow cross-origin resource access for uploaded assets)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: ENV.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static directory for uploaded files fallback
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  if (ENV.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // Health Check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "coaching-management-api",
    });
  });

  // Mount Domain-Driven API Endpoints
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/public", publicRoutes);
  app.use("/api/v1/branches", publicRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/student", studentRoutes);
  app.use("/api/v1/students", studentRoutes);
  app.use("/api/v1/upload", uploadRouter);
  app.use("/api/v1/academics", batchRoutes);
  app.use("/api/v1/finance", financeRoutes);
  app.use("/api/v1/ops", opsRoutes);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
