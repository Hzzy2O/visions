"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/context/profile-context";

export default function CreatorSetupPage() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [formData, setFormData] = useState({
    creatorName: profile.name || "",
    creatorBio: profile.bio || "",
    subscriptionPrice: "0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Update the profile with creator information
    updateProfile({
      ...profile,
      name: formData.creatorName,
      bio: formData.creatorBio,
      isCreator: true,
      subscriptionPrice: parseFloat(formData.subscriptionPrice),
    });

    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/profile");
    }, 1000);
  };

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-bold">Become a Creator</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Creator Information</h2>

            <div className="space-y-2">
              <Label htmlFor="creatorName">Creator Name</Label>
              <Input
                id="creatorName"
                name="creatorName"
                value={formData.creatorName}
                onChange={handleInputChange}
                required
                placeholder="Your creator name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creatorBio">Creator Bio</Label>
              <Textarea
                id="creatorBio"
                name="creatorBio"
                value={formData.creatorBio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell others about your creative work..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionPrice">
                Monthly Subscription Price (SUI)
              </Label>
              <div className="flex items-center">
                <Input
                  id="subscriptionPrice"
                  name="subscriptionPrice"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.subscriptionPrice}
                  onChange={handleInputChange}
                  required
                  className="rounded-r-none"
                />
                <div className="flex items-center justify-center rounded-r-md border border-l-0 bg-muted px-3 py-2">
                  SUI
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Set the monthly price subscribers will pay to access your
                content
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue text-white hover:bg-blue/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Creator Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
