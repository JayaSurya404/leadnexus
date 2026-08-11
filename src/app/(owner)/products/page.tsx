import type {
  Metadata,
} from "next";

import {
  Package,
} from "lucide-react";

import {
  CreateProductForm,
} from "@/components/products/create-product-form";

import {
  ProductEditorCard,
} from "@/components/products/product-editor-card";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "Products | LeadNexus",
};

export default async function ProductsPage() {
  const context =
    await requireOwner();

  const supabase =
    await createClient();

  const [
    productResult,
    mediaResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
          id,
          item_type,
          name,
          description,
          price_text,
          active,
          featured,
          sort_order,
          created_at
        `,
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),

    supabase.storage
      .from(
        "business-media",
      )
      .list(
        `${context.business.id}/products`,
        {
          limit: 1000,
        },
      ),
  ]);

  if (
    productResult.error
  ) {
    throw new Error(
      `Unable to load products: ${productResult.error.message}`,
    );
  }

  if (
    mediaResult.error
  ) {
    throw new Error(
      `Unable to load product images: ${mediaResult.error.message}`,
    );
  }

  const mediaMap =
    new Map(
      (
        mediaResult.data ??
        []
      ).map(
        (file) => [
          file.name,
          file,
        ],
      ),
    );

  const products =
    (
      productResult.data ??
      []
    ).map(
      (product) => {
        const media =
          mediaMap.get(
            product.id,
          );

        let imageUrl:
          | string
          | null = null;

        if (media) {
          const publicUrl =
            supabase.storage
              .from(
                "business-media",
              )
              .getPublicUrl(
                `${context.business.id}/products/${product.id}`,
              ).data.publicUrl;

          const version =
            media.updated_at ??
            media.created_at ??
            "";

          imageUrl =
            `${publicUrl}?v=${encodeURIComponent(
              version,
            )}`;
        }

        return {
          id:
            product.id,

          itemType:
            product.item_type,

          name:
            product.name,

          description:
            product.description,

          priceText:
            product.price_text,

          active:
            product.active,

          featured:
            product.featured,

          sortOrder:
            product.sort_order,

          imageUrl,
        };
      },
    );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Catalog
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Products & services
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage the products and
          services visitors can discover
          on your public LeadNexus page.
        </p>
      </div>

      <CreateProductForm />

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Package className="size-5" />

          <h2 className="text-xl font-semibold">
            Your catalog
          </h2>

          <span className="text-sm text-muted-foreground">
            ({products.length})
          </span>
        </div>

        {products.length ===
        0 ? (
          <div className="rounded-xl border border-dashed px-6 py-16 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 font-medium">
              No products or services
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Create your first catalog
              item using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map(
              (product) => (
                <ProductEditorCard
                  key={
                    product.id
                  }
                  businessId={
                    context
                      .business.id
                  }
                  product={
                    product
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}