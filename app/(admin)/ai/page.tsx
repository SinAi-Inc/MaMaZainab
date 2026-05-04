import { Sparkles, Wand2, Image, Type, Palette } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

type AITool = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "planned" | "wip" | "ready";
  category: "content" | "design" | "media";
};

const TOOLS: AITool[] = [
  {
    name: "Character Prompt Generator",
    description:
      "Generate AI prompts with locked anchor blocks for Mama Zainab, ZuZu, Wong, and Ghost characters",
    icon: Type,
    status: "planned",
    category: "content",
  },
  {
    name: "Brand-Compliant Image Generator",
    description:
      "Create renders, illustrations, and packaging mockups using brand color palette and plaid patterns",
    icon: Image,
    status: "planned",
    category: "media",
  },
  {
    name: "Plaid Pattern Customizer",
    description:
      "Generate custom plaid variants for different surfaces (apron, packaging, awning, web) with live preview",
    icon: Palette,
    status: "wip",
    category: "design",
  },
  {
    name: "Logo Lockup Generator",
    description:
      "Create logo lockups in various configurations (wordmark + mark, Arabic, Chinese) with proper spacing",
    icon: Wand2,
    status: "planned",
    category: "design",
  },
  {
    name: "Social Media Asset Generator",
    description:
      "Generate Instagram stories, posts, and TikTok thumbnails with brand consistency",
    icon: Sparkles,
    status: "planned",
    category: "media",
  },
  {
    name: "Menu Item Renderer",
    description:
      "Create photorealistic food renders of mahshi items with consistent lighting and plating",
    icon: Image,
    status: "planned",
    category: "media",
  },
];

function ToolCard({ tool }: { tool: AITool }) {
  const statusColors = {
    planned: "bg-zinc-200 text-zinc-600",
    wip: "bg-brand-yellow/20 text-brand-ink",
    ready: "bg-brand-green/15 text-brand-green-deep",
  };

  const Icon = tool.icon;

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            <Icon className="size-6 text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{tool.name}</h3>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[tool.status]}`}
              >
                {tool.status}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">{tool.description}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AIGeneratorsPage() {
  const contentTools = TOOLS.filter((t) => t.category === "content");
  const designTools = TOOLS.filter((t) => t.category === "design");
  const mediaTools = TOOLS.filter((t) => t.category === "media");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          AI-Powered Tools
        </p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <Sparkles className="size-5 text-brand-green-deep" />
          AI Generators
        </h2>
        <p className="text-sm text-muted mt-1">
          Brand-compliant AI tools for generating content, designs, and media
          assets. All outputs conform to the canonical brand system.
        </p>
      </div>

      {/* Content Tools */}
      {contentTools.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Content
          </h3>
          <div className="space-y-3">
            {contentTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Design Tools */}
      {designTools.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Design
          </h3>
          <div className="space-y-3">
            {designTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Media Tools */}
      {mediaTools.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Media
          </h3>
          <div className="space-y-3">
            {mediaTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardBody>
          <div className="text-center py-6">
            <Sparkles className="size-10 text-brand-green/30 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">
              AI Toolkit Coming Soon
            </h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              These generators will be integrated with the admin UI to help HITL
              create brand-compliant assets faster. Integration with Azure
              OpenAI, DALL-E, and custom fine-tuned models planned.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
