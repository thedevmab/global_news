import { redirect } from "next/navigation";
import { Role, UserStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { listUsers } from "@/server/users/service";
import {
  userCreateAction,
  userDeleteAction,
  userUpdateAction,
} from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/components/admin/AdminTable";
import { format } from "date-fns";

export const metadata = { title: "Users" };

export default async function UsersAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    requirePermission(user, "user:manage");
  } catch {
    redirect("/admin");
  }

  const users = await listUsers(user);
  const creatableRoles: Role[] =
    user.role === "SUPER_ADMIN"
      ? ["CONTRIBUTOR", "EDITOR", "PUBLISHER", "ADMIN", "SUPER_ADMIN"]
      : ["CONTRIBUTOR", "EDITOR", "PUBLISHER", "ADMIN"];

  async function createAction(formData: FormData) {
    "use server";
    await userCreateAction({
      email: String(formData.get("email") || ""),
      name: String(formData.get("name") || ""),
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || "CONTRIBUTOR"),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create staff accounts and manage roles, access, and status.
        </p>
      </div>

      <section className="space-y-4 rounded-md border border-border bg-background p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Create user
        </h2>
        <form action={createAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" name="name" placeholder="Full name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              placeholder="At least 10 characters"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              name="role"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              defaultValue="CONTRIBUTOR"
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="min-h-10 sm:col-span-2 sm:w-fit">
            Create user
          </Button>
        </form>
      </section>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {users.map((u) => {
          const roleOptions =
            u.role === "SUPER_ADMIN" && user.role === "SUPER_ADMIN"
              ? creatableRoles
              : creatableRoles.filter((r) => r !== "SUPER_ADMIN");
          const roleLocked =
            user.role !== "SUPER_ADMIN" && u.role === "SUPER_ADMIN";

          return (
            <li
              key={u.id}
              className="rounded-md border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {u.email}
                  </p>
                </div>
                <Badge
                  variant={u.status === "ACTIVE" ? "success" : "warning"}
                  className="shrink-0"
                >
                  {u.status}
                </Badge>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Last login{" "}
                {u.lastLoginAt
                  ? format(u.lastLoginAt, "MMM d, yyyy HH:mm")
                  : "never"}
              </p>

              <form
                action={async (fd) => {
                  "use server";
                  await userUpdateAction(u.id, {
                    role: String(fd.get("role")),
                  });
                }}
                className="mt-3 grid grid-cols-[1fr_auto] gap-2"
              >
                <select
                  name="role"
                  defaultValue={u.role}
                  disabled={roleLocked}
                  className="h-10 min-w-0 rounded-md border border-border bg-background px-3 text-sm"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="min-h-10 px-4"
                  disabled={roleLocked}
                >
                  Save
                </Button>
              </form>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <form
                  action={async () => {
                    "use server";
                    await userUpdateAction(u.id, {
                      status:
                        u.status === "SUSPENDED"
                          ? UserStatus.ACTIVE
                          : UserStatus.SUSPENDED,
                    });
                  }}
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="min-h-10 w-full"
                  >
                    {u.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await userDeleteAction(u.id);
                  }}
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    className="min-h-10 w-full"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          );
        })}
        {users.length === 0 ? (
          <li className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No users found.
          </li>
        ) : null}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block">
        <AdminTable>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleOptions =
                u.role === "SUPER_ADMIN" && user.role === "SUPER_ADMIN"
                  ? creatableRoles
                  : creatableRoles.filter((r) => r !== "SUPER_ADMIN");
              const roleLocked =
                user.role !== "SUPER_ADMIN" && u.role === "SUPER_ADMIN";

              return (
                <tr key={u.id}>
                  <td>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td>
                    <form
                      action={async (fd) => {
                        "use server";
                        await userUpdateAction(u.id, {
                          role: String(fd.get("role")),
                        });
                      }}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <select
                        name="role"
                        defaultValue={u.role}
                        disabled={roleLocked}
                        className="h-8 rounded border border-border bg-background px-2 text-xs"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={roleLocked}
                      >
                        Save
                      </Button>
                    </form>
                  </td>
                  <td>
                    <Badge
                      variant={u.status === "ACTIVE" ? "success" : "warning"}
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {u.lastLoginAt
                      ? format(u.lastLoginAt, "yyyy-MM-dd HH:mm")
                      : "—"}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <form
                        action={async () => {
                          "use server";
                          await userUpdateAction(u.id, {
                            status:
                              u.status === "SUSPENDED"
                                ? UserStatus.ACTIVE
                                : UserStatus.SUSPENDED,
                          });
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          {u.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await userDeleteAction(u.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="destructive">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
