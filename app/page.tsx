import RadioPlayer from "@/components/RadioPlayer";
import { PartnersSidebar, PartnersBanner } from "@/components/PartnersSidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0">
        <RadioPlayer />
      </div>
      <PartnersSidebar />
      <PartnersBanner />
    </div>
  );
}
