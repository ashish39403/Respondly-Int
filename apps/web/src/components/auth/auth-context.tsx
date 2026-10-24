"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  CheckCheck,
  FileText,
  Pause,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/marketing/brand";

export function AuthContext() {
  const [paused, setPaused] = useState(false);
  return (
    <aside
      className="auth-context"
      data-auth-paused={paused || undefined}
      aria-labelledby="auth-context-title"
    >
      <div className="auth-context-background" aria-hidden="true">
        <div className="auth-rail rail-one" />
        <div className="auth-rail rail-two" />
        <div className="auth-rail rail-three" />
        <span className="auth-orbit-point point-one" />
        <span className="auth-orbit-point point-two" />
      </div>
      <div className="auth-context-top">
        <span>THE HUMAN SIDE OF AI</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
      <div className="auth-context-center">
        <p className="auth-context-eyebrow">
          <span /> ONE CONNECTED SUPPORT LOOP
        </p>
        <h2 id="auth-context-title">
          Great answers.
          <br />
          Even better <em>connections.</em>
        </h2>
        <p className="auth-context-description">
          Let your knowledge do the talking.
          <br />
          Let your people make the difference.
        </p>
        <div
          className="auth-story"
          aria-label="Example support journey: a Ready document supports an answer, then a person takes over when needed."
        >
          <div className="auth-story-card story-knowledge">
            <span className="story-icon">
              <FileText />
            </span>
            <div>
              <span className="story-overline">YOUR KNOWLEDGE</span>
              <strong>Returns policy</strong>
            </div>
            <span className="story-ready">
              <CheckCheck size={12} /> Ready
            </span>
          </div>
          <div className="story-connector" aria-hidden="true">
            <span />
            <ArrowDown size={11} />
          </div>
          <div className="auth-story-card story-answer">
            <span className="story-icon story-ai">
              <Brand markOnly />
            </span>
            <div>
              <span className="story-overline">A GROUNDED ANSWER</span>
              <p>
                “You can return unopened items
                <br />
                within 30 days of delivery.”
              </p>
            </div>
            <Sparkles className="story-spark" size={14} aria-hidden="true" />
          </div>
          <div className="story-connector" aria-hidden="true">
            <span />
            <ArrowDown size={11} />
          </div>
          <div className="auth-story-card story-handoff">
            <span className="story-human">M</span>
            <div>
              <span className="story-overline">A HUMAN, WHEN IT MATTERS</span>
              <strong>“I’ve got the context. Let’s talk.”</strong>
            </div>
            <Users size={14} aria-hidden="true" />
          </div>
          <span className="story-example-label">ILLUSTRATIVE CONVERSATION</span>
        </div>
        <div className="auth-context-promise">
          <span />
          <p>
            One conversation.
            <br />
            <strong>No starting over.</strong>
          </p>
        </div>
      </div>
      <div className="auth-context-bottom">
        <span>THOUGHTFUL BY DESIGN.</span>
        <Button
          variant="ghost"
          size="icon"
          className="auth-motion-toggle"
          aria-label={paused ? "Play panel animation" : "Pause panel animation"}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play /> : <Pause />}
        </Button>
      </div>
    </aside>
  );
}
