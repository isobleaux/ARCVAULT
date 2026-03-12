"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { UploadDropzone } from "@/components/music/UploadDropzone";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const artistId = (session?.user as Record<string, unknown> | undefined)
    ?.artistId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    chargesEnabled?: boolean;
  } | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    bio: "",
    genre: "",
    location: "",
    websiteUrl: "",
    avatarUrl: "",
    bannerUrl: "",
    twitter: "",
    instagram: "",
    spotify: "",
    youtube: "",
    isPublished: false,
  });

  useEffect(() => {
    if (!artistId) return;
    async function fetchArtist() {
      try {
        const res = await fetch(`/api/artists/${artistId}`);
        if (res.ok) {
          const artist = await res.json();
          const socials = artist.socialLinks || {};
          setForm({
            name: artist.name || "",
            slug: artist.slug || "",
            bio: artist.bio || "",
            genre: artist.genre || "",
            location: artist.location || "",
            websiteUrl: artist.websiteUrl || "",
            avatarUrl: artist.avatarUrl || "",
            bannerUrl: artist.bannerUrl || "",
            twitter: socials.twitter || "",
            instagram: socials.instagram || "",
            spotify: socials.spotify || "",
            youtube: socials.youtube || "",
            isPublished: artist.isPublished || false,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchArtist();

    // Fetch Stripe Connect status
    fetch("/api/stripe/connect/status")
      .then((res) => res.json())
      .then((data) => setStripeStatus(data))
      .catch(() => {});
  }, [artistId]);

  async function handleConnectStripe() {
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setConnectingStripe(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "image");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, avatarUrl: url }));
    }
  }

  async function handleBannerUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "image");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, bannerUrl: url }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          bio: form.bio || undefined,
          genre: form.genre || undefined,
          location: form.location || undefined,
          websiteUrl: form.websiteUrl || undefined,
          avatarUrl: form.avatarUrl || undefined,
          bannerUrl: form.bannerUrl || undefined,
          socialLinks: {
            twitter: form.twitter || undefined,
            instagram: form.instagram || undefined,
            spotify: form.spotify || undefined,
            youtube: form.youtube || undefined,
          },
          isPublished: form.isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      setMessage("Profile updated successfully!");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-neutral-500 text-sm py-12 text-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-3 mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardTitle className="mb-4">Profile</CardTitle>
          <CardContent className="space-y-4">
            <Input
              label="Artist Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="URL Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <Textarea
              label="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Genre"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <Input
              label="Website"
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Images</CardTitle>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Avatar
              </label>
              {form.avatarUrl && (
                <img
                  src={form.avatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover mb-2"
                />
              )}
              <UploadDropzone
                accept="image/*"
                onFileSelected={handleAvatarUpload}
                label="Upload avatar"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Banner
              </label>
              {form.bannerUrl && (
                <img
                  src={form.bannerUrl}
                  alt="Banner"
                  className="h-32 w-full rounded-lg object-cover mb-2"
                />
              )}
              <UploadDropzone
                accept="image/*"
                onFileSelected={handleBannerUpload}
                label="Upload banner"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Social Links</CardTitle>
          <CardContent className="space-y-4">
            <Input
              label="Twitter / X"
              value={form.twitter}
              onChange={(e) => setForm({ ...form, twitter: e.target.value })}
              placeholder="@username"
            />
            <Input
              label="Instagram"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@username"
            />
            <Input
              label="Spotify"
              value={form.spotify}
              onChange={(e) => setForm({ ...form, spotify: e.target.value })}
              placeholder="Artist profile URL"
            />
            <Input
              label="YouTube"
              value={form.youtube}
              onChange={(e) => setForm({ ...form, youtube: e.target.value })}
              placeholder="Channel URL"
            />
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Payments</CardTitle>
          <CardContent>
            {stripeStatus === null ? (
              <p className="text-sm text-neutral-500">Loading...</p>
            ) : stripeStatus.connected && stripeStatus.chargesEnabled ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">Connected</Badge>
                <span className="text-sm text-neutral-400">
                  Stripe account is active and ready to receive payments
                </span>
              </div>
            ) : stripeStatus.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pending</Badge>
                  <span className="text-sm text-neutral-400">
                    Stripe account setup incomplete
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={connectingStripe}
                  onClick={handleConnectStripe}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Complete Setup
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-400">
                  Connect your Stripe account to start receiving payments for
                  your products.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={connectingStripe}
                  onClick={handleConnectStripe}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Connect Stripe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Visibility</CardTitle>
          <CardContent>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
                className="rounded border-neutral-700 bg-neutral-800"
              />
              Publish profile (visible on Explore page)
            </label>
          </CardContent>
        </Card>

        <Button type="submit" isLoading={saving}>
          Save Settings
        </Button>
      </form>
    </div>
  );
}
