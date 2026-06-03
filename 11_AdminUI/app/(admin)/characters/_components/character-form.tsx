"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  Upload,
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  CharacterVisibilitySchema,
  VISIBILITY_META,
  type Character,
  type CharacterVisibility,
} from "@/lib/characters/schema";
import {
  createCharacter,
  updateCharacter,
  uploadCharacterImage,
} from "@/lib/characters/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ---- Form-level schema (dos/donts as newline-joined strings) -- */

const FormSchema = z.object({
  name:            z.string().min(1, "Required"),
  subtitle:        z.string(),
  role:            z.string(),
  visibility:      CharacterVisibilitySchema,
  anchorBlock:     z.string(),
  referenceImages: z.array(z.object({ url: z.string().min(1, "URL required"), label: z.string(), isPrimary: z.boolean() })),
  identityFields:  z.array(z.object({ field: z.string().min(1, "Field name required"), value: z.string() })),
  modes:           z.array(z.object({ label: z.string().min(1, "Label required"), when: z.string(), costume: z.string(), posture: z.string(), referenceImage: z.string() })),
  voiceProvider:   z.string(),
  voiceId:         z.string(),
  voiceNotes:      z.string(),
  dosText:         z.string(),
  dontsText:       z.string(),
  surfaceUsage:    z.string(),
  active:          z.boolean(),
  sort:            z.number().int(),
});
type FormValues = z.infer<typeof FormSchema>;

const VISIBILITIES = CharacterVisibilitySchema.options as CharacterVisibility[];

/* ---- Section wrapper ---------------------------------------- */

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-sm">{title}</span>
        {open ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
      </button>
      {open && <CardBody className="space-y-4 pt-2">{children}</CardBody>}
    </Card>
  );
}

/* ---- Component --------------------------------------------- */

