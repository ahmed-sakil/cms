import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { BadRequestError } from "../../common/errors/appError.js";
import { ENV } from "../../config/env.js";

const SUPABASE_URL = ENV.SUPABASE_URL || "https://ajsldyyvaspkxtnvfsxx.supabase.co";
const SUPABASE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const BUCKET_NAME = ENV.SUPABASE_STORAGE_BUCKET || "cms-assets";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
]);

const DANGEROUS_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".svg",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".sh",
  ".exe",
  ".php",
  ".bat",
  ".cmd",
  ".ps1",
  ".vbs",
  ".jar",
  ".py",
]);

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageProvider: "supabase" | "local";
}

export class UploadService {
  private static supabaseClient = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  static async uploadFile(
    file: Express.Multer.File,
    folder: string = "general",
    reqProtocol?: string,
    reqHost?: string
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestError("No file provided for upload");
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(ext) || !ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestError(
        `File extension '${ext}' is not permitted. Only images (.jpg, .jpeg, .png, .webp, .gif) and documents (.pdf, .doc, .docx) are allowed.`
      );
    }

    const cleanFolderName = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);

    const uniqueFileName = `${cleanBaseName}_${Date.now()}${ext}`;
    const storagePath = `${cleanFolderName}/${uniqueFileName}`;

    // 1. Try Supabase Storage if credentials are configured
    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) {
          console.warn("[UploadService] Supabase upload failed, falling back to local:", error.message);
        } else if (data) {
          const { data: publicData } = this.supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

          return {
            url: publicData.publicUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            storageProvider: "supabase",
          };
        }
      } catch (err: any) {
        console.warn("[UploadService] Error during Supabase upload attempt:", err.message);
      }
    }

    // 2. Local disk fallback (served via Express static /uploads)
    const uploadsDir = path.resolve(process.cwd(), "uploads", cleanFolderName);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(localFilePath, file.buffer);

    const host = reqHost || `localhost:${process.env.PORT || 5000}`;
    const protocol = reqProtocol || "http";
    const localUrl = `${protocol}://${host}/uploads/${cleanFolderName}/${uniqueFileName}`;

    return {
      url: localUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageProvider: "local",
    };
  }
}
