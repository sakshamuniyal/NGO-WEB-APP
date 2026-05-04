import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import {
  fontDisplay,
  gigglesCard,
  gigglesPublicShell,
  gigglesSurface,
} from "@/lib/giggles-classes";
import { fetchGalleryImages, type GalleryItem } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGalleryImages();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled)
          setError("We couldn’t load images right now. Try again shortly.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicPageLayout>
      <div className={cn(gigglesPublicShell, "pb-14 pt-8 lg:pt-14")}>
        <div className="mb-14 flex flex-wrap items-start gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fce4ef] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#b7004d]">
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
            Moments
          </span>
        </div>

        <h1
          className={`${fontDisplay} mb-10 max-w-3xl text-[2.15rem] font-semibold tracking-[-0.02em] text-[#2d2f31] md:text-[2.75rem] lg:text-[3.2rem]`}
        >
          Gallery{" "}
          <span className="block text-[#755700] md:inline md:leading-none">
            from our work.
          </span>
        </h1>

        <p
          className={`mb-10 max-w-2xl text-[1.05rem] leading-relaxed md:text-[1.1rem] ${gigglesSurface.onSurfaceVariant}`}
        >
          Images will be coming soon.
        </p>

        {error ? (
          <div className="mb-8 rounded-2xl bg-[#fce8ee] px-4 py-3 text-sm text-[#8f1a3f]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div
            className={`flex items-center gap-3 py-20 ${gigglesSurface.onSurfaceVariant}`}
          >
            <Loader2
              className="h-6 w-6 animate-spin text-[#006a3d]"
              aria-hidden
            />
            <span>Loading gallery…</span>
          </div>
        ) : items.length === 0 ? (
          <div
            className={`rounded-[2rem] px-8 py-14 text-center ${gigglesSurface.containerLow}`}
          >
            <p
              className={`${fontDisplay} text-lg font-semibold text-[#2d2f31]`}
            >
              No photos yet
            </p>
            <p
              className={`mx-auto mt-3 max-w-md text-sm leading-relaxed ${gigglesSurface.onSurfaceVariant}`}
            >
              Add image files (JPEG, PNG, WebP, GIF, AVIF) under the configured
              S3.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setActive(item)}
                  className={cn(
                    gigglesCard,
                    "group w-full overflow-hidden p-0 text-left shadow-[0_12px_28px_rgba(45,47,49,0.08)] transition hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006a3d]/40",
                  )}
                >
                  <span className="sr-only">Open image {item.key}</span>
                  <img
                    src={item.url}
                    alt=""
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[90vh] max-w-[min(96vw,56rem)] gap-0 overflow-hidden border-0 bg-black p-0 text-white sm:rounded-2xl [&_button]:text-white [&_button]:hover:opacity-100 [&_button]:hover:text-white">
          <DialogHeader className="sr-only">
            <DialogTitle>Gallery image</DialogTitle>
          </DialogHeader>
          {active ? (
            <img
              src={active.url}
              alt=""
              className="max-h-[85vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </PublicPageLayout>
  );
}
