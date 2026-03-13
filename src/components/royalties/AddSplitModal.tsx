"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COLLABORATOR_ROLES } from "@/modules/royalties/royalties.validations";

interface AddSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  remainingPercentage: number;
  onSuccess: () => void;
}

export function AddSplitModal({
  isOpen,
  onClose,
  trackId,
  remainingPercentage,
  onSuccess,
}: AddSplitModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    recipientName: "",
    recipientEmail: "",
    role: "producer",
    percentage: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const percentage = parseFloat(form.percentage);
    if (isNaN(percentage) || percentage <= 0) {
      setError("Enter a valid percentage");
      setSaving(false);
      return;
    }
    if (percentage > remainingPercentage) {
      setError(`Maximum available is ${remainingPercentage}%`);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/tracks/${trackId}/splits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          role: form.role,
          percentage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add collaborator");
        return;
      }

      setForm({ recipientName: "", recipientEmail: "", role: "producer", percentage: "" });
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Collaborator">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.recipientName}
          onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          placeholder="Collaborator name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.recipientEmail}
          onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
          placeholder="collaborator@email.com"
          required
        />
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          >
            {COLLABORATOR_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={`Percentage (max ${remainingPercentage}%)`}
          type="number"
          step="0.01"
          min="0.01"
          max={remainingPercentage}
          value={form.percentage}
          onChange={(e) => setForm({ ...form, percentage: e.target.value })}
          placeholder="e.g. 25"
          required
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={saving}>
            Add Collaborator
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
