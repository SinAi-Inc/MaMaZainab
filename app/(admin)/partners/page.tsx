import { readBranches } from "@/lib/branches/store";
import { PartnersAdmin } from "./_components/partners-admin";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const { branches } = await readBranches();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Business</p>
        <h2 className="text-2xl font-semibold mt-1">Investors &amp; Partners</h2>
        <p className="text-sm text-muted mt-1">
          Manage the partner portal shown to mall and landmark partners who will host MaMa Zainab kiosks.
        </p>
      </div>

      <PartnersAdmin branches={branches} />
    </div>
  );
}
