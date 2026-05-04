import { readMenu } from "@/lib/menu/store";
import { ItemForm } from "../../_components/item-form";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;
  const state = await readMenu();
  return (
    <ItemForm
      categories={state.categories}
      defaultCategoryId={categoryId}
    />
  );
}
