"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  FileText,
  Plus,
  Search,
  RotateCcw,
  Trash2,
  Replace,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useDemo } from "./demo-provider";
import type { DemoDocument } from "./demo-state";
import { PageHeading, StatusBadge } from "./dashboard-parts";
import { ConfirmDemoAction } from "./confirm-demo-action";

export function KnowledgeView() {
  const { state, dispatch } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState<DemoDocument | null>(null);
  const [viewing, setViewing] = useState<DemoDocument | null>(null);
  const replacement = useRef<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const documents = state.documents.filter(
    (document) =>
      (status === "All" || document.status === status) &&
      document.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const replaceId = replacement.current;
    replacement.current = null;
    event.target.value = "";
    if (!file) return;
    setError(false);
    if (
      !/\.(pdf|txt|md)$/i.test(file.name) ||
      file.size > 10 * 1024 * 1024 ||
      file.size === 0
    ) {
      setError(true);
      setMessage("Choose a non-empty PDF, TXT, or Markdown file up to 10 MB.");
      return;
    }
    if (!replaceId && state.documents.length >= 50) {
      setError(true);
      setMessage("This demo workspace has reached its 50-document limit.");
      return;
    }
    try {
      const text = /\.(txt|md)$/i.test(file.name)
        ? (await file.text()).slice(0, 20000)
        : "PDF selected locally. This demo does not extract or index PDF content.";
      const document: DemoDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        status: "Processing",
        content: text,
      };
      dispatch(
        replaceId
          ? { type: "replace-document", id: replaceId, document }
          : { type: "add-document", document },
      );
      setMessage(
        "File added locally. Use ‘Simulate Ready’ to explore the demo. Nothing was uploaded or indexed.",
      );
    } catch {
      setError(true);
      setMessage("The selected file could not be read. Try another file.");
    }
  }
  function chooseFile(replaceId: string | null = null) {
    replacement.current = replaceId;
    input.current?.click();
  }
  return (
    <div className="workspace-page">
      <PageHeading
        title="Knowledge"
        description="A strong answer starts with the right source."
        action={
          <Button size="lg" onClick={() => chooseFile()}>
            <Plus data-icon="inline-start" />
            Add document
          </Button>
        }
      />
      <input
        ref={input}
        type="file"
        accept=".pdf,.txt,.md"
        hidden
        aria-label="Choose knowledge document"
        onChange={pickFile}
      />
      <div className="knowledge-strip">
        <FileText aria-hidden="true" />
        <span>
          <strong>
            {
              state.documents.filter((document) => document.status === "Ready")
                .length
            }{" "}
            Ready documents
          </strong>
          <span>
            Only Ready documents are used for answers. PDF, TXT, Markdown · 10
            MB each · 50 documents.
          </span>
        </span>
      </div>
      <div className="workspace-list-toolbar">
        <ToggleGroup
          aria-label="Document status"
          value={[status]}
          onValueChange={(values) => {
            if (values[0]) setStatus(values[0]);
          }}
          variant="outline"
          size="sm"
        >
          {["All", "Ready", "Processing", "Failed"].map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search documents"
            placeholder="Search documents…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>
      <p role={error ? "alert" : "status"} className="workspace-feedback">
        {message}
      </p>
      <div className="workspace-table-panel">
        <Table>
          <TableCaption>
            Demo documents. Processing and indexing are simulated locally.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="document-name">
                    <FileText aria-hidden="true" />
                    <span>
                      <strong>{document.name}</strong>
                      {document.reason && <span>{document.reason}</span>}
                      {document.previousReady &&
                        document.status === "Processing" && (
                          <span>
                            Previous Ready version remains searchable in the
                            demo.
                          </span>
                        )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={document.status} />
                </TableCell>
                <TableCell>{document.size}</TableCell>
                <TableCell>
                  <div className="table-actions">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`View ${document.name}`}
                      onClick={() => setViewing(document)}
                    >
                      <Eye />
                    </Button>
                    {document.status === "Failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          dispatch({ type: "retry-document", id: document.id });
                          setError(false);
                          setMessage(
                            "Demo retry started. No ingestion job was created.",
                          );
                        }}
                      >
                        <RotateCcw data-icon="inline-start" />
                        Retry
                      </Button>
                    )}
                    {document.status === "Processing" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          dispatch({ type: "ready-document", id: document.id });
                          setError(false);
                          setMessage(
                            "Document marked Ready in this demo only. No content was indexed.",
                          );
                        }}
                      >
                        <Check data-icon="inline-start" />
                        Simulate Ready
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Replace ${document.name}`}
                      onClick={() => chooseFile(document.id)}
                    >
                      <Replace />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${document.name}`}
                      onClick={() => setRemoving(document)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!documents.length && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No documents found</EmptyTitle>
              <EmptyDescription>
                Add a document or try another filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>
              Local demo source preview. No retrieval service is connected.
            </DialogDescription>
          </DialogHeader>
          <p className="document-content">{viewing?.content}</p>
        </DialogContent>
      </Dialog>
      <ConfirmDemoAction
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remove this document?"
        description={`${removing?.name ?? "This document"} will be removed from the demo library. Refreshing restores the sample documents.`}
        onConfirm={() => {
          if (removing) dispatch({ type: "delete-document", id: removing.id });
        }}
      />
    </div>
  );
}
