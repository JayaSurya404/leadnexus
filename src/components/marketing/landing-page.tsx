import Link from "next/link";

import type {
  LucideIcon,
} from "lucide-react";

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ContactRound,
  Link2,
  MousePointerClick,
  Network,
  RefreshCcw,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Link2,
    title:
      "Tracked business links",
    description:
      "Create campaign, social and QR links that preserve attribution when visitors reach your LeadNexus page.",
  },
  {
    icon: ContactRound,
    title:
      "Lead capture",
    description:
      "Collect visitor contact details without requiring customers to create an account.",
  },
  {
    icon: BrainCircuit,
    title:
      "Lead intelligence",
    description:
      "Score behaviour and intent using recorded page, product and contact activity.",
  },
  {
    icon: RefreshCcw,
    title:
      "Lead recovery",
    description:
      "Keep abandoned leads private for platform review before selectively revealing qualified opportunities to owners.",
  },
  {
    icon: BarChart3,
    title:
      "Real analytics",
    description:
      "Measure visitors, sources, products, direct contacts, recovered leads and conversions from database activity.",
  },
  {
    icon: Search,
    title:
      "Business SEO",
    description:
      "Manage metadata, indexing, canonical URLs, social previews and sitemap visibility for public business pages.",
  },
];

const steps = [
  {
    number: "01",
    title:
      "Build your business page",
    description:
      "Add your business information, products, services, social profiles, contact details and message templates.",
  },
  {
    number: "02",
    title:
      "Share tracked links",
    description:
      "Use LeadNexus links across social media, campaigns, advertisements and QR codes.",
  },
  {
    number: "03",
    title:
      "Understand visitor intent",
    description:
      "LeadNexus records meaningful behaviour and converts it into structured lead intelligence.",
  },
  {
    number: "04",
    title:
      "Follow up on the right leads",
    description:
      "Owners manage direct-contact and recovered leads through a clear qualification pipeline.",
  },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--muted),transparent_45%)]" />

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm font-medium">
              <Target className="size-4" />

              Lead capture,
              intelligence and
              recovery
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Turn business traffic
              into{" "}
              <span className="text-primary">
                actionable leads.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              LeadNexus helps
              businesses capture
              visitor information,
              understand buying
              intent, recover valuable
              opportunities and manage
              leads from one connected
              dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
              >
                <Link href="/signup">
                  Create your business
                  page

                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
              >
                <Link href="/login">
                  Sign in
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <Benefit text="No customer account required" />

              <Benefit text="Real database-backed analytics" />

              <Benefit text="Owner-controlled lead workflow" />
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section
        id="features"
        className="py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="One connected platform"
            title="Everything between a visitor and a qualified business lead."
            description="LeadNexus combines public business pages, attribution, behaviour tracking, intelligence, recovery and lead management without mixing telephony into the platform."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map(
              (feature) => (
                <FeatureCard
                  key={
                    feature.title
                  }
                  {...feature}
                />
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y bg-muted/25 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="A simple path from business link to business opportunity."
            description="Visitors remain friction-free while business owners receive structured information they can actually act on."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {steps.map(
              (step) => (
                <div
                  key={
                    step.number
                  }
                  className="rounded-2xl border bg-background p-6"
                >
                  <p className="text-sm font-bold text-primary">
                    {
                      step.number
                    }
                  </p>

                  <h3 className="mt-5 text-lg font-semibold">
                    {
                      step.title
                    }
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {
                      step.description
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="intelligence"
        className="py-20 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BrainCircuit className="size-6" />
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Intelligence based on
              what visitors actually
              do.
            </h2>

            <p className="mt-5 text-base leading-7 text-muted-foreground">
              LeadNexus evaluates
              meaningful behaviour
              such as lead-form
              submissions, product
              interest, return visits
              and contact actions.
            </p>

            <div className="mt-7 space-y-4">
              <Benefit text="HOT, WARM and COLD lead temperature" />

              <Benefit text="0–100 intent scoring" />

              <Benefit text="Primary product or service interest" />

              <Benefit text="Reasons behind the score" />

              <Benefit text="Recommended next action" />
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Intelligence
                    example
                  </p>

                  <CardTitle className="mt-2">
                    Behaviour becomes
                    context
                  </CardTitle>
                </div>

                <BrainCircuit className="size-6 text-primary" />
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <IntelligenceRow
                label="Contact details"
                value="Captured"
              />

              <IntelligenceRow
                label="Product interest"
                value="Identified"
              />

              <IntelligenceRow
                label="Behaviour"
                value="Analyzed"
              />

              <IntelligenceRow
                label="Recommended action"
                value="Generated"
              />

              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  The score explains
                  the lead.
                </p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Business owners see
                  the context behind an
                  opportunity instead
                  of receiving an
                  unexplained number.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="businesses"
        className="border-y bg-muted/25 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built around clear visibility"
            title="The right information reaches the right person."
            description="LeadNexus separates platform administration, business ownership and anonymous customer journeys instead of exposing every visitor lead automatically."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <RoleCard
              icon={
                Building2
              }
              title="Business owner"
              description="Build the public business presence, manage products, view owner-visible leads, track conversions and handle recovered opportunities."
            />

            <RoleCard
              icon={
                ShieldCheck
              }
              title="Platform admin"
              description="Review businesses, platform leads, intelligence and high-intent abandoned opportunities before releasing recovered leads."
            />

            <RoleCard
              icon={
                Users
              }
              title="Customer"
              description="Visit a public business page, explore products, submit contact information and choose a preferred contact channel without creating an account."
            />
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-3xl border bg-foreground p-8 text-background sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-background/70">
                <Network className="size-4" />
                Integration-ready
              </div>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Lead data stays
                structured and
                portable.
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-background/70">
                LeadNexus prepares
                controlled structured
                handoff events for
                external systems while
                keeping calling and
                telephony logic outside
                the LeadNexus product.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              variant="secondary"
            >
              <Link href="/signup">
                Start with LeadNexus

                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />

      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />

            <p className="ml-2 text-xs font-medium text-muted-foreground">
              LeadNexus workflow
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-5 sm:p-6">
          <FlowItem
            icon={
              Link2
            }
            title="Tracked visitor"
            description="Source and campaign attribution"
          />

          <FlowConnector />

          <FlowItem
            icon={
              MousePointerClick
            }
            title="Business engagement"
            description="Pages, products and contact activity"
          />

          <FlowConnector />

          <FlowItem
            icon={
              BrainCircuit
            }
            title="Lead intelligence"
            description="Intent, score, reasons and interest"
          />

          <FlowConnector />

          <FlowItem
            icon={
              RefreshCcw
            }
            title="Owner or recovery workflow"
            description="Controlled lead visibility"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FlowItem({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-background p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>

      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="ml-9 h-4 border-l border-dashed" />
  );
}

function Benefit({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 shrink-0 text-primary" />

      <span>
        {text}
      </span>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>

        <h3 className="mt-5 text-lg font-semibold">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex size-11 items-center justify-center rounded-xl border">
          <Icon className="size-5" />
        </div>

        <h3 className="mt-5 text-lg font-semibold">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function IntelligenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b pb-4 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>

      <p className="mt-5 text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}