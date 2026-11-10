import type { Metadata } from "next";

import { ProductCard } from "@/components/storefront/product-card";
import { ShopIntro } from "@/components/storefront/shop-intro";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop Malaysian Honey",
  description: "Browse Melyia's raw, single-origin Malaysian honey collection.",
};

export default async function ShopPage() {
  const products = await getCatalogProducts();
  return (
    <div className="container-shell py-12 md:py-20">
      <ShopIntro />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
