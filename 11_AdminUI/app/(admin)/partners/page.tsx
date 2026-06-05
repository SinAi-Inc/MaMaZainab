import { readBranches } from "@/lib/branches/store";
import { PartnersAdmin } from "./_components/partners-admin";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const { branches } = await readBranches();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Partner Delivery</p>
        <h2 className="text-2xl font-semibold mt-1">Partner Portal Bridge</h2>
        <p className="text-sm text-muted mt-1">
          Prepare the PDF/PPTX handoff, slide visuals, portal sections, and client download surface for property partners.
        </p>
      </div>

      <PartnersAdmin branches={branches} />
    </div>
  );
}
