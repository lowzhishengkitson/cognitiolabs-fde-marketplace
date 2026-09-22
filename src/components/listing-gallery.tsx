"use client";

import { useState } from "react";
import { ListingImage } from "@/components/listing-image";

export function ListingGallery({ images, title }: { images?: string[]; title: string }) {
  const available = images?.filter(Boolean) ?? [];
  const [selected, setSelected] = useState(0);
  const active = available[selected];

  return <div className="min-w-0 lg:col-span-3">
    <ListingImage key={active ?? "fallback"} src={active} alt={`${title} product photo${available.length > 1 ? ` ${selected + 1} of ${available.length}` : ""}`} sizes="(min-width: 1024px) 60vw, 100vw" priority className="aspect-[4/3] w-full rounded-2xl border border-slate-200 shadow-sm" />
    {available.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Listing photos">
      {available.map((image, index) => <button key={image} type="button" onClick={() => setSelected(index)} aria-label={`Show photo ${index + 1} of ${available.length}`} aria-pressed={selected === index} className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${selected === index ? "border-blue-700" : "border-transparent hover:border-blue-300"}`}>
        <ListingImage src={image} alt="" decorative sizes="80px" className="h-full w-full" />
      </button>)}
    </div>}
  </div>;
}
