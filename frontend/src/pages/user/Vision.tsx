import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Binoculars, Goal, Sparkles, Sun } from "lucide-react";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import {
  btnPrimaryGiggles,
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

export default function Vision() {
  return (
    <PublicPageLayout>
      <div className={cn(gigglesPublicShell, "pb-14 pt-8 lg:pt-14")}>
        <div className="mb-14 flex flex-wrap items-start gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fbeed4] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#755700]">
            <Binoculars className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> North star
          </span>
        </div>

        <h1
          className={`${fontDisplay} mb-10 max-w-3xl text-[2.15rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.75rem] lg:text-[3.2rem]`}
        >
          A placeholder vision for{" "}
          <span className="block text-[#006a3d] md:inline md:leading-none">the next decade.</span>
        </h1>

        <p
          className={`mb-16 max-w-2xl text-[1.05rem] leading-relaxed md:text-[1.1rem] ${gigglesSurface.onSurfaceVariant}`}
        >
          This page holds temporary text describing where the organization is headed: equitable access
          to care and learning, measurable outcomes, and transparent reporting. Swap in your real vision
          statement, strategic pillars, and public commitments when ready.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <PillarCard
            icon={<Sun className="h-6 w-6 text-[#755700]" />}
            title="Pillar I — Placeholder"
            points={[
              "Every child in our focus regions has a pathway to enrollment support.",
              "Care navigators shorten wait times for essential services (placeholder metric).",
            ]}
            tone="bg-[#fbeed4]/60"
          />
          <PillarCard
            icon={<Goal className="h-6 w-6 text-[#006a3d]" />}
            title="Pillar II — Placeholder"
            points={[
              "Donor dollars trace to program lines with quarterly public summaries.",
              "Local councils co-design program adjustments twice per year.",
            ]}
            tone="bg-[#e4f6f5]/80"
          />
          <PillarCard
            icon={<Sparkles className="h-6 w-6 text-[#b7004d]" />}
            title="Pillar III — Placeholder"
            points={[
              "Creative learning labs pilot in three districts (placeholder).",
              "Alumni mentorship network scales through volunteer hours, not ad spend.",
            ]}
            tone="bg-[#fde7ee]/70"
          />
          <PillarCard
            icon={<Binoculars className="h-6 w-6 text-[#5b4dcf]" />}
            title="Horizon 203X — Placeholder"
            points={[
              "National policy advocacy chapter with youth ambassadors.",
              "Open data hub for anonymized impact dashboards.",
            ]}
            tone="bg-[#f0f0f3]"
          />
        </div>

        <section className="mt-20">
          <h2 className={`${fontDisplay} mb-6 text-2xl font-semibold text-[#2d2f31]`}>
            Principles we publish (placeholder)
          </h2>
          <ul
            className={`space-y-4 text-[0.975rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
          >
            <li>Transparency in fundraising and allocation — replace with your exact pledge.</li>
            <li>Child safety and data minimization in every digital touchpoint.</li>
            <li>Feedback loops: communities can reach leadership through structured channels.</li>
          </ul>
        </section>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link to="/contact" className={cn(btnPrimaryGiggles, "inline-flex py-4 text-[0.9rem]")}>
            Talk to us
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center rounded-full border-2 border-black/[0.08] bg-white px-6 py-3 text-[0.875rem] font-semibold text-[#2d2f31] hover:bg-[#f8f8fa]"
          >
            Read about us
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}

function PillarCard({
  icon,
  title,
  points,
  tone,
}: {
  icon: ReactNode;
  title: string;
  points: string[];
  tone: string;
}) {
  return (
    <div className={cn(gigglesCard, "p-8", tone)}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(45,47,49,0.06)]">
          {icon}
        </div>
        <h3 className={`${fontDisplay} text-lg font-semibold text-[#2d2f31]`}>{title}</h3>
      </div>
      <ul className={`space-y-3 text-[0.92rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#006a3d]" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
