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
import { Badge } from "@/components/ui/badge";
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
      <h1 className="font-serif text-2xl font-semibold">Users</h1>

      <form
        action={createAction}
        className="grid gap-3 border border-border bg-background p-4 md:grid-cols-2"
      >
        <Input name="name" placeholder="Name" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input
          name="password"
          type="password"
          placeholder="Password (10+ chars)"
          required
        />
        <select
          name="role"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          defaultValue="CONTRIBUTOR"
        >
          {creatableRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button type="submit" className="md:col-span-2 md:w-fit">
          Create user
        </Button>
      </form>

      <div className="overflow-x-auto border border-border bg-background">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleOptions =
                u.role === "SUPER_ADMIN" && user.role === "SUPER_ADMIN"
                  ? creatableRoles
                  : creatableRoles.filter((r) => r !== "SUPER_ADMIN");
              return (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-3 py-2">
                    <form
                      action={async (fd) => {
                        "use server";
                        await userUpdateAction(u.id, {
                          role: String(fd.get("role")),
                        });
                      }}
                      className="flex gap-1"
                    >
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="h-8 rounded border border-border bg-background px-2 text-xs"
                        disabled={
                          user.role !== "SUPER_ADMIN" &&
                          u.role === "SUPER_ADMIN"
                        }
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={u.status === "ACTIVE" ? "success" : "warning"}
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {u.lastLoginAt
                      ? format(u.lastLoginAt, "yyyy-MM-dd HH:mm")
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
