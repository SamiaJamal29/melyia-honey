import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/components/storefront/product-details";
import { getCatalogProduct } from "@/lib/catalog";
import { products } from "@/lib/products";

export const generateStaticParams = () => products.map(({ slug }) => ({ slug }));

interface ProductPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getCatalogProduct((await params).slug);
  return product ? { title: product.name, description: product.shortDescription } : {};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getCatalogProduct((await params).slug);
  if (!product) notFound();
  return <ProductDetails product={product} />;
}
