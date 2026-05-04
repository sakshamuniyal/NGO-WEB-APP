import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, Heart, Leaf, Users } from "lucide-react";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import {
  btnPrimaryGiggles,
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

export default function About() {
  return (
    <PublicPageLayout>
      <div className={cn(gigglesPublicShell, "pb-14 pt-8 lg:pt-14")}>
        <div className="mb-14 flex flex-wrap items-start gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e4f6f5] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#006a3d]">
            <Heart className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Our story
          </span>
        </div>

        <h1
          className={`${fontDisplay} mb-10 max-w-3xl text-[2.15rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.75rem] lg:text-[3.2rem]`}
        >
          Placeholder headline about{" "}
          <span className="block text-[#755700] md:inline md:leading-none">who we are.</span>
        </h1>

        <p
          className={`mb-16 max-w-2xl text-[1.05rem] leading-relaxed md:text-[1.1rem] ${gigglesSurface.onSurfaceVariant}`}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris — this is placeholder copy until your team replaces it with the real foundation
          narrative, milestones, and founder notes.
        </p>

        <div className="grid gap-8 lg:grid-cols-3">
          <ValueCard
            icon={<Users className="h-6 w-6 text-[#006a3d]" strokeWidth={1.75} />}
            title="Community first"
            body="Placeholder: how we listen to families, volunteers, and local partners before we design programs."
          />
          <ValueCard
            icon={<Leaf className="h-6 w-6 text-[#755700]" strokeWidth={1.75} />}
            title="Sustainable impact"
            body="Placeholder: short blurb on long-term outcomes, measurement, and ethical use of donations."
          />
          <ValueCard
            icon={<Heart className="h-6 w-6 text-[#b7004d]" strokeWidth={1.75} />}
            title="Joy in the work"
            body="Placeholder: why dignity, celebration, and child-centered care matter in every initiative."
          />
        </div>

        <section className="mt-20">
          <h2 className={`${fontDisplay} mb-10 text-2xl font-semibold text-[#2d2f31] md:text-3xl`}>
            Milestones (placeholder)
          </h2>
          <div className="space-y-6">
            {[
              {
                year: "20XX",
                text: "Placeholder: founding story — a small pilot in one neighborhood.",
              },
              {
                year: "20XX",
                text: "Placeholder: first hundred families supported; early education hub opens.",
              },
              {
                year: "20XX",
                text: "Placeholder: regional expansion and partnerships with healthcare networks.",
              },
            ].map((m) => (
              <div
                key={m.year + m.text}
                className={`flex flex-col gap-3 rounded-[2rem] border-0 px-8 py-7 sm:flex-row sm:items-start sm:gap-10 ${gigglesSurface.containerLow}`}
              >
                <p className={`${fontDisplay} shrink-0 text-xl font-bold text-[#006a3d]`}>{m.year}</p>
                <p className={`text-[0.975rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div
          className={`relative mt-20 overflow-hidden rounded-[2rem] ${gigglesCard} p-10 md:flex md:items-center md:justify-between md:gap-10`}
        >
          <div className="max-w-xl">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#71757b]">
              Get involved
            </p>
            <p className={`${fontDisplay} mt-3 text-xl font-semibold text-[#2d2f31] md:text-2xl`}>
              Placeholder call-to-action for volunteers and donors.
            </p>
            <p className={`mt-3 text-sm leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
              Replace this block with your preferred next step: book a visit, start a fundraiser, or
              explore active cases.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 md:mt-0">
            <Link to="/donate" className={cn(btnPrimaryGiggles, "inline-flex py-4 text-[0.9rem]")}>
              Donate
            </Link>
            <Link
              to="/cases"
              className="inline-flex items-center gap-1 rounded-full border-2 border-black/[0.08] bg-white px-6 py-3 text-[0.875rem] font-semibold text-[#2d2f31] hover:bg-[#f8f8fa]"
            >
              View cases
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className={cn(gigglesCard, "flex flex-col gap-4 p-8")}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f0f3]">{icon}</div>
      <h3 className={`${fontDisplay} text-lg font-semibold text-[#2d2f31]`}>{title}</h3>
      <p className={`text-[0.95rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>{body}</p>
    </div>
  );
}
