import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Upload, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface ImageCropperProps {
  initialImageUrl?: string;
  onCropComplete: (base64Image: string) => void;
  aspectRatio?: number;
}

// ── Canvas helpers ────────────────────────────────────────────
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    if (!url.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = url;
  });
}

/**
 * Downscale an image data-URL to a maximum dimension before feeding
 * into the cropper — keeps the cropper source small and fast.
 */
async function downscaleImage(dataUrl: string, maxPx = 1600): Promise<string> {
  const img = await createImage(dataUrl);
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w <= maxPx && h <= maxPx) return dataUrl; // already small enough
  const ratio = Math.min(maxPx / w, maxPx / h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.90);
}

/**
 * Crop + encode the final event-card image.
 * Output: 640×400 px JPEG @ quality 0.72  ≈ 50–100 KB as base64.
 */
async function getCroppedCanvas(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    640,
    400
  );
  return canvas.toDataURL("image/jpeg", 0.72);
}
// ──────────────────────────────────────────────────────────────

export default function ImageCropper({
  initialImageUrl = "",
  onCropComplete,
  aspectRatio = 1.6,
}: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState<string>(initialImageUrl);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);

  // Latest crop coordinates — updated synchronously on every change, no async
  const cropPixelsRef = useRef<Area | null>(null);
  // Debounce timer for canvas rendering — fires 500ms after user stops moving
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Called by react-easy-crop on every drag/zoom change
  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      // 1. Store coordinates synchronously — guaranteed to always be the latest
      cropPixelsRef.current = croppedAreaPixels;

      // 2. Cancel any pending canvas render
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // 3. Schedule canvas render 500ms after user settles
      debounceRef.current = setTimeout(async () => {
        if (!imgSrc || !cropPixelsRef.current) return;
        try {
          const base64 = await getCroppedCanvas(imgSrc, cropPixelsRef.current);
          onCropComplete(base64);
        } catch (e) {
          console.error("Crop failed:", e);
        }
      }, 500);
    },
    [imgSrc, onCropComplete]
  );

  // File handling
  const processFile = (file: File) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        // Pre-compress before entering cropper to keep source data small
        const compressed = await downscaleImage(e.target.result as string);
        setImgSrc(compressed);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  // ── Upload zone ───────────────────────────────────────────────
  if (!imgSrc) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById("cropper-file-input")?.click()}
        style={{
          width: "100%",
          aspectRatio: aspectRatio,
          border: isDragOver ? "2px dashed var(--primary)" : "2px dashed var(--border)",
          borderRadius: "12px",
          background: isDragOver ? "rgba(140,36,36,0.04)" : "var(--bg-warm)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          textAlign: "center",
          transition: "border-color 0.2s, background 0.2s",
          gap: "10px",
        }}
      >
        <input
          type="file"
          id="cropper-file-input"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "white", display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          color: "var(--primary)",
        }}>
          <Upload size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
            Upload cover photo
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Click or drag an image here — then zoom &amp; drag to frame it
            <span style={{ marginLeft: 6, color: "var(--text-tertiary, #aaa)", fontStyle: "italic" }}>(640 × 400 px)</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Cropper view ──────────────────────────────────────────────
  return (
    <div style={{ width: "100%" }}>
      {/* Label row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          Drag &amp; zoom to frame your photo. The highlighted area will be used as the event cover.
        </span>
        <button
          type="button"
          onClick={() => { setImgSrc(""); onCropComplete(""); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: "0.78rem", fontWeight: 600,
            color: "var(--primary)", background: "var(--primary-light)",
            border: "none", padding: "5px 10px", borderRadius: 6, cursor: "pointer",
          }}
        >
          <RefreshCw size={12} /> Change
        </button>
      </div>

      {/* Crop area container — fixed height, cropper fills it */}
      <div style={{
        position: "relative",
        width: "100%",
        height: 320,
        borderRadius: "10px",
        overflow: "hidden",
        border: "1.5px solid var(--border)",
        background: "#111",
      }}>
        <Cropper
          image={imgSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          showGrid
          style={{
            containerStyle: { borderRadius: "10px" },
            cropAreaStyle: {
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginTop: 10, padding: "0 2px",
      }}>
        <ZoomOut size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{
            flex: 1,
            accentColor: "var(--primary)",
            cursor: "pointer",
          }}
        />
        <ZoomIn size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
      </div>
    </div>
  );
}
