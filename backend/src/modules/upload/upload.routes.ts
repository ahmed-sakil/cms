import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { UploadService } from "./upload.service.js";
import { authGuard } from "../../middleware/authGuard.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { BadRequestError } from "../../common/errors/appError.js";

const uploadRouter = Router();

// Configure multer with memory storage (50MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

uploadRouter.post(
  "/",
  authGuard,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError("Please select a file to upload");
      }

      const folder = (req.query.folder as string) || "general";
      const result = await UploadService.uploadFile(
        req.file,
        folder,
        req.protocol,
        req.get("host")
      );

      ResponseUtil.success(
        res,
        result,
        `File uploaded successfully via ${result.storageProvider}`,
        201
      );
    } catch (error) {
      next(error);
    }
  }
);

export { uploadRouter };
