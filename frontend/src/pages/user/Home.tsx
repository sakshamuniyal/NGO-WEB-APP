import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, HeartHandshake, Images, Sparkles } from "lucide-react";
import { CarouselSize } from "@/components/user/carousel";
import Hero from "@/components/user/hero";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import {
  btnPrimaryGiggles,
  fontDisplay,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

const Home = () => {
  return (
    <PublicPageLayout>
      <div className="flex flex-col">
        <div
          className={cn(
            gigglesPublicShell,
            "flex flex-col items-center justify-center pt-4"
          )}
        >
          <Hero />
          <CarouselSize />
        </div>

        <section className={cn(gigglesPublicShell, "mt-6 pb-6")}>
          <div className="rounded-[2rem] bg-white px-8 py-12 shadow-[0_20px_40px_rgba(45,47,49,0.06)] md:px-12 md:py-14">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#71757b]">
              At a glance
            </p>
            <h2
              className={`${fontDisplay} mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-3xl`}
            >
              Placeholder summary of what visitors should know first.
            </h2>
            <p
              className={`mt-6 max-w-2xl text-[1.02rem] leading-relaxed md:text-[1.05rem] ${gigglesSurface.onSurfaceVariant}`}
            >
              Replace this paragraph with your live mission statement, a crisp impact line, and one
              sentence on geography or focus areas. The numbers below are sample figures until you wire
              real metrics from your data sources.
            </p>
            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { label: "Placeholder reach", value: "12,400+" },
                { label: "Communities (sample)", value: "48" },
                { label: "Volunteer hours / yr", value: "3.2k" },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl px-5 py-6 ${gigglesSurface.containerLow}`}>
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#71757b]">
                    {s.label}
                  </dt>
                  <dd className={`${fontDisplay} mt-2 text-3xl font-bold text-[#006a3d]`}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={cn(gigglesPublicShell, "grid gap-6 py-10 md:grid-cols-3 lg:gap-8")}>
          <HomePromo
            className="bg-[#fde7ee]"
            icon={<HeartHandshake className="h-5 w-5 text-[#b7004d]" strokeWidth={1.75} />}
            eyebrow="Stories"
            body="Placeholder: meet families and cases your programs support — link to real stories on the cases page."
            href="/cases"
            cta="Browse cases"
            ctaClass="text-[#b7004d]"
          />
          <HomePromo
            className="bg-[#fbeed4]"
            icon={<Sparkles className="h-5 w-5 text-[#755700]" strokeWidth={1.75} />}
            eyebrow="Vision"
            body="Placeholder: share where the organization is headed over the next years and how others can join."
            href="/vision"
            cta="Read our vision"
            ctaClass="text-[#755700]"
          />
          <HomePromo
            className="bg-[#e4f6f5]"
            icon={<Images className="h-5 w-5 text-[#006a3d]" strokeWidth={1.75} />}
            eyebrow="Gallery"
            body="Placeholder: highlight field photos stored in S3 — thumbnails load from your gallery prefix."
            href="/gallery"
            cta="Open gallery"
            ctaClass="text-[#006a3d]"
          />
        </section>

        <section className={cn(gigglesPublicShell, "mb-12")}>
          <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-[#0d3f2a] px-8 py-10 text-white shadow-[0_20px_44px_rgba(0,0,0,0.15)] md:flex-row md:items-center md:px-12">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/80">
                Placeholder banner
              </p>
              <p className={`${fontDisplay} mt-3 max-w-xl text-xl font-semibold md:text-2xl`}>
                One line inviting donations or volunteering — swap for your campaign hook.
              </p>
            </div>
            <Link
              to="/donate"
              className={cn(btnPrimaryGiggles, "inline-flex shrink-0 py-4 text-[0.9rem]")}
            >
              Donate now
            </Link>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
};

function HomePromo({
  className,
  icon,
  eyebrow,
  body,
  href,
  cta,
  ctaClass,
}: {
  className: string;
  icon: ReactNode;
  eyebrow: string;
  body: string;
  href: string;
  cta: string;
  ctaClass: string;
}) {
  return (
    <div className={`${className} flex flex-col justify-between rounded-[2rem] p-8`}>
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#4a4c50]">{eyebrow}</p>
        </div>
        <p className="mt-4 text-[0.975rem] font-medium leading-snug text-[#2d2f31]">{body}</p>
      </div>
      <Link
        to={href}
        className={cn(
          "mt-10 inline-flex items-center gap-1 text-sm font-bold hover:gap-2",
          ctaClass
        )}
      >
        {cta}
        <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  );
}

export default Home;
