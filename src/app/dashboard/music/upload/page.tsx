"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { UploadDropzone } from "@/components/music/UploadDropzone";
import { useToast } from "@/components/ui/Toast";
import { slugify } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadTrackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  function handleAudioSelected(file: File) {
    setAudioFile(file);
    // Extract duration using Web Audio API
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setDuration(Math.round(audio.duration));
      URL.revokeObjectURL(url);
    });
  }

  async function uploadFile(file: File, type: "audio" | "image") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    return res.json();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile) {
      toast("Please select an audio file", "error");
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      setUploadProgress("Uploading audio...");
      const audioResult = await uploadFile(audioFile, "audio");

      // Upload cover if provided
      let coverUrl: string | undefined;
      if (coverFile) {
        setUploadProgress("Uploading cover art...");
        const coverResult = await uploadFile(coverFile, "image");
        coverUrl = coverResult.url;
      }

      // Create track
      setUploadProgress("Creating track...");
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          genre,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          duration,
          fileUrl: audioResult.url,
          fileSize: audioResult.size,
          fileFormat: audioFile.name.split(".").pop(),
          coverUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create track");
      }

      toast("Track uploaded successfully!", "success");
      router.push("/dashboard/music");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Upload failed",
        "error"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/music"
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Upload Track</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <UploadDropzone onFileSelected={handleAudioSelected} />

        {duration && (
          <p className="text-sm text-neutral-500">
            Duration: {Math.floor(duration / 60)}:
            {(duration % 60).toString().padStart(2, "0")}
          </p>
        )}

        <Input
          id="title"
          label="Title"
          placeholder="Track title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />

        <Input
          id="slug"
          label="URL Slug"
          placeholder="track-title"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />

        <Textarea
          id="description"
          label="Description"
          placeholder="Tell listeners about this track..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="genre"
            label="Genre"
            placeholder="e.g. Hip Hop"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <Input
            id="tags"
            label="Tags (comma-separated)"
            placeholder="chill, vibes, summer"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Cover Art (optional)
          </label>
          <UploadDropzone
            onFileSelected={setCoverFile}
            accept="image/jpeg,image/png,image/webp"
            label="Drop cover art here, or click to browse"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="lg" isLoading={isUploading}>
            {uploadProgress || "Upload Track"}
          </Button>
          <Link href="/dashboard/music">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
