import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  FileText,
  LockKeyhole,
  MessageCircle,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { PageTransition } from "@/components/page-transition";
import {
  GetStarted,
  LandingMotion,
  ProductPreview,
} from "@/components/marketing/landing-interactions";

export default function Home() {
  return (
    <PageTransition>
      <LandingMotion>
        <div className="landing" id="top">
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <header className="site-header">
            <div className="site-nav container">
              <a href="#top" aria-label="Respondly home" className="brand-link">
                <Brand />
              </a>
              <nav aria-label="Main navigation">
                <a href="#product">Product</a>
                <a href="#how-it-works">How it works</a>
                <a href="#human-handoff">Human handoff</a>
              </nav>
              <div className="nav-account-actions">
                <GetStarted className="nav-auth nav-entry" />
              </div>
            </div>
          </header>
          <main id="main">
            <section className="hero container" aria-labelledby="hero-title">
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="orbit orbit-three" />
                <div className="orbital-signal" />
                <div className="orbital-signal signal-secondary" />
                <div className="floating-node floating-node-one">
                  <MessageCircle />
                </div>
                <div className="floating-node floating-node-two">
                  <Sparkles />
                </div>
                <div className="floating-node floating-node-three">
                  <Users />
                </div>
                <span className="art-coordinate coordinate-one">
                  KNOWLEDGE → CONNECTION
                </span>
                <span className="art-coordinate coordinate-two">
                  A LITTLE MORE HUMAN
                </span>
              </div>
              <div className="hero-copy">
                <p className="eyebrow hero-entrance">
                  <span className="status-dot" /> AI FIRST. PEOPLE ALWAYS.
                </p>
                <h1 id="hero-title" className="hero-entrance hero-headline">
                  <span className="sr-only">Great answers. A human touch.</span>
                  <span className="headline-line" aria-hidden="true">
                    <span className="headline-ink headline-first">
                      Great answers.
                    </span>
                  </span>
                  <span className="headline-line" aria-hidden="true">
                    <span className="headline-ink headline-second">
                      A <em>human</em> touch.
                    </span>
                  </span>
                </h1>
                <p className="hero-description hero-entrance">
                  Your knowledge, turned into helpful answers.
                  <br className="desktop-break" /> Your people, there when it
                  matters.
                </p>
                <div className="hero-actions hero-entrance">
                  <GetStarted />
                  <a href="#product" className="text-link">
                    Meet Respondly <ArrowDown size={15} aria-hidden="true" />
                  </a>
                </div>
                <p className="hero-footnote hero-entrance">
                  One workspace. Every part of the conversation.
                </p>
              </div>
              <div className="hero-preview hero-entrance" id="product">
                <div className="preview-caption">
                  <span>
                    <span className="tiny-cross">+</span> FROM YOUR DOCS TO YOUR
                    PEOPLE
                  </span>
                  <span>
                    INTERACTIVE PRODUCT PREVIEW{" "}
                    <MousePointer2 size={12} aria-hidden="true" />
                  </span>
                </div>
                <ProductPreview />
              </div>
            </section>
            <div className="principle-strip">
              <div className="container principle-inner">
                <span>
                  <BookOpen aria-hidden="true" /> Grounded in your documents
                </span>
                <span>
                  <Users aria-hidden="true" /> Built around your people
                </span>
                <span>
                  <LockKeyhole aria-hidden="true" /> Private to your workspace
                </span>
              </div>
            </div>
            <section
              className="how-section container"
              id="how-it-works"
              aria-labelledby="how-title"
            >
              <div className="section-heading" data-reveal>
                <p className="eyebrow">
                  <span className="section-index">01 /</span> LESS FRICTION.
                  MORE CONNECTION.
                </p>
                <div className="heading-row">
                  <h2 id="how-title">
                    Good support.
                    <br />
                    <em>All connected.</em>
                  </h2>
                  <p>
                    From the first question to the final reply.
                    <br />A clear path, with no lost context.
                  </p>
                </div>
              </div>
              <div className="workflow-grid">
                <article className="workflow-step" data-reveal>
                  <div className="step-art knowledge-art" aria-hidden="true">
                    <div className="document-sheet sheet-back">
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="document-sheet sheet-front">
                      <FileText />
                      <span>YOUR KNOWLEDGE</span>
                      <div />
                      <div />
                      <div />
                      <div className="sheet-check">
                        <Check size={13} /> Ready to help
                      </div>
                    </div>
                    <span className="file-chip file-chip-one">.pdf</span>
                    <span className="file-chip file-chip-two">.md</span>
                    <span className="file-chip file-chip-three">.txt</span>
                  </div>
                  <div className="step-title">
                    <span>01</span>
                    <h3>Make your knowledge useful.</h3>
                  </div>
                  <p>
                    Add your policies, guides, and FAQs. Once Ready, they become
                    the source of every answer.
                  </p>
                </article>
                <article className="workflow-step" data-reveal>
                  <div className="step-art answer-art" aria-hidden="true">
                    <div className="small-question">
                      “What’s your return policy?”
                    </div>
                    <div className="answer-line">
                      <span className="mini-brand">
                        <Brand markOnly />
                      </span>
                      <span>
                        Unopened items can be returned
                        <br />
                        within 30 days.
                      </span>
                    </div>
                    <div className="evidence-line">
                      <span />
                      <FileText size={12} /> returns-policy.pdf{" "}
                      <CheckCheck size={14} />
                    </div>
                  </div>
                  <div className="step-title">
                    <span>02</span>
                    <h3>Answer with confidence.</h3>
                  </div>
                  <p>
                    Help visitors with what you know. Clarify what’s unclear.
                    Never invent a promise.
                  </p>
                </article>
                <article className="workflow-step" data-reveal>
                  <div className="step-art people-art" aria-hidden="true">
                    <span className="handoff-node ai-node">
                      <Brand markOnly />
                    </span>
                    <div className="handoff-thread">
                      <span />
                      <ArrowRight size={17} />
                    </div>
                    <span className="person-avatar large-avatar">M</span>
                    <div className="handoff-label">
                      <span className="status-dot" /> Same conversation. Human
                      care.
                    </div>
                  </div>
                  <div className="step-title">
                    <span>03</span>
                    <h3>Know when people matter.</h3>
                  </div>
                  <p>
                    When a question needs a person, your team steps in with the
                    full conversation already there.
                  </p>
                </article>
              </div>
            </section>
            <section
              className="human-section"
              id="human-handoff"
              aria-labelledby="human-title"
            >
              <div className="container human-grid">
                <div className="human-copy" data-reveal>
                  <p className="eyebrow">
                    <span className="section-index">02 /</span> TECHNOLOGY WITH
                    GOOD JUDGMENT
                  </p>
                  <h2 id="human-title">
                    Knows the answer.
                    <br />
                    Knows <em>when to ask.</em>
                  </h2>
                  <p>
                    AI handles the known. Your team handles the nuanced.
                    Respondly keeps them in one conversation.
                  </p>
                  <ul className="human-principles">
                    <li>
                      <Check /> Answers from your Ready documents only
                    </li>
                    <li>
                      <Check /> AI pauses when a person is needed
                    </li>
                    <li>
                      <Check /> The full history goes with the handoff
                    </li>
                  </ul>
                  <a className="text-link" href="#product">
                    See the handoff <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
                <div className="handoff-visual scroll-zoom" data-reveal>
                  <div className="handoff-visual-head">
                    <span className="eyebrow">ONE CONVERSATION</span>
                    <span className="example-label">EXAMPLE</span>
                  </div>
                  <div className="conversation-event">
                    <span className="event-node">
                      <MessageCircle />
                    </span>
                    <div>
                      <span>Visitor</span>
                      <p>Can you make an exception for my order?</p>
                    </div>
                  </div>
                  <div className="conversation-event">
                    <span className="event-node event-ai">
                      <Sparkles />
                    </span>
                    <div>
                      <span>
                        Respondly{" "}
                        <span className="event-role">AI ASSISTANT</span>
                      </span>
                      <p>
                        That needs a personal look. I’ll bring in someone who
                        can help.
                      </p>
                    </div>
                  </div>
                  <div className="transfer-note">
                    <Users size={14} />
                    <span>Pending Human</span>
                    <span className="transfer-line" />
                    <span>AI replies paused</span>
                  </div>
                  <div className="conversation-event">
                    <span className="person-avatar">M</span>
                    <div>
                      <span>
                        Maya <span className="event-role">SUPPORT AGENT</span>
                      </span>
                      <p>
                        Hi! I’ve read the conversation. Let’s take a look
                        together.
                      </p>
                    </div>
                  </div>
                  <div className="context-note">
                    <CheckCheck size={15} /> No repeating yourself. No starting
                    over.
                  </div>
                </div>
              </div>
            </section>
            <section
              className="trust-section container"
              aria-labelledby="trust-title"
            >
              <div className="trust-heading" data-reveal>
                <ShieldCheck size={23} />
                <h2 id="trust-title">Trust is part of the architecture.</h2>
                <p>Your documents. Your conversations. Your workspace.</p>
              </div>
              <div className="trust-details" data-reveal>
                <p>
                  <LockKeyhole /> Private knowledge
                  <span>Documents stay within your business.</span>
                </p>
                <p>
                  <Workflow /> Clear boundaries
                  <span>Published answers. Human decisions.</span>
                </p>
                <p>
                  <CheckCheck /> Context that stays
                  <span>One transcript, through every handoff.</span>
                </p>
              </div>
            </section>
            <section
              className="closing-section closing-redesign container"
              aria-labelledby="closing-title"
            >
              <div className="closing-copy" data-reveal>
                <p className="eyebrow">
                  <span>03 /</span> THE NEXT GOOD CONVERSATION
                </p>
                <h2 id="closing-title">
                  A little less friction.
                  <br />A lot more <em>human.</em>
                </h2>
                <p className="closing-description">
                  Turn what you know into the help they need.
                  <br />
                  Keep your people at the heart of it.
                </p>
                <div className="closing-actions">
                  <GetStarted />
                  <a href="#product" className="text-link">
                    Take a closer look <ArrowRight size={15} />
                  </a>
                </div>
                <p className="closing-note">
                  Your knowledge. Your team. One thoughtful workspace.
                </p>
              </div>
              <div className="closing-sculpture" aria-hidden="true">
                <div className="sculpture-orbit sculpture-orbit-one" />
                <div className="sculpture-orbit sculpture-orbit-two" />
                <div className="sculpture-orbit sculpture-orbit-three" />
                <div className="sculpture-center">
                  <Brand markOnly />
                </div>
                <div className="sculpture-satellite satellite-knowledge">
                  <FileText />
                </div>
                <div className="sculpture-satellite satellite-human">
                  <Users />
                </div>
                <div className="sculpture-message message-top">
                  <span className="sculpture-dot" /> A question, understood.
                </div>
                <div className="sculpture-message message-bottom">
                  <CheckCheck /> A person, when it matters.
                </div>
                <span className="sculpture-caption">
                  KNOWLEDGE → ANSWERS → CONNECTION
                </span>
              </div>
            </section>
          </main>
          <footer className="site-footer container">
            <div className="footer-top">
              <a href="#top" className="brand-link" aria-label="Respondly home">
                <Brand />
              </a>
              <p>Thoughtful answers. Thoughtful handoffs.</p>
              <a href="#top" className="back-top">
                Back to top <ArrowDown size={13} />
              </a>
            </div>
            <div className="footer-bottom">
              <span>© 2026 Respondly</span>
              <span>
                AI first. People always.
                <span className="status-dot" />
              </span>
            </div>
          </footer>
        </div>
      </LandingMotion>
    </PageTransition>
  );
}
