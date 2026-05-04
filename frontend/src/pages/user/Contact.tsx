import {
  useState,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import ReCAPTCHA, { type ReCAPTCHAInstance } from "react-google-recaptcha";
import {
  ArrowRightIcon,
  HeartHandshake,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";
import { api } from "../../services/api";
import {
  btnPrimaryGiggles,
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import { cn } from "@/lib/utils";

export default function Contact() {
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    message: string;
  }>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const recaptchaRef = useRef<ReCAPTCHAInstance | null>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus({ type: null, message: "" });

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.message
    ) {
      setSubmitStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (!import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      setSubmitStatus({
        type: "error",
        message: "reCAPTCHA is not configured for this deployment.",
      });
      return;
    }

    if (!recaptchaToken) {
      setSubmitStatus({
        type: "error",
        message: "Please complete the reCAPTCHA verification.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/api/contact", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        recaptchaToken,
      });

      if (response.data.success) {
        setSubmitStatus({
          type: "success",
          message:
            response.data.message ||
            "Thank you for reaching out. Our team will respond shortly.",
        });
        setFormData({ name: "", email: "", phone: "", message: "" });
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      } else {
        setSubmitStatus({
          type: "error",
          message:
            response.data.message || "Submission failed. Please try again.",
        });
      }
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosErr.response?.data?.message ||
        "Something went wrong. Please try later.";
      setSubmitStatus({ type: "error", message: errorMessage });
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldWrap = `${gigglesSurface.containerLow}`;

  return (
    <PublicPageLayout>
      <div className={cn(gigglesPublicShell, "pb-14 pt-8 lg:pt-14")}>
        <div className="mb-14 flex flex-wrap items-start gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#ffca4d] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#755700]">
            <HeartHandshake
              className="h-3.5 w-3.5"
              strokeWidth={2}
              aria-hidden
            />{" "}
            Get in touch
          </span>
        </div>

        <h1
          className={`${fontDisplay} mb-10 max-w-3xl text-[2.15rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.75rem] lg:text-[3.2rem]`}
        >
          We&apos;d love to hear from{" "}
          <span className="block text-[#755700] md:inline md:leading-none">
            you.
          </span>
        </h1>

        <p
          className={`mb-16 max-w-2xl text-[1.05rem] leading-relaxed md:text-[1.1rem] ${gigglesSurface.onSurfaceVariant}`}
        >
          Whether you have questions about cases, volunteering, partnerships, or
          you simply want to share a little joy — our team answers every message
          we receive.
        </p>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)] lg:items-start xl:gap-14">
          <div className={cn(gigglesCard, "p-8 lg:p-10")}>
            {submitStatus.type ? (
              <div
                className={`mb-8 rounded-2xl px-4 py-3 text-sm ${
                  submitStatus.type === "success"
                    ? "bg-[#e8f5ee] text-[#0d4f2f]"
                    : "bg-[#fce8ee] text-[#8f1a3f]"
                }`}
              >
                {submitStatus.message}
              </div>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <NamedField label="Full name">
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full rounded-2xl border-0 px-4 py-3.5 text-[#2d2f31] outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-[#006a3d]/30 ${fieldWrap}`}
                    placeholder="Ada Lovelace"
                  />
                </NamedField>
                <NamedField label="Email address">
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full rounded-2xl border-0 px-4 py-3.5 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-[#006a3d]/30 ${fieldWrap}`}
                    placeholder="you@example.org"
                  />
                </NamedField>
              </div>
              <NamedField label="Phone number">
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full rounded-2xl border-0 px-4 py-3.5 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-[#006a3d]/30 ${fieldWrap}`}
                  placeholder="+91 98765 43210"
                />
              </NamedField>
              <NamedField label="Your message">
                <textarea
                  required
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`w-full resize-none rounded-2xl border-0 px-4 py-3.5 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-[#006a3d]/30 ${fieldWrap}`}
                  placeholder="How can we help?"
                />
              </NamedField>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    btnPrimaryGiggles,
                    "py-4 text-[0.9rem]",
                    isSubmitting && "opacity-60",
                  )}
                >
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
                {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={String(import.meta.env.VITE_RECAPTCHA_SITE_KEY)}
                    onChange={(t: string | null) => setRecaptchaToken(t)}
                  />
                ) : (
                  <p className={`text-xs ${gigglesSurface.onSurfaceVariant}`}>
                    Configure <code>VITE_RECAPTCHA_SITE_KEY</code> to enable
                    submissions.
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div
              className={`${gigglesSurface.containerLow} rounded-[2rem] p-8 lg:p-9`}
            >
              <InfoRow
                icon={
                  <MapPinIcon
                    className="h-5 w-5 text-[#006a3d]"
                    strokeWidth={1.75}
                  />
                }
                title="Our office"
                lines={[
                  "1516, 3rd Floor, Wazir Nagar",
                  "Kotla Mubarakpur, New Delhi — 110003",
                  "India",
                ]}
              />
              <div className="my-10" aria-hidden />
              <InfoRow
                icon={
                  <PhoneIcon
                    className="h-5 w-5 text-[#755700]"
                    strokeWidth={1.75}
                  />
                }
                title="Phone"
                lines={["(+91) 76786 56575", "Mon–Fri · 10:00 – 17:30 IST"]}
              />
              <div className="my-10" aria-hidden />
              <InfoRow
                icon={
                  <MailIcon
                    className="h-5 w-5 text-[#5b4dcf]"
                    strokeWidth={1.75}
                  />
                }
                title="Email"
                lines={[
                  "hello@gigglesfoundation.com",
                  "info@gigglesfoundation.com",
                ]}
              />
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-[#0d3f2a] p-10 text-white shadow-[0_20px_44px_rgba(0,0,0,0.15)]">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#006a3d_12%,transparent_72%)]" />
              <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/80">
                Headquarters
              </p>
              <p
                className={`relative ${fontDisplay} mt-4 text-2xl font-semibold`}
              >
                Kotla · New&nbsp;Delhi
              </p>
              <p className="relative mt-3 max-w-[14rem] text-sm text-white/85">
                We welcome scheduled visits — email us before you arrive.
              </p>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-20 grid gap-6 md:grid-cols-3 lg:gap-8">
          <PromoSlice
            className="bg-[#fde7ee]"
            eyebrow="Volunteer"
            body="Lead weekend drives or assist our field partners with logistics."
            ctaHref="/contact"
            ctaLabel="Apply now"
            ctaTone="pink"
          />
          <PromoSlice
            className="bg-[#fbeed4]"
            eyebrow="Partner with us"
            body="Shape CSR programs with meaningful impact dashboards."
            ctaHref="/contact"
            ctaLabel="Learn more"
            ctaTone="gold"
          />
          <PromoSlice
            className="bg-[#e4f6f5]"
            eyebrow="Media"
            body="Press releases and brand-approved photography."
            ctaHref="/contact"
            ctaLabel="Press kit"
            ctaTone="green"
          />
        </section>
      </div>
    </PublicPageLayout>
  );
}

function NamedField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#71757b]">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({
  icon,
  title,
  lines,
}: {
  icon: ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(45,47,49,0.06)]">
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold text-[#2d2f31]`}>{title}</p>
        {lines.map((line) => (
          <p
            key={line}
            className={`text-[0.9rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function PromoSlice({
  className,
  eyebrow,
  body,
  ctaHref,
  ctaLabel,
  ctaTone,
}: {
  className: string;
  eyebrow: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  ctaTone: "pink" | "gold" | "green";
}) {
  const tone =
    ctaTone === "pink"
      ? "text-[#b7004d]"
      : ctaTone === "gold"
        ? "text-[#755700]"
        : "text-[#006a3d]";
  return (
    <div
      className={`${className} flex flex-col justify-between rounded-[2rem] p-8`}
    >
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#4a4c50]">
          {eyebrow}
        </p>
        <p className="mt-4 text-[0.975rem] font-medium leading-snug text-[#2d2f31]">
          {body}
        </p>
      </div>
      <Link
        to={ctaHref}
        className={`mt-10 inline-flex items-center gap-1 text-sm font-bold ${tone} hover:gap-2`}
      >
        {ctaLabel}
        <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  );
}
