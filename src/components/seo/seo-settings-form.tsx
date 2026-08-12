import {
  Globe2,
  Save,
  Search,
  Share2,
} from "lucide-react";

import {
  updateSeoSettingsAction,
} from "@/actions/seo/update-seo-settings";

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

import type {
  SeoSettings,
} from "@/types/seo";

type SeoSettingsFormProps = {
  settings:
    SeoSettings;

  businessName: string;

  publicUrl: string;
};

export function SeoSettingsForm({
  settings,
  businessName,
  publicUrl,
}: SeoSettingsFormProps) {
  return (
    <form
      action={
        updateSeoSettingsAction
      }
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Search appearance
          </CardTitle>

          <CardDescription>
            Control the title,
            description and keywords
            used for your public
            business page.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              SEO title
            </Label>

            <Input
              id="title"
              name="title"
              maxLength={70}
              defaultValue={
                settings.title ??
                ""
              }
              placeholder={`${businessName} | LeadNexus`}
            />

            <p className="text-xs text-muted-foreground">
              Maximum 70
              characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Meta description
            </Label>

            <Textarea
              id="description"
              name="description"
              maxLength={180}
              rows={4}
              defaultValue={
                settings.description ??
                ""
              }
              placeholder="Describe your business and what customers can find on this page."
            />

            <p className="text-xs text-muted-foreground">
              Maximum 180
              characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">
              Keywords
            </Label>

            <Input
              id="keywords"
              name="keywords"
              defaultValue={
                settings.keywords.join(
                  ", ",
                )
              }
              placeholder="software, automation, consulting"
            />

            <p className="text-xs text-muted-foreground">
              Separate keywords with
              commas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="size-5" />
            Indexing
          </CardTitle>

          <CardDescription>
            Control the canonical URL
            and whether the public page
            can be indexed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="canonicalUrl">
              Canonical URL
            </Label>

            <Input
              id="canonicalUrl"
              name="canonicalUrl"
              type="url"
              defaultValue={
                settings.canonicalUrl ??
                ""
              }
              placeholder={
                publicUrl
              }
            />

            <p className="text-xs text-muted-foreground">
              Leave blank to use{" "}
              <span className="font-mono">
                {publicUrl}
              </span>
              .
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              name="indexable"
              defaultChecked={
                settings.indexable
              }
              className="mt-1 size-4 accent-primary"
            />

            <span>
              <span className="block text-sm font-medium">
                Allow search engine
                indexing
              </span>

              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Disable this if you do
                not want the public
                business page included
                in LeadNexus sitemap
                results.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Social sharing
          </CardTitle>

          <CardDescription>
            Customize the title and
            description used by Open
            Graph compatible platforms.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ogTitle">
              Social title
            </Label>

            <Input
              id="ogTitle"
              name="ogTitle"
              maxLength={70}
              defaultValue={
                settings.ogTitle ??
                ""
              }
              placeholder={
                settings.title ??
                businessName
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">
              Social description
            </Label>

            <Textarea
              id="ogDescription"
              name="ogDescription"
              maxLength={180}
              rows={3}
              defaultValue={
                settings.ogDescription ??
                ""
              }
              placeholder={
                settings.description ??
                "Discover this business on LeadNexus."
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
      >
        <Save className="size-4" />
        Save SEO settings
      </Button>
    </form>
  );
}