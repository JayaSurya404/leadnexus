import {
  Plus,
} from "lucide-react";

import {
  createProductAction,
} from "@/actions/products/create-product";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
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

export function CreateProductForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Add product or service
        </CardTitle>

        <CardDescription>
          Create the item first, then
          upload its image from the item
          card below.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={
            createProductAction
          }
          className="grid gap-5 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="create-itemType">
              Type
            </Label>

            <select
              id="create-itemType"
              name="itemType"
              defaultValue="PRODUCT"
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
            <Label htmlFor="create-name">
              Name
            </Label>

            <Input
              id="create-name"
              name="name"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="create-description">
              Description
            </Label>

            <Textarea
              id="create-description"
              name="description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-priceText">
              Price text
            </Label>

            <Input
              id="create-priceText"
              name="priceText"
              placeholder="Starting from ₹..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-sortOrder">
              Display order
            </Label>

            <Input
              id="create-sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="size-4 accent-primary"
            />

            Active
          </label>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="featured"
              className="size-4 accent-primary"
            />

            Featured
          </label>

          <div className="sm:col-span-2">
            <Button type="submit">
              <Plus className="size-4" />
              Create item
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}