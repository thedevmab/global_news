import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 py-16 text-center",
        className,
      )}
    >
      <h2 className="font-serif text-2xl font-semibold text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
