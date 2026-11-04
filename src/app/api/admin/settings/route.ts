import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateSiteSettings } from "@/server/settings/service";
import { isAppError } from "@/lib/errors";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = await updateSiteSettings(session.user, body);
    return NextResponse.json(data);
  } catch (err) {
    if (isAppError(err)) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
