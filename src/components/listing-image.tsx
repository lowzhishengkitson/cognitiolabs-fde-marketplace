"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

function Placeholder({ alt }: { alt: string }) {
  return <div role="img" aria-label={`${alt} — image unavailable`} className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
    <svg viewBox="0 0 120 80" className="h-20 w-28 sm:h-24 sm:w-36" fill="none" aria-hidden="true"><rect x="18" y="8" width="84" height="54" rx="5" stroke="currentColor" strokeWidth="3"/><path d="M7 66h106l-7 7H14l-7-7Z" fill="currentColor"/><path d="M26 17h68v37H26z" fill="#dbeafe"/></svg>
  </div>;
}

export function ListingImage({ src, alt, sizes, priority = false, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
    {!showImage && <Placeholder alt={alt} />}
    {showImage && <Image src={src!} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailed(true)} className="object-cover transition duration-300 group-hover:scale-[1.02]" />}
  </div>;
}
