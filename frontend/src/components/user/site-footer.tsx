import { Link } from "react-router-dom";
import { HeartHandshake, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import {
  btnPrimaryGiggles,
  fontDisplay,
  fontBody,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { cn } from "@/lib/utils";

const exploreLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/vision", label: "Vision" },
  { to: "/cases", label: "Cases" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

const getInvolvedLinks = [
  { to: "/donate", label: "Donate" },
  { to: "/login", label: "Login" },
] as const;

export function SiteFooter() {
  return (
    <footer
      className={cn(
        "border-t border-[#e0e0e6]/90",
        gigglesSurface.containerLow,
        fontBody
      )}
    >
      <div className={cn(gigglesPublicShell, "pt-14 pb-8")}>
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Giggles Foundation"
                className="h-10 w-auto md:h-11"
              />
            </Link>
            <p
              className={`mt-5 max-w-[16rem] text-[0.9rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
            >
              Placeholder tagline — empowering children through education, healthcare, and community.
            </p>
            <Link
              to="/donate"
              className={cn(btnPrimaryGiggles, "mt-8 inline-flex py-3.5 text-[0.85rem]")}
            >
              Support our work
            </Link>
          </div>

          <nav aria-label="Explore">
            <h2
              className={`${fontDisplay} text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#2d2f31]`}
            >
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[0.9rem] font-medium text-[#5a5c5e] transition hover:text-[#006a3d]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Get involved">
            <h2
              className={`${fontDisplay} text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#2d2f31]`}
            >
              Get involved
            </h2>
            <ul className="mt-5 space-y-3">
              {getInvolvedLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[0.9rem] font-medium text-[#5a5c5e] transition hover:text-[#006a3d]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <p
              className={`mt-6 flex items-start gap-2 text-[0.8rem] leading-snug ${gigglesSurface.onSurfaceVariant}`}
            >
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[#006a3d]" aria-hidden />
              <span>Placeholder: volunteer drives, CSR partnerships, and campus chapters.</span>
            </p>
          </nav>

          <div>
            <h2
              className={`${fontDisplay} text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#2d2f31]`}
            >
              Contact
            </h2>
            <ul className="mt-5 space-y-5">
              <li className="flex gap-3">
                <MapPinIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#006a3d]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className={`text-[0.875rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}>
                  1516, 3rd Floor, Wazir Nagar
                  <br />
                  Kotla Mubarakpur, New Delhi — 110003
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon
                  className="h-4 w-4 shrink-0 text-[#755700]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <a
                  href="tel:+917678656575"
                  className="text-[0.875rem] font-medium text-[#2d2f31] hover:text-[#006a3d]"
                >
                  (+91) 76786 56575
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon
                  className="h-4 w-4 shrink-0 text-[#5b4dcf]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <a
                  href="mailto:hello@gigglesfoundation.com"
                  className="text-[0.875rem] font-medium text-[#2d2f31] hover:text-[#006a3d]"
                >
                  hello@gigglesfoundation.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={`mt-14 flex flex-col gap-6 border-t border-[#d8d8de]/80 pt-8 text-[0.7rem] uppercase tracking-[0.14em] text-[#72757a] sm:flex-row sm:items-center sm:justify-between`}
        >
          <p>© {new Date().getFullYear()} Giggles Foundation. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Link className="transition hover:text-[#006a3d]" to="/">
              Privacy
            </Link>
            <Link className="transition hover:text-[#006a3d]" to="/contact">
              Support
            </Link>
            <Link className="transition hover:text-[#006a3d]" to="/about">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
