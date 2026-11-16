import Image from "next/image";
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
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center dark:bg-transparent",
        "rounded-md bg-gvn-navy px-2 py-1 dark:rounded-none dark:bg-transparent dark:px-0 dark:py-0",
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
