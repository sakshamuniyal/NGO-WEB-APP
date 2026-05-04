import { fontBody, gigglesSurface } from "@/lib/giggles-classes";
import { SiteFooter } from "@/components/user/site-footer";

export function PublicPageLayout({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  /** Set false for auth flows (e.g. login) where the marketing footer should not appear. */
  showFooter?: boolean;
}) {
  return (
    <div
      className={`flex min-h-screen flex-col antialiased ${fontBody} ${gigglesSurface.base}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {showFooter ? <SiteFooter /> : null}
    </div>
  );
}
