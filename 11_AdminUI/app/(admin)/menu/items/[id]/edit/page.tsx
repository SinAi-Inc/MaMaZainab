import { notFound } from "next/navigation";
import { readMenu } from "@/lib/menu/store";
import { ItemForm } from "../../../_components/item-form";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await readMenu();
  const item = state.items.find((i) => i.id === id);
  if (!item) notFound();
  return <ItemForm existing={item} categories={state.categories} />;
}
