import DonationForm from "@/components/user/DonationForm";
import { PublicPageLayout } from "@/components/user/public-page-layout";
import { useLocation } from "react-router-dom";

const Donate = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const caseId = params.get("caseId") || undefined;
  return (
    <PublicPageLayout>
      <DonationForm caseId={caseId} />
    </PublicPageLayout>
  );
};

export default Donate;
