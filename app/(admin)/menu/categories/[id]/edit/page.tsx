import { notFound } from "next/navigation";
import { readMenu } from "@/lib/menu/store";
import { CategoryForm } from "../../../_components/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await readMenu();
  const cat = state.categories.find((c) => c.id === id);
  if (!cat) notFound();
  return <CategoryForm existing={cat} />;
}
