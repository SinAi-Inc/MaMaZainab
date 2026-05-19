import { readContacts } from "@/lib/contacts/store";
import { DeleteContactButton } from "./_components/delete-button";
import { Mail, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ContactsPage() {
  const state = await readContacts();
  const contacts = [...state.contacts].sort(
    (a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-brand-ink">Contact List</h1>
          <p className="text-sm text-muted mt-1">
            Email addresses collected from the Coming Soon notify form.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-brand-ink text-white px-4 py-2 rounded-lg text-sm font-semibold">
          <Users className="size-4" />
          {contacts.length} subscriber{contacts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 border-2 border-dashed border-border rounded-xl text-muted">
          <Mail className="size-10 opacity-30" />
          <p className="text-sm">No contacts yet — submissions from the Coming Soon page will appear here.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-brand-ink w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-ink">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-ink">Source</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-ink">Subscribed</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3 text-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    <a
                      href={`mailto:${c.email}`}
                      className="hover:text-brand-green transition-colors"
                    >
                      {c.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-yellow/20 text-brand-ink uppercase tracking-wide">
                      {c.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted tabular-nums">{formatDate(c.subscribedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteContactButton id={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export hint */}
      {contacts.length > 0 && (
        <p className="text-xs text-muted text-right">
          Raw data at <code className="bg-neutral-100 px-1 rounded">data/contacts.json</code>
        </p>
      )}
    </div>
  );
}
