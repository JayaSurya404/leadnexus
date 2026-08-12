import {
  Link2,
  Plus,
} from "lucide-react";

import {
  createTrackingLinkAction,
} from "@/actions/links/create-tracking-link";

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

import type {
  TrackingLinkProduct,
} from "@/types/tracking-links";

type CreateTrackingLinkFormProps = {
  products:
    TrackingLinkProduct[];
};

export function CreateTrackingLinkForm({
  products,
}: CreateTrackingLinkFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          Create tracking link
        </CardTitle>

        <CardDescription>
          Create a shareable LeadNexus
          link for a campaign, social
          profile, advertisement or QR
          code.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={
            createTrackingLinkAction
          }
          className="grid gap-5 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="name">
              Link name
            </Label>

            <Input
              id="name"
              name="name"
              placeholder="Instagram Bio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">
              Source
            </Label>

            <Input
              id="source"
              name="source"
              placeholder="instagram"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium">
              Medium
            </Label>

            <Input
              id="medium"
              name="medium"
              placeholder="social"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign">
              Campaign
            </Label>

            <Input
              id="campaign"
              name="campaign"
              placeholder="summer-launch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Content
            </Label>

            <Input
              id="content"
              name="content"
              placeholder="bio-button"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">
              Term
            </Label>

            <Input
              id="term"
              name="term"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="productId">
              Product / service
            </Label>

            <select
              id="productId"
              name="productId"
              defaultValue=""
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">
                General business page
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {
                      product.name
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">
              <Plus className="size-4" />
              Create tracking link
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}