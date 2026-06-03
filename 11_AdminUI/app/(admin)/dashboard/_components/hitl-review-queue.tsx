"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Video,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { approveTake, setTakeStatus } from "@/lib/videos/actions";
import { MODEL_META } from "@/lib/videos/schema";
import type { Take, Shot, Project } from "@/lib/videos/schema";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface ReadyTake {
  take: Take;
  shot: Shot;
  project: Project;
}

/* ------------------------------------------------------------------ */
/* Row                                                                  */
/* ------------------------------------------------------------------ */
function TakeRow({ item }: { item: ReadyTake }) {
  const router = useRouter();
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  const pending = approvePending || rejectPending;
  const modelMeta = MODEL_META[item.take.model as keyof typeof MODEL_META];

  function handleApprove() {
    startApprove(async () => {
      await approveTake(item.take.id);
      router.refresh();
    });
  }

  function handleReject() {
    startReject(async () => {
      await setTakeStatus(item.take.id, "failed");
      router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {/* Thumbnail / icon */}
      <div className="size-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
        {item.take.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.take.thumbnailUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <Video className="size-4 text-zinc-400" />
        )}
      </div>

      {/* Context */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-brand-ink leading-tight">
          {item.project.title}
          <span className="text-muted font-normal"> · Shot {item.shot.number || item.shot.id.slice(-4)}</span>
        </p>
        <p className="text-[11px] text-muted mt-0.5 truncate leading-snug">
          {item.shot.description || "No description"}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {modelMeta && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
              style={{ color: modelMeta.color, borderColor: `${modelMeta.color}40`, backgroundColor: `${modelMeta.color}10` }}
            >
              {modelMeta.label}
            </span>
          )}
          {item.take.videoUrl && (
            <a
              href={item.take.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-brand-green-deep transition-colors"
            >
              <ExternalLink className="size-2.5" /> Watch
            </a>
          )}
          <Link
            href={`/videos/${item.project.id}`}
            className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-brand-green-deep transition-colors"
          >
            <ExternalLink className="size-2.5" /> Project
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleApprove}
          disabled={pending}
          title="Approve take"
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            "bg-brand-green/10 text-brand-green-deep border border-brand-green/30",
            "hover:bg-brand-green hover:text-white disabled:opacity-50"
          )}
        >
          <CheckCircle2 className="size-3.5" />
          {approvePending ? "…" : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={pending}
          title="Reject take"
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            "bg-red-50 text-red-600 border border-red-200",
            "hover:bg-red-100 disabled:opacity-50"
          )}
        >
          <XCircle className="size-3.5" />
          {rejectPending ? "…" : "Reject"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */
export function HitlReviewQueue({ items }: { items: ReadyTake[] }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Inbox className="size-4 text-brand-green-deep" />
            Review Queue
            {items.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center size-5 rounded-full bg-brand-yellow text-brand-ink text-[10px] font-bold tabular-nums">
                {items.length}
              </span>
            )}
          </h3>
          <Link
            href="/videos"
            className="text-xs text-brand-green-deep hover:underline"
          >
            All projects →
          </Link>
        </div>
        <p className="text-xs text-muted mb-4">
          Takes registered and ready for your approval before entering the master cut.
        </p>

        {items.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-sm text-brand-green-deep">
            <CheckCircle2 className="size-4" />
            <span className="font-medium">All clear - no takes awaiting review.</span>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <TakeRow key={item.take.id} item={item} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
