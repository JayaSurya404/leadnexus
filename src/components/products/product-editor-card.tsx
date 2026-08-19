import {
  Save,
  Trash2,
} from "lucide-react";

import {
  deleteProductAction,
} from "@/actions/products/delete-product";

import {
  updateProductAction,
} from "@/actions/products/update-product";

import {
  ProductImageUpload,
} from "@/components/products/product-image-upload";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

type ProductItem = {
  id: string;

  itemType:
    | "PRODUCT"
    | "SERVICE";

  name: string;

  description:
    | string
    | null;

  priceText:
    | string
    | null;

  active: boolean;
  featured: boolean;
  sortOrder: number;

  imageUrl:
    | string
    | null;
};

type ProductEditorCardProps = {
  businessId: string;
  product: ProductItem;
};

export function ProductEditorCard({
  businessId,
  product,
}: ProductEditorCardProps) {
  const updateAction =
    updateProductAction.bind(
      null,
      product.id,
    );

  const deleteAction =
    deleteProductAction.bind(
      null,
      product.id,
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {product.name}
          </CardTitle>

          <div className="flex gap-2">
            <Badge variant="outline">
              {
                product.itemType
              }
            </Badge>

            {product.featured ? (
              <Badge>
                Featured
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <ProductImageUpload
          businessId={
            businessId
          }
          productId={
            product.id
          }
          currentUrl={
            product.imageUrl
          }
        />

        <div className="space-y-5">
          <form
            action={
              updateAction
            }
            className="grid gap-5 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label>
                Type
              </Label>

              <select
                name="itemType"
                defaultValue={
                  product.itemType
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="PRODUCT">
                  Product
                </option>

                <option value="SERVICE">
                  Service
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>
                Name
              </Label>

              <Input
                name="name"
                defaultValue={
                  product.name
                }
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>
                Description
              </Label>

              <Textarea
                name="description"
                rows={4}
                defaultValue={
                  product.description ??
                  ""
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Price text
              </Label>

              <Input
                name="priceText"
                defaultValue={
                  product.priceText ??
                  ""
                }
              />
            </div>


            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="active"
                defaultChecked={
                  product.active
                }
                className="size-4 accent-primary"
              />

              Active
            </label>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={
                  product.featured
                }
                className="size-4 accent-primary"
              />

              Featured
            </label>

            <div className="sm:col-span-2">
              <Button type="submit">
                <Save className="size-4" />
                Save item
              </Button>
            </div>
          </form>

          <div className="border-t pt-4">
            <form
              action={
                deleteAction
              }
            >
              <Button
                type="submit"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete item
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}