"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = {
  name: string;
  setName: (name: string) => void;
  photo: string | null;
  choosePhoto: () => void;
  removePhoto: () => void;
  photoMessage: string;
  photoError: boolean;
};

const ProfileContext = createContext<Profile | null>(null);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Preview state belongs to the persistent dashboard layout, not an auth account.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState("Workspace owner");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef(0);

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  useEffect(
    () => () => {
      selection.current += 1;
    },
    [],
  );

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const request = ++selection.current;
    setPhotoError(false);
    setPhotoMessage("");
    if (!PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
      setPhotoError(true);
      setPhotoMessage("Choose a JPG, PNG, or WebP image under 5 MB.");
      return;
    }
    try {
      const image = await createImageBitmap(file);
      image.close();
      if (request !== selection.current) return;
      setPhoto(URL.createObjectURL(file));
      setPhotoMessage(
        "Photo updated for this preview. It has not been uploaded.",
      );
    } catch {
      if (request !== selection.current) return;
      setPhotoError(true);
      setPhotoMessage(
        "This image could not be opened. Please choose another file.",
      );
    }
  }

  function removePhoto() {
    selection.current += 1;
    setPhoto(null);
    setPhotoError(false);
    setPhotoMessage("Photo removed from this preview.");
  }

  return (
    <ProfileContext
      value={{
        name,
        setName,
        photo,
        choosePhoto: () => input.current?.click(),
        removePhoto,
        photoMessage,
        photoError,
      }}
    >
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose profile photo"
        hidden
        onChange={onPhotoChange}
      />
      {children}
    </ProfileContext>
  );
}

export function useProfile() {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error("useProfile requires ProfileProvider");
  return profile;
}

export function ProfileAvatar({ large = false }: { large?: boolean }) {
  const { name, photo } = useProfile();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();
  return (
    <Avatar size="lg" className={large ? "dashboard-avatar-large" : undefined}>
      {photo && <AvatarImage src={photo} alt={`${name}'s profile photo`} />}
      <AvatarFallback>{initials || "OW"}</AvatarFallback>
    </Avatar>
  );
}
