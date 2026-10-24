"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type PointerEvent,
} from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  FileText,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Link from "next/link";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";

export function GetStarted({ className }: { className?: string }) {
  const origin = useRef<HTMLSpanElement>(null);
  const moveButton = (event: PointerEvent<HTMLButtonElement>) => {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      event.currentTarget.closest("[data-motion-paused]")
    )
      return;
    const box = origin.current?.getBoundingClientRect();
    if (!box) return;
    const x = (event.clientX - box.left - box.width / 2) * 0.12;
    const y = (event.clientY - box.top - box.height / 2) * 0.18;
    event.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.035)`;
  };
  return (
    <span className="magnetic-wrap" ref={origin}>
      <Button
        render={<Link href="/signup" transitionTypes={["auth-forward"]} />}
        nativeButton={false}
        className={cn("primary-cta motion-button", className)}
        onPointerMove={moveButton}
        onPointerLeave={(event) => {
          event.currentTarget.style.transform = "";
        }}
        onBlur={(event) => {
          event.currentTarget.style.transform = "";
        }}
      >
        <span>Get started</span>
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </span>
  );
}

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const elements =
      root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (
      !elements ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    elements.forEach((element) => {
      element.setAttribute("data-motion-ready", "true");
      observer.observe(element);
    });
    const headline = root.current?.querySelector(".hero-copy");
    const headlineObserver = new IntersectionObserver(([entry]) => {
      headline?.toggleAttribute("data-out-of-view", !entry.isIntersecting);
    });
    if (headline) headlineObserver.observe(headline);
    const currentRoot = root.current;
    const onVisibilityChange = () => {
      currentRoot?.toggleAttribute("data-page-hidden", document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    onVisibilityChange();
    return () => {
      observer.disconnect();
      headlineObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  return (
    <div ref={root} data-motion-paused={paused || undefined}>
      {children}
      <Button
        variant="outline"
        size="icon"
        className="motion-control"
        aria-label={paused ? "Play animations" : "Pause animations"}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Play /> : <Pause />}
      </Button>
    </div>
  );
}

const stages = [
  {
    title: "Your knowledge",
    subtitle: "The source of every answer",
    icon: FileText,
  },
  {
    title: "A grounded answer",
    subtitle: "Helpful, within your policies",
    icon: Sparkles,
  },
  {
    title: "A human handoff",
    subtitle: "The right person, full context",
    icon: Users,
  },
];

function subscribeToMobile(callback: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const getMobileSnapshot = () => window.matchMedia("(max-width: 640px)").matches;
const getServerMobileSnapshot = () => false;

export function ProductPreview() {
  const [stage, setStage] = useState(1);
  const mobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getServerMobileSnapshot,
  );
  return (
    <div className="product-window scroll-zoom">
      <div className="window-bar">
        <div className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>
          <LockKeyhole size={11} /> Respondly / Acme workspace
        </span>
        <span className="example-label">EXAMPLE WORKSPACE</span>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar" aria-label="Product walkthrough">
          <div className="workspace-name">
            <span className="workspace-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 25 16 6l10 19M11 19h10"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              Acme Studio<span>Your support workspace</span>
            </div>
          </div>
          <p className="sidebar-label">A BETTER SUPPORT LOOP</p>
          <ToggleGroup
            className="walkthrough-controls"
            orientation={mobile ? "horizontal" : "vertical"}
            value={[String(stage)]}
            onValueChange={(values) => {
              if (values.length) setStage(Number(values[0]));
            }}
            aria-label="Product walkthrough chapters"
          >
            {stages.map(({ title, subtitle, icon: Icon }, index) => (
              <ToggleGroupItem
                key={title}
                value={String(index)}
                className={cn(
                  "walkthrough-step",
                  stage === index && "is-active",
                )}
                aria-controls="walkthrough-panel"
              >
                <Icon size={17} aria-hidden="true" />
                <span>
                  {title}
                  <small>{subtitle}</small>
                </span>
                <ChevronRight size={13} aria-hidden="true" />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="sidebar-note">
            <LockKeyhole size={14} aria-hidden="true" />
            <p>
              Your knowledge stays yours.
              <span>Answers stay in your workspace.</span>
            </p>
          </div>
        </aside>
        <div id="walkthrough-panel" className="preview-main">
          <div className="preview-main-heading">
            <span>
              <span className="status-dot" />
              {stage === 0 ? "KNOWLEDGE" : "LIVE CONVERSATION"}
            </span>
            <span>
              {stage === 2
                ? "Assigned to Maya"
                : stage === 0
                  ? "3 documents"
                  : "AI Active"}
            </span>
          </div>
          <div
            className="preview-content"
            aria-live="polite"
            aria-atomic="true"
          >
            {stage === 0 ? (
              <div className="knowledge-preview" key="knowledge">
                <span className="preview-kicker">
                  THE START OF A GOOD ANSWER
                </span>
                <h3>
                  A little knowledge.
                  <br />A lot of clarity.
                </h3>
                <div className="preview-files">
                  {[
                    "returns-policy.pdf",
                    "shipping-guide.md",
                    "product-faq.txt",
                  ].map((name) => (
                    <div key={name}>
                      <span className="document-icon">
                        <FileText size={17} />
                      </span>
                      <span>
                        {name}
                        <small>Acme Studio knowledge</small>
                      </span>
                      <span className="ready-label">
                        <Check size={12} /> Ready
                      </span>
                    </div>
                  ))}
                </div>
                <p className="knowledge-note">
                  Only Ready documents are used to answer visitors.
                </p>
              </div>
            ) : (
              <div className="chat-preview" key={stage}>
                <div className="visitor-message">
                  <span className="message-author">VISITOR</span>
                  <p>
                    {stage === 1
                      ? "Hey! What’s your return policy?"
                      : "Could you approve a return for me?"}
                  </p>
                </div>
                <div className="assistant-message">
                  <span className="message-avatar">
                    <Brand markOnly />
                  </span>
                  <div>
                    <span className="message-author">
                      Respondly <span>AI ASSISTANT</span>
                    </span>
                    <p>
                      {stage === 1
                        ? "Happy to help. Unopened items can be returned within 30 days of delivery."
                        : "I can explain the policy, but approval needs a person. I’ll bring in your support team."}
                    </p>
                    {stage === 1 && (
                      <span className="source-indicator">
                        <FileText size={11} /> Grounded in your Ready documents{" "}
                        <CheckCheck size={13} />
                      </span>
                    )}
                  </div>
                </div>
                {stage === 1 ? (
                  <div className="conversation-prompt">
                    <span>Needs something a little more personal?</span>
                    <Button variant="ghost" onClick={() => setStage(2)}>
                      See the human handoff{" "}
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="preview-transfer">
                      <Users size={13} /> Maya claimed this conversation{" "}
                      <span>AI paused</span>
                    </div>
                    <div className="assistant-message human-message">
                      <span className="person-avatar">M</span>
                      <div>
                        <span className="message-author">
                          Maya <span>SUPPORT AGENT</span>
                        </span>
                        <p>
                          Hi! I’ve got the context. Let me look into that return
                          for you.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="preview-composer" aria-hidden="true">
            <span>
              {stage === 0
                ? "Your knowledge, ready to help."
                : "The next good conversation starts here…"}
            </span>
            <span className="composer-send">
              <Send size={14} />
            </span>
          </div>
        </div>
        <aside className="preview-context">
          <div className="context-title">
            <FileText size={14} /> THE KNOWLEDGE BEHIND IT
          </div>
          <div className="context-document">
            <div className="context-file-icon">
              <FileText size={19} />
            </div>
            <span>returns-policy.pdf</span>
            <span className="ready-label">
              <span className="status-dot" /> Ready
            </span>
            <div className="context-rule" />
            <p>“Unopened items can be returned within 30 days of delivery.”</p>
            <span className="context-page">ACME STUDIO · PAGE 1</span>
          </div>
          <div className="context-bottom">
            <span className="context-check">
              <Check size={13} />
            </span>
            <p>
              Helpful has boundaries.
              <span>
                Published knowledge for AI.
                <br />
                Personal decisions for people.
              </span>
            </p>
          </div>
        </aside>
      </div>
      <div className="preview-status">
        <span>
          <span className="status-dot" /> Knowledge. Answers. People.
        </span>
        <button
          onClick={() => setStage((stage + 1) % stages.length)}
          aria-label="Show next walkthrough step"
        >
          {stage === 2 ? <RotateCcw size={11} /> : <ArrowRight size={11} />}{" "}
          {stage === 2 ? "Replay the story" : "Next chapter"}
        </button>
      </div>
    </div>
  );
}
