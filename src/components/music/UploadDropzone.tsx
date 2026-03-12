"use client";

import { useState, useCallback, DragEvent } from "react";
import { Upload, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_AUDIO_TYPES } from "@/lib/constants";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  label?: string;
  currentFile?: string | null;
}

export function UploadDropzone({
  onFileSelected,
  accept = ACCEPTED_AUDIO_TYPES.join(","),
  label = "Drop your audio file here, or click to browse",
  currentFile,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setFileName(file.name);
        onFileSelected(file);
      }
    };
    input.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
        isDragging
          ? "border-amber-500 bg-amber-500/5"
          : "border-neutral-700 hover:border-neutral-600 bg-neutral-900/50"
      )}
    >
      {fileName || currentFile ? (
        <div className="flex flex-col items-center gap-2">
          <Music className="h-8 w-8 text-amber-500" />
          <p className="text-sm font-medium text-white">
            {fileName || currentFile}
          </p>
          <p className="text-xs text-neutral-500">Click to change file</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-neutral-500" />
          <p className="text-sm text-neutral-400">{label}</p>
          <p className="text-xs text-neutral-600">
            MP3, WAV, FLAC, AAC — up to 100MB
          </p>
        </div>
      )}
    </div>
  );
}
