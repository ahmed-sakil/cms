import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { UploadService } from "./upload.service.js";
import { authGuard } from "../../middleware/authGuard.js";
import { ResponseUtil } from "../../common/utils/apiResponse.js";
import { BadRequestError } from "../../common/errors/appError.js";

const uploadRouter = Router();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Configure multer with memory storage capped at 10MB and strict MIME filtering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      return cb(
        new BadRequestError(
          "Invalid file type. Only images (JPG, PNG, WebP, GIF) and documents (PDF, DOC, DOCX) are permitted."
        )
      );
    }
    cb(null, true);
  },
});

const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new BadRequestError("File size exceeds the maximum allowed limit of 10MB."));
        }
        return next(new BadRequestError(`Upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

uploadRouter.post(
  "/",
  authGuard,
  handleMulterUpload,
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

