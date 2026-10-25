"use client";

import { useState, type FormEvent } from "react";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatar, useProfile } from "./profile-provider";

export function ProfileSettings() {
  const { name, setName, photo, choosePhoto, removePhoto } = useProfile();
  const [draftName, setDraftName] = useState(name);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);

  function updatePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setInvalid(true);
      setMessage("Enter a display name.");
      return;
    }
    setName(trimmedName);
    setDraftName(trimmedName);
    setInvalid(false);
    setMessage("Display name updated for this preview.");
  }

  return (
    <section
      className="dashboard-settings-panel"
      aria-labelledby="profile-heading"
    >
      <div className="settings-section-heading">
        <h2 id="profile-heading">Your profile</h2>
        <p>A familiar face behind every conversation.</p>
      </div>
      <div className="settings-photo-row">
        <ProfileAvatar large />
        <div className="settings-photo-copy">
          <h3>Profile photo</h3>
          <p>JPG, PNG, or WebP. Up to 5 MB.</p>
          <div className="settings-photo-actions">
            <Button variant="outline" onClick={choosePhoto}>
              <Upload data-icon="inline-start" />
              Upload photo
            </Button>
            {photo && (
              <Button variant="ghost" onClick={removePhoto}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <Separator />
      <form onSubmit={updatePreview} noValidate>
        <FieldGroup>
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor="display-name">Display name</FieldLabel>
            <Input
              id="display-name"
              name="display-name"
              autoComplete="name"
              value={draftName}
              maxLength={80}
              required
              aria-invalid={invalid}
              aria-describedby="display-name-help profile-form-message"
              onChange={(event) => {
                setDraftName(event.target.value);
                setMessage("");
                setInvalid(false);
              }}
            />
            <FieldDescription id="display-name-help">
              The name shown on your profile in this workspace.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-role">Workspace role</FieldLabel>
            <Input id="profile-role" value="Owner" readOnly />
            <FieldDescription>
              Workspace access follows your assigned role.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <div className="settings-form-footer">
          <p id="profile-form-message" role={invalid ? "alert" : "status"}>
            {message || "Changes last until you refresh this page."}
          </p>
          <Button type="submit" size="lg">
            <Check data-icon="inline-start" />
            Update preview
          </Button>
        </div>
      </form>
    </section>
  );
}
