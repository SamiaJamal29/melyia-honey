"use client";
/* eslint-disable @next/next/no-img-element -- Local previews and tokenized uploads should not pass through the Next image optimizer. */

import { ImagePlus, LoaderCircle, PackagePlus, ShieldCheck, UploadCloud } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api-client";

interface UploadResponse {
  readonly data: { readonly url: string };
}

interface ResellerProductFormProps {
  readonly onCreated: () => Promise<void>;
}

interface SelectedImage {
  readonly file: File;
  readonly previewUrl: string;
}

const maximumImages = 4;
const maximumImageBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const createSlug = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export function ResellerProductForm({ onCreated }: ResellerProductFormProps) {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [images, setImages] = useState<readonly SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, [images]);

  const chooseImages = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > maximumImages) {
      setImages([]);
      event.target.value = "";
      setError(t("Choose no more than {count} images.", { count: maximumImages }));
      return;
    }
    const invalid = selected.find(
      (image) => !allowedImageTypes.has(image.type) || image.size > maximumImageBytes,
    );
    if (invalid) {
      setImages([]);
      event.target.value = "";
      setError(t("Each image must be JPEG, PNG, or WebP and no larger than 5 MB."));
      return;
    }
    setImages(selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !images.length || isSubmitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const idToken = await user.getIdToken();
      const imageUrls: string[] = [];
      for (const [index, image] of images.entries()) {
        setProgress(t("Uploading image {current} of {total}…", { current: index + 1, total: images.length }));
        const uploadBody = new FormData();
        uploadBody.append("image", image.file);
        const uploaded = await apiRequest<UploadResponse>("/api/uploads/product-image", {
          method: "POST",
          body: uploadBody,
          idToken,
        });
        imageUrls.push(uploaded.data.url);
      }

      setProgress(t("Saving product for review…"));
      await apiRequest("/api/resellers/products", {
        method: "POST",
        idToken,
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          slug: String(data.get("slug") ?? ""),
          description: String(data.get("description") ?? ""),
          shortDescription: String(data.get("shortDescription") ?? ""),
          category: String(data.get("category") ?? "raw"),
          origin: String(data.get("origin") ?? ""),
          weightGrams: Number(data.get("weightGrams")),
          retailPriceSen: Math.round(Number(data.get("priceRm")) * 100),
          imageUrls,
        }),
      });

      form.reset();
      setName("");
      setSlug("");
      setIsSlugEdited(false);
      setImages([]);
      setSuccess(t("Product submitted. Melyia admin review is now pending."));
      await onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("The product could not be submitted."));
    } finally {
      setProgress("");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 p-5 md:p-7">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="reseller-product-name">{t("Honey or product name")}</Label><Input id="reseller-product-name" name="name" value={name} onChange={(event) => { const nextName = event.target.value; setName(nextName); if (!isSlugEdited) setSlug(createSlug(nextName)); }} minLength={2} maxLength={100} placeholder="Sabah Forest Honey" required /></div>
        <div className="grid gap-2"><Label htmlFor="reseller-product-slug">{t("Product URL name")}</Label><Input id="reseller-product-slug" name="slug" value={slug} onChange={(event) => { setIsSlugEdited(true); setSlug(createSlug(event.target.value)); }} minLength={2} maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="sabah-forest-honey" required /></div>
        <div className="grid gap-2"><Label htmlFor="reseller-product-origin">{t("Malaysian origin")}</Label><Input id="reseller-product-origin" name="origin" minLength={2} maxLength={80} placeholder="Sabah" required /></div>
        <div className="grid gap-2"><Label htmlFor="reseller-product-category">{t("Category")}</Label><select id="reseller-product-category" name="category" className="h-12 rounded-xl border border-line bg-surface px-4 text-sm outline-none focus:border-gold"><option value="raw">{t("Raw honey")}</option><option value="gift">{t("Gift product")}</option></select></div>
        <div className="grid gap-2"><Label htmlFor="reseller-product-weight">{t("Weight (grams)")}</Label><Input id="reseller-product-weight" name="weightGrams" type="number" min="1" max="20000" step="1" placeholder="500" required /></div>
        <div className="grid gap-2"><Label htmlFor="reseller-product-price">{t("Retail price (RM)")}</Label><Input id="reseller-product-price" name="priceRm" type="number" min="0.01" max="100000" step="0.01" placeholder="59.00" required /></div>
        <div className="grid gap-2 md:col-span-2"><Label htmlFor="reseller-product-short">{t("Short description")}</Label><Input id="reseller-product-short" name="shortDescription" minLength={5} maxLength={180} placeholder={t("Small-batch forest honey from Sabah.")} required /></div>
        <div className="grid gap-2 md:col-span-2"><Label htmlFor="reseller-product-description">{t("Full description")}</Label><textarea id="reseller-product-description" name="description" minLength={10} maxLength={2000} rows={5} className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-3 focus:ring-gold/15" placeholder={t("Tell customers where this honey comes from and what makes the harvest special.")} required /></div>
      </div>

      <div className="rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-5">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15"><ImagePlus className="size-5 text-gold" /></span><div><Label htmlFor="reseller-product-images" className="text-base">{t("Honey images")}</Label><p className="mt-1 text-xs leading-5 text-muted">{t("Upload 1–4 JPEG, PNG, or WebP images. Maximum 5 MB each.")}</p></div></div>
        <Input id="reseller-product-images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} className="mt-4 cursor-pointer bg-surface file:me-3 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-gold" required />
        {images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image, index) => <div key={image.previewUrl} className="aspect-square overflow-hidden rounded-xl border border-line bg-surface"><img src={image.previewUrl} alt={t("Selected honey preview {number}", { number: index + 1 })} className="h-full w-full object-cover" /></div>)}</div>}
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-ink/5 p-4 text-sm"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold" /><p className="leading-6 text-muted">{t("New products remain hidden from customers until a Melyia administrator approves their details and images.")}</p></div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
      <Button type="submit" size="lg" disabled={isSubmitting || !images.length} className="w-full sm:w-fit">{isSubmitting ? <><LoaderCircle className="size-4 animate-spin" />{progress}</> : <><UploadCloud className="size-4" />{t("Upload images & submit product")}</>}</Button>
      {!user && <p className="text-sm text-red-700"><PackagePlus className="me-2 inline size-4" />{t("Sign in as a reseller before adding products.")}</p>}
    </form>
  );
}
