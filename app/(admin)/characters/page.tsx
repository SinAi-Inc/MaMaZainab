import { Users, Image, FileText } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

type Character = {
  name: string;
  nameAr: string;
  role: string;
  visibility: string;
  status: "final" | "wip" | "concept";
};

const CAST: Character[] = [
  {
    name: "Mama Zainab",
    nameAr: "ماما زينب",
    role: "Brand face - village matriarch & master cook",
    visibility: "Always-on (logo, packaging, kiosks, ads, app)",
    status: "final",
  },
  {
    name: "ZuZu",
    nameAr: "زوزو",
    role: "Mascot - the white goose sidekick",
    visibility: "High (mascot, kids menu, social, ribbon icon)",
    status: "final",
  },
  {
    name: "Shang Hong Wong",
    nameAr: "盛恒王",
    role: "Founder lore - silent investor / \"the Banker\"",
    visibility: "Low - campaign/legend only, never on packaging",
    status: "concept",
  },
  {
    name: "Ghost of Zainab",
    nameAr: "شبح زينب",
    role: "Mystical comic element",
    visibility: "Video only (Scene 4 sabotage, Scene 6 epilogue)",
    status: "wip",
  },
];

export default function CharactersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Character Bible
        </p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <Users className="size-5 text-brand-green-deep" />
          Characters
        </h2>
        <p className="text-sm text-muted mt-1">
          Canonical reference for every render, illustration, animation,
          lip-sync, voice, costume, and merch decision involving the cast.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CAST.map((char) => (
          <Card key={char.name}>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="size-20 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                  <Image className="size-10 text-brand-green opacity-40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{char.name}</h3>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        char.status === "final"
                          ? "bg-brand-green/15 text-brand-green-deep"
                          : char.status === "wip"
                            ? "bg-brand-yellow/20 text-brand-ink"
                            : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {char.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 font-arabic">
                    {char.nameAr}
                  </p>
                  <p className="text-sm mt-2 text-zinc-700">{char.role}</p>
                  <p className="text-xs text-muted mt-2">
                    <span className="font-medium">Visibility:</span>{" "}
                    {char.visibility}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <FileText className="size-5 text-brand-green-deep flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">Full Character Bible</h3>
              <p className="text-sm text-muted mt-1">
                Detailed anchor blocks, identity cards, voice rules, and do/don't
                guidelines are available in{" "}
                <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                  02_Characters/CHARACTERS.md
                </code>
              </p>
              <p className="text-xs text-muted mt-2">
                <strong>Coming soon:</strong> Character asset library, AI prompt
                generator, voice samples, costume references
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
