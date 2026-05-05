"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { SkuBarcode } from "@/components/ui/sku-barcode";
import {
  ItemInputSchema,
  type ItemInput,
  type ItemInputRaw,
  type MenuItem,
  type MenuCategory,
  BADGE_META,
  type Badge as BadgeKey,
} from "@/lib/menu/schema";
import {
  createItem,
  updateItem,
  uploadItemImage,
} from "@/lib/menu/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BADGE_KEYS = Object.keys(BADGE_META) as BadgeKey[];

export function ItemForm({
  existing,
  categories,
  defaultCategoryId,
}: {
  existing?: MenuItem;
  categories: MenuCategory[];
  defaultCategoryId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemInputRaw, unknown, ItemInput>({
    resolver: zodResolver(ItemInputSchema),
    defaultValues: existing
      ? {
          categoryId: existing.categoryId,
          nameEn: existing.nameEn,
          descriptionEn: existing.descriptionEn,
          priceEgp: existing.priceEgp,
          imageUrl: existing.imageUrl,
          badges: existing.badges,
          available: existing.available,
          sort: existing.sort,
        }
      : {
          categoryId: defaultCategoryId || categories[0]?.id || "",
          nameEn: "",
          descriptionEn: "",
          priceEgp: 0,
          imageUrl: "",
          badges: [],
          available: true,
          sort: 0,
        },
  });

  const imageUrl = watch("imageUrl");

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadItemImage(fd);
      setValue("imageUrl", url, { shouldDirty: true });
      toast.success("Image uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: ItemInput) =>
    start(async () => {
      try {
        if (existing) {
          await updateItem(existing.id, data);
          toast.success("Item updated");
        } else {
          await createItem(data);
          toast.success("Item created");
        }
        router.push("/menu");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardBody className="space-y-5">
          {/* Category */}
          <div>
            <Label required>Category</Label>
            <select
              {...register("categoryId")}
              className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
            <FieldError>{errors.categoryId?.message}</FieldError>
          </div>

          {/* Name */}
          <div>
            <Label required>Name</Label>
            <Input {...register("nameEn")} placeholder="e.g. Grape Leaf Rolls" />
            <FieldError>{errors.nameEn?.message}</FieldError>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              {...register("descriptionEn")}
              placeholder="Short and appetizing - what makes this dish great."
            />
          </div>

          {/* Price + sort */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label required hint="EGP">
                Price
              </Label>
              <Input type="number" step="0.01" min="0" {...register("priceEgp")} />
              <FieldError>{errors.priceEgp?.message}</FieldError>
            </div>
            <div>
              <Label hint="display order">Sort</Label>
              <Input type="number" {...register("sort")} />
            </div>
            <div>
              <Label>Availability</Label>
              <label className="inline-flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  {...register("available")}
                  className="size-4 accent-brand-green"
                />
                <span className="text-sm">Available</span>
              </label>
            </div>
          </div>

          {/* Badges */}
          <div>
            <Label hint="optional">Badges</Label>
            <Controller
              control={control}
              name="badges"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {BADGE_KEYS.map((b) => {
                    const checked = field.value?.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() =>
                          field.onChange(
                            checked
                              ? field.value.filter((x) => x !== b)
                              : [...(field.value || []), b]
                          )
                        }
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-full border transition-colors",
                          checked
                            ? "bg-brand-green text-white border-brand-green"
                            : "bg-white border-border-strong hover:border-brand-green/50"
                        )}
                      >
                        <span className="mr-1">{BADGE_META[b].emoji}</span>
                        {BADGE_META[b].label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Image */}
          <div>
            <Label hint="up to 5MB · jpg/png/webp">Photo</Label>
            <div className="flex items-start gap-4">
              <div className="size-32 rounded-md border border-border-strong bg-surface overflow-hidden flex items-center justify-center text-xs text-muted shrink-0">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  "no image"
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-3 h-10 text-sm rounded-md border border-border-strong bg-white hover:bg-surface cursor-pointer">
                  <Upload className="size-4" />
                  {uploading ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setValue("imageUrl", "", { shouldDirty: true })}
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-red ml-2"
                  >
                    <X className="size-3" /> remove
                  </button>
                )}
                <Input
                  {...register("imageUrl")}
                  placeholder="…or paste image URL"
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* SKU + Barcode (read-only) — shown for existing items */}
      {existing?.sku && (
        <Card>
          <CardBody className="space-y-3">
            <div>
              <Label>SKU / Barcode</Label>
              <p className="text-xs text-muted mb-3">
                Auto-generated tracking code. Use this to track the item in the kiosk, POS, or ordering app.
              </p>
              <SkuBarcode sku={existing.sku} itemName={existing.nameEn} variant="full" />
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/menu")}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : existing ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  );
}
