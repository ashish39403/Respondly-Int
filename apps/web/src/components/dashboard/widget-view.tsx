"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Copy, MessageSquare, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./dashboard-parts";

const DEMO_SNIPPET =
  '<!-- Demo only: this example address does not serve a widget. -->\n<script src="https://cdn.respondly.invalid/widget.js"\n  data-workspace="demo-acme" defer></script>';

export function WidgetView() {
  const { state, dispatch, logo, setLogo } = useDemo();
  const [draft, setDraft] = useState(state.widget);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(true);
  const channels = [1, 3, 5]
    .map((offset) => parseInt(draft.color.slice(offset, offset + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  const widgetInk =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179
      ? "#000000"
      : "#ffffff";
  const logoInput = useRef<HTMLInputElement>(null);
  async function changeLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setMessage("Choose a PNG, JPG, or WebP logo up to 2 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      setLogo(URL.createObjectURL(file));
      setMessage("Logo updated locally. Nothing was uploaded.");
    } catch {
      setMessage("This image could not be opened. Choose another file.");
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.assistant.trim() || !draft.welcome.trim()) {
      setInvalid(true);
      setMessage("Enter an assistant name and a welcome message.");
      return;
    }
    dispatch({
      type: "widget",
      settings: {
        ...draft,
        assistant: draft.assistant.trim(),
        welcome: draft.welcome.trim(),
      },
    });
    setInvalid(false);
    setMessage(
      "Widget settings saved in this demo. Your website has not changed.",
    );
  }
  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(DEMO_SNIPPET);
      setMessage(
        "Example snippet copied. The .invalid address is a placeholder and cannot install a widget.",
      );
    } catch {
      setMessage(
        "Clipboard access is unavailable. You can select and copy the example below.",
      );
    }
  }
  return (
    <div className="workspace-page">
      <PageHeading
        title="Widget"
        description="A familiar welcome, wherever the conversation begins."
      />
      <div className="widget-editor-grid">
        <Card>
          <CardHeader>
            <CardTitle>Your assistant, your identity</CardTitle>
            <CardDescription>
              Changes appear in the preview as you type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="widget-form" onSubmit={save} noValidate>
              <FieldGroup>
                <Field
                  data-invalid={
                    (invalid && !draft.assistant.trim()) || undefined
                  }
                >
                  <FieldLabel htmlFor="assistant-name">
                    Assistant name
                  </FieldLabel>
                  <Input
                    id="assistant-name"
                    value={draft.assistant}
                    maxLength={50}
                    required
                    aria-invalid={invalid && !draft.assistant.trim()}
                    onChange={(event) =>
                      setDraft({ ...draft, assistant: event.target.value })
                    }
                  />
                </Field>
                <Field
                  data-invalid={(invalid && !draft.welcome.trim()) || undefined}
                >
                  <FieldLabel htmlFor="welcome-message">
                    Welcome message
                  </FieldLabel>
                  <Textarea
                    id="welcome-message"
                    value={draft.welcome}
                    maxLength={240}
                    required
                    aria-invalid={invalid && !draft.welcome.trim()}
                    onChange={(event) =>
                      setDraft({ ...draft, welcome: event.target.value })
                    }
                  />
                  <FieldDescription>
                    {draft.welcome.length}/240 characters
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="widget-color">Brand color</FieldLabel>
                  <div className="widget-color-field">
                    <input
                      id="widget-color"
                      type="color"
                      value={draft.color}
                      onChange={(event) =>
                        setDraft({ ...draft, color: event.target.value })
                      }
                    />
                    <code>{draft.color.toUpperCase()}</code>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Placement</FieldLabel>
                  <ToggleGroup
                    aria-label="Widget placement"
                    value={[draft.placement]}
                    onValueChange={(values) => {
                      if (
                        values[0] === "bottom_left" ||
                        values[0] === "bottom_right"
                      )
                        setDraft({ ...draft, placement: values[0] });
                    }}
                    variant="outline"
                  >
                    <ToggleGroupItem value="bottom_left">
                      Bottom left
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bottom_right">
                      Bottom right
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
                <Field>
                  <FieldLabel>Workspace logo</FieldLabel>
                  <input
                    ref={logoInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={changeLogo}
                    aria-label="Choose widget logo"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInput.current?.click()}
                    >
                      <Upload data-icon="inline-start" />
                      Upload logo
                    </Button>
                    {logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setLogo(null)}
                      >
                        Remove logo
                      </Button>
                    )}
                  </div>
                  <FieldDescription>
                    PNG, JPG, or WebP up to 2 MB. Preview only.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <Button type="submit" size="lg">
                <Check data-icon="inline-start" />
                Save demo settings
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="widget-preview-column">
          <div className="widget-preview-label">
            <span>LIVE DESIGN PREVIEW</span>
            <span>Website widget</span>
          </div>
          <div
            className="widget-preview-stage"
            data-placement={draft.placement}
          >
            <div className="preview-website-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-widget-position">
              {open && (
                <div className="preview-chat-window">
                  <header
                    style={{ backgroundColor: draft.color, color: widgetInk }}
                  >
                    <div>
                      {logo ? (
                        <Image
                          src={logo}
                          unoptimized
                          width={32}
                          height={32}
                          alt="Workspace logo"
                        />
                      ) : (
                        <MessageSquare aria-hidden="true" />
                      )}
                      <span>
                        <strong>{draft.assistant || "Your assistant"}</strong>
                        <span>Here to help</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Close widget preview"
                      onClick={() => setOpen(false)}
                    >
                      <X />
                    </button>
                  </header>
                  <div className="preview-chat-body">
                    <p>
                      {draft.welcome || "Your welcome message appears here."}
                    </p>
                    <span>
                      Answers from your knowledge.
                      <br />A person when you need one.
                    </span>
                  </div>
                  <div className="preview-chat-input">
                    Ask a question…
                    <MessageSquare aria-hidden="true" />
                  </div>
                  <footer>
                    Powered by <em>respondly.</em>
                  </footer>
                </div>
              )}
              <button
                type="button"
                className="preview-chat-launcher"
                style={{ backgroundColor: draft.color, color: widgetInk }}
                aria-label={
                  open ? "Hide widget preview" : "Open widget preview"
                }
                onClick={() => setOpen(!open)}
              >
                <MessageSquare />
              </button>
            </div>
          </div>
          <p className="workspace-note">
            Visual preview only. No visitor session is started and no AI
            messages are generated.
          </p>
        </div>
      </div>
      <p className="workspace-feedback" role="status">
        {message}
      </p>
      <Card className="widget-snippet-card">
        <CardHeader>
          <CardTitle>Installation snippet</CardTitle>
          <CardDescription>
            This example shows the snippet format. A real workspace snippet will
            be available when widget delivery is connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre>
            <code>{DEMO_SNIPPET}</code>
          </pre>
          <Button variant="outline" onClick={copySnippet}>
            <Copy data-icon="inline-start" />
            Copy example
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
