"use client";
/* eslint-disable @next/next/no-img-element -- Local previews and tokenized Firebase uploads cannot use the Next image optimizer. */

import { ImagePlus, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api-client";

import type { ResellerSubmission } from "./reseller-product-types";

interface UploadResponse {
  readonly data: { readonly url: string };
}

interface SelectedImage {
  readonly file: File;
  readonly previewUrl: string;
}

interface ResellerProductEditFormProps {
  readonly product: ResellerSubmission;
  readonly onCancel: () => void;
  readonly onSaved: () => Promise<void>;
}

const maximumImages = 4;
const maximumImageBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ResellerProductEditForm({
  product,
  onCancel,
  onSaved,
}: ResellerProductEditFormProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<readonly SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => images.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [images],
  );

  const chooseImages = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = Array.from(event.target.files ?? []);
    const invalid = selected.find(
      (image) => !allowedImageTypes.has(image.type) || image.size > maximumImageBytes,
    );
    if (selected.length > maximumImages || invalid) {
      setImages([]);
      event.target.value = "";
      setError("Choose up to 4 JPEG, PNG, or WebP images, no larger than 5 MB each.");
      return;
    }
    setImages(selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || isSubmitting) return;
    const data = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const imageUrls = images.length ? [] as string[] : [...product.imageUrls];
      for (const [index, image] of images.entries()) {
        setProgress(`Uploading replacement image ${index + 1} of ${images.length}…`);
        const uploadBody = new FormData();
        uploadBody.append("image", image.file);
        const uploaded = await apiRequest<UploadResponse>("/api/uploads/product-image", {
          method: "POST",
          body: uploadBody,
          idToken,
        });
        imageUrls.push(uploaded.data.url);
      }

      setProgress("Saving changes…");
      await apiRequest(`/api/resellers/products/${encodeURIComponent(product.id)}`, {
        method: "PATCH",
        idToken,
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          description: String(data.get("description") ?? ""),
          shortDescription: String(data.get("shortDescription") ?? ""),
          category: String(data.get("category") ?? "raw"),
          origin: String(data.get("origin") ?? ""),
          weightGrams: Number(data.get("weightGrams")),
          retailPriceSen: Math.round(Number(data.get("priceRm")) * 100),
          imageUrls,
        }),
      });
      await onSaved();
      onCancel();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be updated.");
    } finally {
      setProgress("");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 rounded-2xl border border-gold/35 bg-surface p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-xs uppercase tracking-[.16em] text-gold">Editing product</p><h4 className="mt-1 font-display text-3xl">{product.name}</h4><p className="mt-1 text-sm text-muted">The product URL stays unchanged. Saving returns the product to admin review.</p></div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}><RotateCcw className="size-4" />Cancel</Button>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor={`edit-name-${product.id}`}>Product name</Label><Input id={`edit-name-${product.id}`} name="name" defaultValue={product.name} minLength={2} maxLength={100} required /></div>
        <div className="grid gap-2"><Label htmlFor={`edit-origin-${product.id}`}>Malaysian origin</Label><Input id={`edit-origin-${product.id}`} name="origin" defaultValue={product.origin} minLength={2} maxLength={80} required /></div>
        <div className="grid gap-2"><Label htmlFor={`edit-category-${product.id}`}>Category</Label><select id={`edit-category-${product.id}`} name="category" defaultValue={product.category} className="h-12 rounded-xl border border-line bg-surface px-4 text-sm outline-none focus:border-gold"><option value="raw">Raw honey</option><option value="gift">Gift product</option></select></div>
        <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor={`edit-weight-${product.id}`}>Weight (g)</Label><Input id={`edit-weight-${product.id}`} name="weightGrams" type="number" min="1" max="20000" step="1" defaultValue={product.weightGrams} required /></div><div className="grid gap-2"><Label htmlFor={`edit-price-${product.id}`}>Price (RM)</Label><Input id={`edit-price-${product.id}`} name="priceRm" type="number" min="0.01" max="100000" step="0.01" defaultValue={(product.retailPriceSen / 100).toFixed(2)} required /></div></div>
        <div className="grid gap-2 md:col-span-2"><Label htmlFor={`edit-short-${product.id}`}>Short description</Label><Input id={`edit-short-${product.id}`} name="shortDescription" defaultValue={product.shortDescription} minLength={5} maxLength={180} required /></div>
        <div className="grid gap-2 md:col-span-2"><Label htmlFor={`edit-description-${product.id}`}>Full description</Label><textarea id={`edit-description-${product.id}`} name="description" defaultValue={product.description} minLength={10} maxLength={2000} rows={4} className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-3 focus:ring-gold/15" required /></div>
      </div>
      <div className="mt-5 rounded-xl border border-dashed border-line p-4">
        <div className="flex items-center gap-3"><ImagePlus className="size-5 text-gold" /><div><Label htmlFor={`edit-images-${product.id}`}>Replace images (optional)</Label><p className="text-xs text-muted">Leave empty to keep the current images.</p></div></div>
        <Input id={`edit-images-${product.id}`} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} className="mt-3 cursor-pointer" />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{(images.length ? images.map((image) => image.previewUrl) : product.imageUrls).map((url, index) => <div key={url} className="aspect-square overflow-hidden rounded-lg bg-ink/5"><img src={url} alt={`${product.name} image ${index + 1}`} className="h-full w-full object-cover" /></div>)}</div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle className="size-4 animate-spin" />{progress}</> : <><Save className="size-4" />Save changes</>}</Button><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button></div>
    </form>
  );
}
