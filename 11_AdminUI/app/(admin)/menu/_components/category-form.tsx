"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CategoryInputSchema,
  type CategoryInput,
  type CategoryInputRaw,
  type MenuCategory,
} from "@/lib/menu/schema";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/menu/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { useState } from "react";

export function CategoryForm({ existing }: { existing?: MenuCategory }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryInputRaw, unknown, CategoryInput>({
    resolver: zodResolver(CategoryInputSchema),
    defaultValues: existing
      ? {
          nameEn: existing.nameEn,
          descriptionEn: existing.descriptionEn,
          sort: existing.sort,
          visible: existing.visible,
        }
      : { visible: true, sort: 0, descriptionEn: "" },
  });

  const onSubmit = (data: CategoryInput) =>
    start(async () => {
      try {
        if (existing) {
          await updateCategory(existing.id, data);
          toast.success("Category updated");
        } else {
          await createCategory(data);
          toast.success("Category created");
        }
        router.push("/menu");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <div>
            <Label required>Name</Label>
            <Input {...register("nameEn")} placeholder="e.g. Stuffy Fingers" />
            <FieldError>{errors.nameEn?.message}</FieldError>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              {...register("descriptionEn")}
              placeholder="Optional short description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label hint="display order">Sort</Label>
              <Input type="number" {...register("sort")} />
            </div>
            <div>
              <Label>Visibility</Label>
              <label className="inline-flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  {...register("visible")}
                  className="size-4 accent-brand-green"
                />
                <span className="text-sm">Visible on menu</span>
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {existing &&
            (confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      try {
                        await deleteCategory(existing.id);
                        toast.success("Category deleted");
                        router.push("/menu");
                        router.refresh();
                      } catch (e: unknown) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    })
                  }
                >
                  Confirm delete (and all items)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
              >
                Delete category
              </Button>
            ))}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/menu")}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : existing ? "Save changes" : "Create category"}
          </Button>
        </div>
      </div>
    </form>
  );
}
