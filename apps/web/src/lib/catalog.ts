// The BHD demo catalog is isolated from the original MYR production API.
import { getProduct, products, type StoreProduct } from "./products";

export const getCatalogProducts = async (): Promise<readonly StoreProduct[]> => products;
export const getCatalogProduct = async (slug: string): Promise<StoreProduct | undefined> => getProduct(slug);
