"use client";

import {
  Check,
  Droplets,
  FlaskConical,
  Gift,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Trees,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/storefront/product-card";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { products } from "@/lib/products";

const promises = [
  { icon: ShieldCheck, title: "Halal Certified", text: "JAKIM approved" },
  { icon: FlaskConical, title: "Lab-Tested Purity", text: "No added sugar" },
  { icon: Droplets, title: "100% Raw", text: "Cold-extracted" },
  { icon: MapPin, title: "Single-Origin", text: "Traceable to the hive" },
] as const;

const rawHoneyBenefits = [
  "Naturally occurring enzymes stay intact",
  "Pollen and floral character remain in every batch",
  "Never diluted with syrup or blended for sameness",
  "Independent purity testing before every release",
] as const;

const harvestSteps = [
  { icon: Trees, number: "01", title: "Forest origin", text: "Partner beekeepers tend hives among the rainforest blooms of Pahang and Sabah." },
  { icon: Droplets, number: "02", title: "Seasonal harvest", text: "Honey is collected in small batches only when the comb is naturally ready." },
  { icon: Sparkles, number: "03", title: "Cold extracted", text: "No high heat and no aggressive filtering—just a slow separation from the comb." },
  { icon: PackageCheck, number: "04", title: "Tested and bottled", text: "Every origin is checked for purity, then bottled and traced by batch." },
] as const;

export default function HomePage() {
  const { t } = usePreferences();
  return (
    <>
      <p className="container-shell pt-3 text-center text-sm text-muted">{t("Demo prices in Bahraini dinars. No real purchases.")}</p>
      <section className="container-shell pt-4 sm:pt-6">
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-[0_30px_70px_rgba(60,40,10,.22)] sm:rounded-[1.35rem]">
          <Image
            src="/brand/melyia-hero.webp"
            alt={t("Melyia Raw Tualang honey with honeycomb and wooden dipper")}
            fill
            priority
            sizes="(max-width: 768px) calc(100vw - 2rem), 1120px"
            className="object-cover"
          />
          <div className="absolute bottom-[5%] start-[4%] flex max-w-[90%] flex-wrap gap-2.5 sm:gap-3">
            <Link href="/shop" className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold-light px-4 text-xs font-bold text-ink shadow-lg transition hover:bg-gold sm:min-h-12 sm:px-7 sm:text-sm">{t("Shop the harvest")}</Link>
            <Link href="#story" className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface/95 px-4 text-xs font-bold text-foreground shadow-lg backdrop-blur transition hover:bg-surface sm:min-h-12 sm:px-7 sm:text-sm">{t("Our story →")}</Link>
          </div>
        </div>
      </section>

      <section className="container-shell py-14 text-center sm:py-20 md:py-24">
        <div className="mx-auto flex max-w-[52rem] flex-col items-center">
          <p className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-gold"><span className="h-px w-6 bg-gold" />{t("Raw · unfiltered · halal")}<span className="h-px w-6 bg-gold" /></p>
          <h1 className="mt-6 font-display text-5xl leading-[.96] tracking-[-.035em] sm:text-6xl lg:text-[4.6rem]">
            {t("Honey the way")}<br /><em className="font-normal text-gold">{t("nature intended it.")}</em>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            {t("Single-origin Tualang and Kelulut honey, drawn straight from hives in the Malaysian rainforest. Cold-extracted, never heated, never blended — spooned into your everyday.")}
          </p>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full bg-seal px-7 text-sm font-bold text-on-seal hover:bg-gold-light hover:text-ink">{t("Shop the harvest")}</Link>
            <Link href="#story" className="inline-flex min-h-12 items-center justify-center rounded-full border border-line px-7 text-sm font-bold hover:border-gold">{t("How we harvest →")}</Link>
          </div>
          <div className="mt-9 flex items-center justify-center gap-4 text-start text-sm">
            <div className="flex -space-x-2" aria-hidden="true">{["A", "N", "S", "L"].map((letter, index) => <span key={letter} className="grid size-8 place-items-center rounded-full border-2 border-cream bg-gold text-xs font-bold text-ink" style={{ opacity: 1 - index * .1 }}>{letter}</span>)}</div>
            <div><strong>★★★★★ 4.9 / 5</strong><p className="text-xs text-muted">{t("from 2,140 Malaysian households")}</p></div>
          </div>
        </div>
      </section>

      <section className="bg-dark text-cream" aria-label={t("Melyia quality promises")}>
        <div className="container-shell grid grid-cols-2 gap-x-5 gap-y-7 py-7 md:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-gold" aria-hidden="true" />
              <div><strong className="text-sm text-gold">{t(title)}</strong><p className="text-xs text-cream/55">{t(text)}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-16 md:py-24">
        <div className="flex items-end justify-between gap-6">
          <div><p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-gold">{t("The collection")}</p><h2 className="mt-3 font-display text-4xl sm:text-5xl">{t("Four honeys, one promise")}</h2></div>
          <Link href="/shop" className="hidden text-sm font-bold text-gold hover:underline sm:block">{t("View full catalog →")}</Link>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="border-y border-line bg-dark text-cream">
        <div className="container-shell grid gap-10 py-16 md:grid-cols-[.9fr_1.1fr] md:items-center md:py-24">
          <div className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_50%_42%,rgba(224,168,58,.3),transparent_28%),linear-gradient(145deg,#34230f,#17110b)] p-8">
            <div className="absolute inset-8 rounded-full border border-gold/20" />
            <div className="absolute inset-16 rounded-full border border-gold/15" />
            <div className="relative grid h-full place-items-center text-center">
              <div>
                <Droplets className="mx-auto size-12 text-gold" aria-hidden="true" />
                <p className="mt-5 font-display text-5xl text-gold">100%</p>
                <p className="font-mono text-xs uppercase tracking-[.2em] text-cream/55">{t("raw Malaysian honey")}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-gold">{t("Why raw honey")}</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">{t("Most supermarket honey isn't really honey.")}</h2>
            <p className="mt-6 max-w-xl leading-8 text-cream/60">{t("Industrial heating and ultra-filtration make honey easier to standardise, but strip away much of what makes each harvest special. Melyia keeps the origin, aroma, texture and naturally occurring goodness intact.")}</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {rawHoneyBenefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm leading-6 text-cream/80"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold/15"><Check className="size-3.5 text-gold" /></span>{t(benefit)}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-shell py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center"><p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-gold">{t("From hive to home")}</p><h2 className="mt-4 font-display text-4xl sm:text-5xl">{t("A harvest with nothing to hide.")}</h2><p className="mt-5 leading-7 text-muted">{t("Four careful steps preserve the taste of the Malaysian forest and make every jar traceable.")}</p></div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {harvestSteps.map(({ icon: Icon, number, title, text }) => <li key={number} className="rounded-2xl border border-line bg-surface p-6"><div className="flex items-center justify-between"><Icon className="size-6 text-gold" /><span className="font-mono text-xs text-muted">{number}</span></div><h3 className="mt-8 font-display text-2xl">{t(title)}</h3><p className="mt-3 text-sm leading-6 text-muted">{t(text)}</p></li>)}
        </ol>
      </section>

      <section id="story" className="border-y border-line bg-surface">
        <div className="container-shell grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="honeycomb-pattern min-h-80 overflow-hidden rounded-2xl p-8 text-cream sm:p-12">
            <p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t("Pahang")} · {t("Malaysia")}</p>
            <p className="mt-24 max-w-sm font-display text-4xl leading-tight">{t("From forest canopy to breakfast table, with as little interference as possible.")}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[.2em] text-gold">{t("Our approach")}</p>
            <h2 className="mt-3 font-display text-5xl">{t("A slower kind of sweetness.")}</h2>
            <p className="mt-6 text-base leading-8 text-muted">{t("We work with Malaysian beekeepers who harvest by origin and season. Every batch is cold-extracted, independently tested, and packed without blending away the place it came from.")}</p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-7"><div><dt className="font-display text-3xl">4</dt><dd className="text-xs text-muted">{t("single origins")}</dd></div><div><dt className="font-display text-3xl">0</dt><dd className="text-xs text-muted">{t("added sugar")}</dd></div><div><dt className="font-display text-3xl">100%</dt><dd className="text-xs text-muted">{t("Malaysian")}</dd></div></dl>
          </div>
        </div>
      </section>

      <section className="container-shell py-16 md:py-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between"><div><p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-gold">{t("From the breakfast table")}</p><h2 className="mt-3 max-w-xl font-display text-4xl sm:text-5xl">{t("Loved for how real honey should taste.")}</h2></div><p className="max-w-sm text-sm leading-6 text-muted">{t("Small-batch character means every origin tastes a little different—and that is exactly the point.")}</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["Aina R.", "Kuala Lumpur", "Rich, floral and not overly sweet. The Tualang jar has completely replaced processed honey in our kitchen."],
            ["Daniel L.", "Penang", "The batch details and purity testing gave me confidence. The flavour is wonderfully distinctive."],
            ["Siti N.", "Johor Bahru", "Beautiful packaging, quick delivery and a genuine rainforest aroma the moment you open it."],
          ].map(([name, place, quote]) => <figure key={name} className="rounded-2xl border border-line bg-surface p-6"><p className="text-gold" aria-label={t("5 out of 5 stars")}>★★★★★</p><blockquote className="mt-5 font-display text-2xl leading-snug">“{t(quote)}”</blockquote><figcaption className="mt-7 text-sm font-bold">{name}<span className="ms-2 font-normal text-muted">{place}</span></figcaption></figure>)}
        </div>
      </section>

      <section className="container-shell pb-16 md:pb-24">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-gold md:grid-cols-[1.15fr_.85fr]">
          <div className="p-8 sm:p-12"><p className="font-mono text-xs font-semibold uppercase tracking-[.22em] text-ink/60">{t("Give the harvest")}</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-ink sm:text-5xl">{t("A Malaysian gift, gathered by the forest.")}</h2><p className="mt-5 max-w-xl leading-7 text-ink/65">{t("Curated honey sets for celebrations, thoughtful thank-yous and corporate gifting.")}</p><Link href="/shop" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 text-sm font-bold text-cream hover:bg-dark">{t("Explore gift sets")}</Link></div>
          <div className="flex min-h-64 items-center justify-center bg-[linear-gradient(145deg,#2b1b0c,#15100b)] p-10"><div className="text-center"><Gift className="mx-auto size-14 text-gold" /><p className="mt-5 font-display text-3xl text-cream">{t("Harvest Gift Box")}</p><p className="mt-2 text-sm text-cream/50">{t("Beautifully packed in Malaysia")}</p></div></div>
        </div>
      </section>
    </>
  );
}