export function CharacterForm({ existing }: { existing?: Character }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: existing
      ? {
          name:            existing.name,
          subtitle:        existing.subtitle,
          role:            existing.role,
          visibility:      existing.visibility,
          anchorBlock:     existing.anchorBlock,
          referenceImages: existing.referenceImages,
          identityFields:  existing.identityFields,
          modes:           existing.modes.map((m) => ({ ...m, referenceImage: m.referenceImage ?? "" })),
          voiceProvider:   existing.voiceProvider,
          voiceId:         existing.voiceId,
          voiceNotes:      existing.voiceNotes,
          dosText:         existing.dos.join("\n"),
          dontsText:       existing.donts.join("\n"),
          surfaceUsage:    existing.surfaceUsage,
          active:          existing.active,
          sort:            existing.sort,
        }
      : {
          name: "", subtitle: "", role: "",
          visibility: "high" as CharacterVisibility,
          anchorBlock: "", referenceImages: [],
          identityFields: [], modes: [],
          voiceProvider: "elevenlabs", voiceId: "", voiceNotes: "",
          dosText: "", dontsText: "", surfaceUsage: "",
          active: true, sort: 0,
        },
  });

  const refs   = useFieldArray({ control, name: "referenceImages" });
  const idFlds = useFieldArray({ control, name: "identityFields" });
  const modes  = useFieldArray({ control, name: "modes" });

  const onSubmit = (values: FormValues) =>
    start(async () => {
      try {
        const payload = {
          name:            values.name,
          subtitle:        values.subtitle,
          role:            values.role,
          visibility:      values.visibility,
          anchorBlock:     values.anchorBlock,
          referenceImages: values.referenceImages,
          identityFields:  values.identityFields,
          modes:           values.modes,
          voiceProvider:   values.voiceProvider,
          voiceId:         values.voiceId,
          voiceNotes:      values.voiceNotes,
          dos:   values.dosText.split("\n").map((s) => s.trim()).filter(Boolean),
          donts: values.dontsText.split("\n").map((s) => s.trim()).filter(Boolean),
          surfaceUsage: values.surfaceUsage,
          active: values.active,
          sort:   values.sort,
        };
        if (existing) {
          await updateCharacter(existing.id, payload);
          toast.success("Character updated");
        } else {
          await createCharacter(payload);
          toast.success("Character created");
        }
        router.push("/characters");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadCharacterImage(fd);
      refs.append({ url, label: file.name.replace(/\.[^.]+$/, ""), isPrimary: refs.fields.length === 0 });
      toast.success("Image uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const anchorBlock = watch("anchorBlock");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-5">
      {/* ---- Identity ---------------------------------------- */}
      <Section title="Identity">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label required>Name</Label>
            <Input {...register("name")} placeholder="e.g. MaMa Zainab" />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label hint="the heart">Subtitle</Label>
            <Input {...register("subtitle")} placeholder="the heart" />
          </div>
          <div>
            <Label>Visibility</Label>
            <Controller
              control={control}
              name="visibility"
              render={({ field }) => (
                <select
                  {...field}
                  className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm focus:border-brand-green focus:outline-none"
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v} value={v}>{VISIBILITY_META[v].label}</option>
                  ))}
                </select>
              )}
            />
          </div>
          <div className="col-span-2">
            <Label>Role description</Label>
            <Input {...register("role")} placeholder="Brand face - village matriarch & master cook" />
          </div>
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="active"
                  checked={field.value}
                  onChange={field.onChange}
                  className="size-4 rounded border-border-strong text-brand-green focus:ring-brand-green"
                />
              )}
            />
            <label htmlFor="active" className="text-sm font-medium">Active</label>
          </div>
          <div>
            <Label hint="display order">Sort</Label>
            <Input type="number" {...register("sort", { valueAsNumber: true })} className="w-24" />
          </div>
        </div>
      </Section>

      {/* ---- AI Anchor Block ---------------------------------- */}
      <Section title="AI Anchor Block">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label hint="paste into every AI prompt that includes this character">Anchor Block</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { navigator.clipboard.writeText(anchorBlock); toast.success("Copied!"); }}
            >
              <Copy className="size-3.5 mr-1" /> Copy
            </Button>
          </div>
          <Textarea
            {...register("anchorBlock")}
            rows={7}
            className="font-mono text-xs"
            placeholder="Egyptian woman in her late 50s, warm kind face..."
          />
          <p className="mt-1.5 text-[11px] text-muted">
            This block is the canonical prompt fragment for AI image/video generation. Keep it concise and precise.
          </p>
        </div>
      </Section>

      {/* ---- Reference Images --------------------------------- */}
      <Section title="Reference Images">
        <div className="space-y-3">
          {refs.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start">
              {/* Thumbnail */}
              <div className="size-14 rounded border bg-zinc-50 overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {watch(`referenceImages.${i}.url`) ? (
                  <img src={watch(`referenceImages.${i}.url`)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[10px]">?</div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  {...register(`referenceImages.${i}.url`)}
                  placeholder="/brand/chars/mama-zainab.jpeg"
                  className="text-xs"
                />
                <FieldError>{errors.referenceImages?.[i]?.url?.message}</FieldError>
                <Input
                  {...register(`referenceImages.${i}.label`)}
                  placeholder="Label (optional)"
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <Controller
                  control={control}
                  name={`referenceImages.${i}.isPrimary`}
                  render={({ field: f }) => (
                    <button
                      type="button"
                      title={f.value ? "Primary" : "Set as primary"}
                      onClick={() => {
                        refs.fields.forEach((_, j) => {
                          if (j !== i) {
                            // unset others - handled by update below
                          }
                        });
                        refs.update(i, { ...refs.fields[i], ...{ url: watch(`referenceImages.${i}.url`), label: watch(`referenceImages.${i}.label`), isPrimary: true } });
                        refs.fields.forEach((_, j) => {
                          if (j !== i) refs.update(j, { ...refs.fields[j], url: watch(`referenceImages.${j}.url`), label: watch(`referenceImages.${j}.label`), isPrimary: false });
                        });
                      }}
                      className={cn("p-1 rounded", f.value ? "text-brand-yellow" : "text-zinc-300 hover:text-zinc-500")}
                    >
                      {f.value ? <Star className="size-4 fill-current" /> : <StarOff className="size-4" />}
                    </button>
                  )}
                />
                <button
                  type="button"
                  onClick={() => refs.remove(i)}
                  className="p-1 text-zinc-400 hover:text-brand-red rounded"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refs.append({ url: "", label: "", isPrimary: refs.fields.length === 0 })}
            >
              <Plus className="size-3.5 mr-1" /> Add URL
            </Button>
            <label className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border cursor-pointer hover:bg-zinc-50 transition-colors", uploading && "opacity-50 pointer-events-none")}>
              <Upload className="size-3.5" /> {uploading ? "Uploading…" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
              />
            </label>
          </div>
        </div>
      </Section>

      {/* ---- Identity Card ------------------------------------ */}
      <Section title="Identity Card" defaultOpen={false}>
        <p className="text-xs text-muted -mt-2">Key/value fields that define the character's physical attributes.</p>
        <div className="space-y-2">
          {idFlds.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start">
              <Input
                {...register(`identityFields.${i}.field`)}
                placeholder="Field (e.g. Age)"
                className="w-36 text-sm"
              />
              <Input
                {...register(`identityFields.${i}.value`)}
                placeholder="Value"
                className="flex-1 text-sm"
              />
              <button type="button" onClick={() => idFlds.remove(i)} className="p-2 text-zinc-400 hover:text-brand-red">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => idFlds.append({ field: "", value: "" })}>
          <Plus className="size-3.5 mr-1" /> Add Field
        </Button>
      </Section>

      {/* ---- Appearance Modes --------------------------------- */}
      <Section title="Appearance Modes" defaultOpen={false}>
        <p className="text-xs text-muted -mt-2">For characters with multiple costumes / contexts (e.g. Warrior / Banker).</p>
        <div className="space-y-4">
          {modes.fields.map((field, i) => (
            <div key={field.id} className="border border-border rounded-lg p-3 space-y-2 relative">
              <button type="button" onClick={() => modes.remove(i)} className="absolute top-2 right-2 text-zinc-400 hover:text-brand-red p-1">
                <Trash2 className="size-3.5" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Mode label</Label>
                  <Input {...register(`modes.${i}.label`)} placeholder="Warrior" />
                  <FieldError>{errors.modes?.[i]?.label?.message}</FieldError>
                </div>
                <div>
                  <Label>When</Label>
                  <Input {...register(`modes.${i}.when`)} placeholder="Scenes 1, 2" />
                </div>
              </div>
              <div>
                <Label>Costume</Label>
                <Input {...register(`modes.${i}.costume`)} placeholder="Dark silken warrior robes, no logos" />
              </div>
              <div>
                <Label>Posture</Label>
                <Input {...register(`modes.${i}.posture`)} placeholder="Coiled stillness" />
              </div>
              <div>
                <Label>Reference Image</Label>
                <Input {...register(`modes.${i}.referenceImage`)} placeholder="/uploads/chars/abc.jpg" />
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => modes.append({ label: "", when: "", costume: "", posture: "", referenceImage: "" })}>
          <Plus className="size-3.5 mr-1" /> Add Mode
        </Button>
      </Section>

      {/* ---- Voice ------------------------------------------- */}
      <Section title="Voice" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label hint="elevenlabs / openai / none">Provider</Label>
            <Input {...register("voiceProvider")} placeholder="elevenlabs" />
          </div>
          <div>
            <Label hint="ElevenLabs voice ID">Voice ID</Label>
            <Input {...register("voiceId")} placeholder="21m00Tcm4TlvDq8ikWAM" />
          </div>
          <div className="col-span-2">
            <Label>Voice notes</Label>
            <Textarea {...register("voiceNotes")} rows={3} placeholder="ElevenLabs v3 - warm 50s Egyptian woman, low chest voice, slight rasp." />
          </div>
        </div>
      </Section>

      {/* ---- Do / Don't -------------------------------------- */}
      <Section title="Do / Don't Rules" defaultOpen={false}>
        <p className="text-xs text-muted -mt-2">One rule per line.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>✅ Do</Label>
            <Textarea
              {...register("dosText")}
              rows={7}
              className="text-sm"
              placeholder={"Show her cooking, plating, teaching\nUse natural sunlight"}
            />
          </div>
          <div>
            <Label>❌ Don&apos;t</Label>
            <Textarea
              {...register("dontsText")}
              rows={7}
              className="text-sm"
              placeholder={"Show her in modern fashion\nUse neon lighting"}
            />
          </div>
        </div>
      </Section>

      {/* ---- Surface Usage ----------------------------------- */}
      <Section title="Surface Usage" defaultOpen={false}>
        <Textarea
          {...register("surfaceUsage")}
          rows={3}
          placeholder="Logo lockups · packaging hero panel · kiosk poster · website hero · ..."
        />
      </Section>

      {/* ---- Submit ------------------------------------------ */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? "Saving…" : existing ? "Save Changes" : "Create Character"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
