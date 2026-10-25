"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { ProfileSettings } from "./profile-settings";
import { PageHeading } from "./dashboard-parts";
import { useDemo } from "./demo-provider";

export function SettingsView() {
  const { state, dispatch } = useDemo();
  const [name, setName] = useState(state.workspace);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
  function save(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setInvalid(true);
      setMessage("Enter a workspace name.");
      return;
    }
    dispatch({ type: "workspace", name });
    setInvalid(false);
    setMessage("Workspace name updated in this demo only.");
  }
  return (
    <div className="workspace-page">
      <PageHeading
        title="Settings"
        description="A few details that make this space yours."
      />
      <Tabs defaultValue="profile">
        <TabsList aria-label="Settings section" variant="line">
          <TabsTrigger value="profile">Your profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="workspace" className="mt-6">
          <section className="dashboard-settings-panel">
            <div className="settings-section-heading">
              <h2>Workspace details</h2>
              <p>One home for your knowledge and conversations.</p>
            </div>
            <form onSubmit={save} noValidate>
              <FieldGroup>
                <Field data-invalid={invalid || undefined}>
                  <FieldLabel htmlFor="workspace-name">
                    Workspace name
                  </FieldLabel>
                  <Input
                    id="workspace-name"
                    value={name}
                    maxLength={60}
                    required
                    aria-invalid={invalid}
                    aria-describedby="workspace-message"
                    onChange={(event) => {
                      setName(event.target.value);
                      setInvalid(false);
                      setMessage("");
                    }}
                  />
                  <FieldDescription>
                    Shown in the workspace sidebar.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="workspace-channel">
                    Support channel
                  </FieldLabel>
                  <Input
                    id="workspace-channel"
                    value="Website widget"
                    readOnly
                  />
                  <FieldDescription>
                    Respondly V1 supports your website’s visitor conversations.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="settings-form-footer">
                <p role={invalid ? "alert" : "status"} id="workspace-message">
                  {message || "Changes stay in this demo until refresh."}
                </p>
                <Button type="submit" size="lg">
                  <Check data-icon="inline-start" />
                  Update demo
                </Button>
              </div>
            </form>
          </section>
        </TabsContent>
      </Tabs>
      <p className="dashboard-settings-note">
        This demo does not change your Neon account, workspace membership, or
        security settings. Photos and settings stay local.
      </p>
    </div>
  );
}
