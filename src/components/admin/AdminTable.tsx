import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("admin-table-wrap border border-border bg-background", className)}>
      <table className="admin-table min-w-full text-left text-sm">{children}</table>
    </div>
  );
}
