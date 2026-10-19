import React, { useRef, useState } from "react";
import { Upload, CheckCircle2, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  label?: string;
  folder?: "logos" | "posters" | "materials" | "avatars" | "general";
  accept?: string;
  value?: string;
  onChange: (url: string) => void;
  helperText?: string;
  isImage?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  folder = "general",
  accept = "image/*",
  value = "",
  onChange,
  helperText,
  isImage = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = "";

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("cms_token");

    try {
      setIsUploading(true);
      const res = await fetch(`/api/v1/upload?folder=${folder}`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "File upload failed");
      }

      const uploadedUrl = json.data.url;
      onChange(uploadedUrl);
      toast.success("File uploaded and URL saved!", {
        description: `Stored via ${json.data.storageProvider.toUpperCase()} (${(file.size / 1024).toFixed(1)} KB)`,
      });
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-text-main uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {/* Upload Action Row */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-theme text-xs font-semibold text-text-main rounded-sm hover:border-brand-primary transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-brand-primary" />
            )}
            {isUploading ? "Uploading..." : "Upload File"}
          </button>

          {/* Manual URL input fallback */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste asset URL directly..."
              className="w-full px-3 py-2 bg-bg-app border border-theme rounded-sm text-xs text-text-main focus:outline-none focus:border-brand-primary"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-2 top-2 text-text-main/40 hover:text-red-500"
                title="Clear URL"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Thumbnail or File Indicator */}
        {value && isImage && (
          <div className="flex items-center gap-3 p-2 bg-bg-app border border-theme rounded-sm">
            <img
              src={value}
              alt="Asset Preview"
              className="w-12 h-12 object-cover border border-theme rounded-sm bg-surface"
              onError={(e) => {
                // Handle broken image
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-main truncate">{value}</p>
              <div className="flex items-center gap-1 text-[10px] text-green-500 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Asset ready</span>
              </div>
            </div>
          </div>
        )}

        {value && !isImage && (
          <div className="flex items-center gap-2 p-2 bg-bg-app border border-theme rounded-sm text-xs text-text-main">
            <FileText className="w-4 h-4 text-brand-primary shrink-0" />
            <span className="truncate flex-1">{value}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          </div>
        )}

        {helperText && <p className="text-[11px] text-text-main/50">{helperText}</p>}
      </div>
    </div>
  );
};
