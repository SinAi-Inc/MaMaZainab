/**
 * Edit Decision List (EDL) and Final Cut Pro XML exporter.
 *
 * Given a Story Project, walks its scenes → shots in order, picks each shot's
 * approved take, and produces a timeline file you can import into DaVinci
 * Resolve, Premiere Pro, or Final Cut Pro.
 *
 * Two output formats:
 *   - CMX 3600 EDL (.edl) — universal, no nesting
 *   - Final Cut Pro XML v1.10 (.fcpxml) — preserves clip names + URLs
 */
import type { Project, Scene, Shot, Take } from "@/lib/videos/schema";

export type TimelineClip = {
  shotId: string;
  shotNumber: string;
  takeId: string;
  videoUrl: string;
  durationSec: number;
  description: string;
};

export type ProjectTimeline = {
  project: Project;
  clips: TimelineClip[];
  totalSec: number;
  missing: { shotId: string; shotNumber: string; reason: string }[];
};

/**
 * Walk project shots in scene/sort order, pulling each approved take.
 * Returns clips + a list of shots that have no approved take.
 */
export function buildProjectTimeline(
  project: Project,
  scenes: Scene[],
  shots: Shot[],
  takes: Take[],
): ProjectTimeline {
  const projectScenes = scenes
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => a.sort - b.sort || a.number - b.number);

  const clips: TimelineClip[] = [];
  const missing: { shotId: string; shotNumber: string; reason: string }[] = [];

  for (const scene of projectScenes) {
    const sceneShots = shots
      .filter((s) => s.sceneId === scene.id)
      .sort((a, b) => a.sort - b.sort);
    for (const shot of sceneShots) {
      const take = shot.approvedTakeId
        ? takes.find((t) => t.id === shot.approvedTakeId)
        : undefined;
      if (!take || !take.videoUrl) {
        missing.push({
          shotId: shot.id,
          shotNumber: shot.number,
          reason: !take ? "no approved take" : "approved take has no video URL",
        });
        continue;
      }
      clips.push({
        shotId: shot.id,
        shotNumber: shot.number,
        takeId: take.id,
        videoUrl: take.videoUrl,
        durationSec: take.durationSec || shot.durationSec || 5,
        description: shot.description,
      });
    }
  }

  return {
    project,
    clips,
    totalSec: clips.reduce((a, c) => a + c.durationSec, 0),
    missing,
  };
}

/* ------------------- CMX 3600 EDL exporter ------------------- */

function secondsToTimecode(seconds: number, fps = 24): string {
  const total = Math.round(seconds * fps);
  const f = total % fps;
  const totalSec = Math.floor(total / fps);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/** Generate a CMX 3600 EDL string. fps must match your edit timeline. */
export function exportEdl(timeline: ProjectTimeline, fps = 24): string {
  const lines: string[] = [];
  const safeTitle = timeline.project.title.replace(/[^\w\s-]/g, "").slice(0, 60);
  lines.push(`TITLE: ${safeTitle}`);
  lines.push(`FCM: NON-DROP FRAME`);
  lines.push("");

  let recordIn = 0;
  let i = 1;
  for (const clip of timeline.clips) {
    const srcIn = secondsToTimecode(0, fps);
    const srcOut = secondsToTimecode(clip.durationSec, fps);
    const recIn = secondsToTimecode(recordIn, fps);
    const recOut = secondsToTimecode(recordIn + clip.durationSec, fps);
    const num = String(i).padStart(3, "0");
    const reel = `CLIP${num}`;
    lines.push(`${num}  ${reel}  V  C  ${srcIn} ${srcOut} ${recIn} ${recOut}`);
    lines.push(`* FROM CLIP NAME: Shot ${clip.shotNumber} — ${clip.description.slice(0, 60)}`);
    lines.push(`* SOURCE FILE: ${clip.videoUrl}`);
    lines.push("");
    recordIn += clip.durationSec;
    i += 1;
  }
  return lines.join("\n");
}

/* ------------------- Final Cut Pro XML exporter -------------- */

function fcpDuration(seconds: number, fps = 24): string {
  const frames = Math.round(seconds * fps);
  return `${frames * 100}/${fps * 100}s`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportFcpxml(timeline: ProjectTimeline, fps = 24): string {
  const safeTitle = escapeXml(timeline.project.title);
  const assets = timeline.clips
    .map(
      (c, i) =>
        `      <asset id="asset${i + 1}" name="Shot ${escapeXml(c.shotNumber)}" src="${escapeXml(c.videoUrl)}" hasVideo="1" format="r1" duration="${fcpDuration(c.durationSec, fps)}"/>`,
    )
    .join("\n");

  let offset = 0;
  const clipXml = timeline.clips
    .map((c, i) => {
      const dur = fcpDuration(c.durationSec, fps);
      const off = fcpDuration(offset, fps);
      offset += c.durationSec;
      return `        <asset-clip ref="asset${i + 1}" name="${escapeXml(c.description.slice(0, 60))}" duration="${dur}" offset="${off}" start="0s"/>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat${fps === 24 ? "1080p24" : "1080p30"}" frameDuration="100/${fps * 100}s" width="1920" height="1080"/>
${assets}
  </resources>
  <library>
    <event name="MaMa Zainab — ${safeTitle}">
      <project name="${safeTitle}">
        <sequence format="r1" duration="${fcpDuration(timeline.totalSec, fps)}" tcStart="0s">
          <spine>
${clipXml}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}
