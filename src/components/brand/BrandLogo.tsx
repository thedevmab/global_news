"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
  width = 144,
  height = 51,
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount (SSR/hydration), assume dark brand plate so the white mark
  // never flashes invisible on a white header.
  const isLight = mounted && resolvedTheme === "light";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        isLight && "rounded-md bg-gvn-navy px-2 py-1",
        className,
      )}
    >
      <Image
        src="/brand/gvn-logo-mark.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        className={cn("h-8 w-auto", imageClassName)}
      />
    </span>
  );
}
