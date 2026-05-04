import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Case, CaseType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileTextIcon, Quote, Share2 } from "lucide-react";
import {
  btnPrimaryGiggles,
  btnSecondaryGiggles,
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import { cn } from "@/lib/utils";

const CASE_TYPES: { label: string; value: CaseType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Health", value: "HEALTH" },
  { label: "Education", value: "EDUCATION" },
  { label: "Other", value: "OTHER" },
];

function truncateWords(text: string, wordLimit = 28) {
  const words = text.split(" ");
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "…";
}

function caseTypeAccent(t: CaseType): string {
  switch (t) {
    case "HEALTH":
      return "bg-emerald-100 text-emerald-900";
    case "EDUCATION":
      return "bg-[#ffca4d] text-[#755700]";
    default:
      return "bg-[#fce4ef] text-[#b7004d]";
  }
}

const Cases = () => {
  const location = useLocation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CaseType | "ALL">("ALL");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<Case[]>(
          `${import.meta.env.VITE_API_BASE_URL}/api/cases`,
          { withCredentials: true },
        );
        setCases(response.data.filter((c) => c.isActive));
      } catch {
        setError("Failed to load stories. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    if (!cases.length) return;
    const params = new URLSearchParams(location.search);
    const caseId = params.get("caseId");
    if (!caseId) return;
    const found = cases.find((c) => c.id === caseId);
    if (!found) return;
    setSelectedCase(found);
    setDialogOpen(true);
  }, [cases, location.search]);

  const filteredCases =
    filter === "ALL" ? cases : cases.filter((c) => c.typeOfCase === filter);

  const featured = filteredCases[0];

  async function shareCase(c: Case) {
    const url = `${window.location.origin}/cases?caseId=${encodeURIComponent(
      c.id,
    )}`;
    const title = c.title || "Giggles Foundation case";
    const text = `Support this case: ${title}`;

    try {
      if (navigator.share) {
        setShareMessage("Opening share options…");
        await navigator.share({ title, text, url });
        setShareMessage("Ready to share.");
        window.setTimeout(() => setShareMessage(null), 2000);
        return;
      }
    } catch {
      // ignore and fallback to clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedCaseId(c.id);
      setShareMessage("Link copied. Share it with your friends!");
    } catch {
      setShareMessage(
        "Couldn’t copy link automatically. Please copy from the address bar.",
      );
    } finally {
      window.setTimeout(() => {
        setShareMessage(null);
        setCopiedCaseId(null);
      }, 2500);
    }
  }

  return (
    <PublicPageLayout>
      {shareMessage ? (
        <div className="fixed inset-x-0 bottom-5 z-[210] flex justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#e8f5ee] px-4 py-3 text-center text-sm font-medium text-[#0d4f2f] shadow-[0_18px_44px_rgba(0,0,0,0.12)]">
            {shareMessage}
          </div>
        </div>
      ) : null}
      <section
        className={cn(gigglesPublicShell, "pb-10 pt-6 lg:pb-14 lg:pt-10")}
      >
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#b7004d]">
          Impact in action
        </p>
        <h1
          className={`${fontDisplay} max-w-3xl text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-[#2d2f31] md:text-[2.5rem] lg:text-[2.85rem]`}
        >
          Our Stories of{" "}
          <em className="text-[#755700] not-italic underline decoration-[#b7004d]/45 decoration-[0.1875rem] underline-offset-[0.35rem]">
            Hope
          </em>{" "}
          &amp; Resilience
        </h1>
        <p
          className={`mt-4 max-w-2xl text-[1rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
        >
          Explore active cases supporting children and families. Every gift goes
          where it is needed most.
        </p>
      </section>

      <section className="sticky top-[4.5rem] z-30 border-b border-transparent bg-[#f6f6f9]/95 py-4 backdrop-blur-sm">
        <div
          className={cn(
            gigglesPublicShell,
            "flex flex-wrap justify-center gap-2 lg:justify-start lg:gap-3",
          )}
        >
          {CASE_TYPES.map((type) => {
            const active = filter === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setFilter(type.value)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-[#006a3d] text-white shadow-[0_12px_24px_rgba(0,106,61,0.22)]"
                    : `${gigglesSurface.containerLow} text-[#2d2f31] hover:bg-[#e8e8ec]`,
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className={cn(gigglesPublicShell, "pb-16 lg:pb-24")}>
        {loading ? (
          <p className={`py-24 text-center ${gigglesSurface.onSurfaceVariant}`}>
            Loading cases…
          </p>
        ) : error ? (
          <p className="py-24 text-center text-[#b7004d]">{error}</p>
        ) : filteredCases.length === 0 ? (
          <p className={`py-24 text-center ${gigglesSurface.onSurfaceVariant}`}>
            No cases match this filter right now.
          </p>
        ) : (
          <>
            {featured ? (
              <div
                className={`mb-12 grid overflow-hidden lg:grid-cols-2 lg:rounded-[2rem] ${gigglesCard} p-0`}
              >
                <div className="flex flex-col justify-center gap-4 bg-[#006a3d] p-8 text-white lg:p-12">
                  <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest">
                    Major spotlight
                  </span>
                  <h2
                    className={`${fontDisplay} text-2xl font-semibold leading-snug lg:text-3xl`}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/90 line-clamp-4">
                    {truncateWords(featured.description, 36)}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button type="button" asChild className={btnPrimaryGiggles}>
                      <Link to={`/donate?caseId=${featured.id}`}>
                        Donate Now
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                      onClick={() => {
                        setSelectedCase(featured);
                        setDialogOpen(true);
                      }}
                    >
                      Read more
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                      onClick={() => void shareCase(featured)}
                    >
                      <Share2 className="h-4 w-4" />
                      {copiedCaseId === featured.id ? "Copied" : "Share"}
                    </Button>
                    {featured.pdfUrls?.[0] ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className={`rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25`}
                        onClick={() =>
                          window.open(featured.pdfUrls?.[0], "_blank")
                        }
                      >
                        Full report →
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="relative min-h-[14rem] bg-[#e8eae4] lg:min-h-[20rem]">
                  {featured.imageUrls?.[0] ? (
                    <img
                      src={featured.imageUrls[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center text-sm ${gigglesSurface.onSurfaceVariant}`}
                    >
                      Image coming soon
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute left-4 top-4 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide",
                      caseTypeAccent(featured.typeOfCase),
                    )}
                  >
                    {featured.typeOfCase}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {(featured ? filteredCases.slice(1) : filteredCases).map((c) => (
                <article
                  key={c.id}
                  className={`${gigglesCard} flex cursor-pointer flex-col overflow-hidden hover:shadow-[0_24px_48px_rgba(45,47,49,0.09)]`}
                  onClick={() => {
                    setSelectedCase(c);
                    setDialogOpen(true);
                  }}
                >
                  <div className="relative aspect-[16/11] bg-[#e8eaf0]">
                    {c.imageUrls?.[0] ? (
                      <img
                        src={c.imageUrls[0]}
                        alt=""
                        className="h-full w-full rounded-t-[2rem] object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#889]">
                        No image
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider",
                        caseTypeAccent(c.typeOfCase),
                      )}
                    >
                      {c.typeOfCase}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-6 pb-6 pt-8">
                    <h3
                      className={`${fontDisplay} mb-4 text-xl font-semibold leading-snug`}
                    >
                      {c.title}
                    </h3>
                    <p
                      className={`mb-8 flex-1 text-sm leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
                    >
                      {truncateWords(c.description, 24)}{" "}
                      <button
                        type="button"
                        className="font-semibold text-[#006a3d] hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCase(c);
                          setDialogOpen(true);
                        }}
                      >
                        Read more
                      </button>
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className={`flex-1 min-w-[7rem] ${btnPrimaryGiggles} py-3 text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/donate?caseId=${c.id}`;
                        }}
                      >
                        Donate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className={`rounded-full px-5 ${btnSecondaryGiggles}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void shareCase(c);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        {copiedCaseId === c.id ? "Copied" : "Share"}
                      </Button>
                      {c.pdfUrls?.[0] ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className={`rounded-full px-5 ${btnSecondaryGiggles}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(c.pdfUrls?.[0] ?? "", "_blank");
                          }}
                        >
                          <FileTextIcon className="h-4 w-4" />
                          PDF
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className={`mt-16 lg:mt-24 ${gigglesCard} p-8 md:p-12`}>
              <Quote
                className="mb-6 h-8 w-8 text-[#006a3d]"
                strokeWidth={1.25}
                aria-hidden
              />
              <blockquote
                className={`${fontDisplay} text-xl font-medium leading-snug text-[#2d2f31] md:text-2xl`}
              >
                &ldquo;A small gesture from someone far away restored my faith
                that people still care.&rdquo;
              </blockquote>
              <footer className="mt-10 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f0f3] text-sm font-bold text-[#006a3d]">
                  P
                </div>
                <div>
                  <p className="font-semibold text-[#2d2f31]">
                    Parent &amp; caregiver
                  </p>
                  <p className={`text-sm ${gigglesSurface.onSurfaceVariant}`}>
                    Supported through the community fund
                  </p>
                </div>
              </footer>
            </aside>

            <section
              className={`mt-16 lg:mt-20 ${gigglesSurface.containerLow} rounded-[2rem] p-10 md:p-14`}
            >
              <p
                className={`mx-auto mb-10 max-w-2xl text-center text-[1.25rem] font-medium leading-snug text-[#2d2f31] md:text-2xl`}
              >
                Be the reason someone{" "}
                <span className="text-[#755700] underline decoration-[#ffca4d] decoration-[0.1875rem] underline-offset-4">
                  smiles
                </span>{" "}
                today.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button type="button" asChild className={btnPrimaryGiggles}>
                  <Link to="/donate">Make a donation</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className={btnSecondaryGiggles}
                >
                  <Link to="/contact">Become a volunteer</Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={cn(
            gigglesCard,
            "max-h-[90vh] max-w-xl overflow-y-auto px-8 py-10 sm:max-w-4xl",
          )}
        >
          {selectedCase ? (
            <>
              <DialogHeader>
                <DialogTitle className={`${fontDisplay} text-2xl`}>
                  {selectedCase.title}
                </DialogTitle>
                <DialogDescription
                  className={`text-sm uppercase tracking-wider text-[#006a3d]`}
                >
                  {selectedCase.typeOfCase} · Supporting{" "}
                  {selectedCase.patientName}
                </DialogDescription>
              </DialogHeader>
              {selectedCase.imageUrls?.[0] ? (
                <div className="mt-6 h-56 overflow-hidden rounded-2xl bg-[#eaecef] sm:h-72">
                  <img
                    src={selectedCase.imageUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div
                className={`mt-6 max-h-[40vh] overflow-y-auto whitespace-pre-line text-[0.9375rem] leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
              >
                {selectedCase.description}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" asChild className={btnPrimaryGiggles}>
                  <Link to={`/donate?caseId=${selectedCase.id}`}>
                    Donate to this case
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={btnSecondaryGiggles}
                  onClick={() => void shareCase(selectedCase)}
                >
                  <Share2 className="h-4 w-4" />
                  {copiedCaseId === selectedCase.id ? "Copied" : "Share"}
                </Button>
                {selectedCase.pdfUrls?.[0] ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={btnSecondaryGiggles}
                    onClick={() =>
                      window.open(selectedCase.pdfUrls?.[0], "_blank")
                    }
                  >
                    View PDF
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PublicPageLayout>
  );
};

export default Cases;
