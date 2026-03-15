import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.url;
}

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(value);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const clear = () => {
    setPreview("");
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="relative w-full border border-dashed border-white/20 rounded-lg overflow-hidden bg-background hover:border-primary/50 transition-colors cursor-pointer"
        style={{ minHeight: preview ? 140 : 90 }}
        onClick={() => !preview && fileRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-36 object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); clear(); }}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {!uploading && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-xs hover:bg-primary hover:text-black transition-colors font-medium"
              >
                Change
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground pointer-events-none">
            <Upload className="w-6 h-6 text-primary" />
            <p className="text-xs">Click or drag & drop an image</p>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
