"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddSplitModal } from "@/components/royalties/AddSplitModal";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";

interface Split {
  id: string;
  recipientName: string;
  recipientEmail: string;
  role: string;
  percentage: number;
  isPrimary: boolean;
  artist?: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  } | null;
}

const SPLIT_COLORS = [
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-rose-500",
];

export default function TrackSplitsPage() {
  const router = useRouter();
  const { trackId } = useParams<{ trackId: string }>();
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchSplits() {
    try {
      const res = await fetch(`/api/tracks/${trackId}/splits`);
      if (res.ok) {
        const data = await res.json();
        setSplits(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSplits();
  }, [trackId]);

  async function handleDelete(splitId: string) {
    if (!confirm("Remove this collaborator?")) return;
    setDeleting(splitId);
    try {
      const res = await fetch(`/api/royalties/${splitId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSplits();
      }
    } finally {
      setDeleting(null);
    }
  }

  const totalPercentage = splits.reduce(
    (sum, s) => sum + Number(s.percentage),
    0
  );
  const remainingPercentage = Math.max(0, 100 - totalPercentage);

  if (loading) {
    return (
      <div className="text-neutral-500 text-sm py-12 text-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/dashboard/music")}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Music
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Royalty Splits</h1>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={remainingPercentage <= 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Collaborator
        </Button>
      </div>

      {/* Split Bar Visualization */}
      <Card className="mb-6">
        <CardTitle className="mb-4">Split Breakdown</CardTitle>
        <CardContent>
          <div className="flex h-8 rounded-lg overflow-hidden mb-4">
            {splits.map((split, i) => (
              <div
                key={split.id}
                className={`${SPLIT_COLORS[i % SPLIT_COLORS.length]} flex items-center justify-center text-xs font-semibold text-black transition-all`}
                style={{ width: `${Number(split.percentage)}%` }}
                title={`${split.recipientName}: ${Number(split.percentage)}%`}
              >
                {Number(split.percentage) >= 10
                  ? `${Number(split.percentage)}%`
                  : ""}
              </div>
            ))}
            {remainingPercentage > 0 && (
              <div
                className="bg-neutral-700 flex items-center justify-center text-xs text-neutral-400"
                style={{ width: `${remainingPercentage}%` }}
              >
                {remainingPercentage >= 10
                  ? `${remainingPercentage}% unassigned`
                  : ""}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {splits.map((split, i) => (
              <div key={split.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className={`h-3 w-3 rounded-full ${SPLIT_COLORS[i % SPLIT_COLORS.length]}`}
                />
                <span className="text-neutral-300">{split.recipientName}</span>
                <span className="text-neutral-500">
                  {Number(split.percentage)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collaborators List */}
      <Card>
        <CardTitle className="mb-4">Collaborators</CardTitle>
        <CardContent>
          {splits.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4 text-center">
              No royalty splits configured. Add collaborators to split earnings.
            </p>
          ) : (
            <div className="space-y-3">
              {splits.map((split, i) => (
                <div
                  key={split.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-800/30"
                >
                  <div
                    className={`h-10 w-10 rounded-full ${SPLIT_COLORS[i % SPLIT_COLORS.length]} flex items-center justify-center text-sm font-bold text-black`}
                  >
                    {split.recipientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {split.recipientName}
                      </p>
                      {split.isPrimary && (
                        <Badge variant="warning">Owner</Badge>
                      )}
                      <Badge>{split.role}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {split.recipientEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">
                      {Number(split.percentage)}%
                    </p>
                  </div>
                  {!split.isPrimary && (
                    <button
                      onClick={() => handleDelete(split.id)}
                      disabled={deleting === split.id}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSplitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        trackId={trackId}
        remainingPercentage={remainingPercentage}
        onSuccess={fetchSplits}
      />
    </div>
  );
}
