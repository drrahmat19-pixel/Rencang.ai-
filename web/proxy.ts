import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/paths";
import { supabaseEnv } from "@/lib/supabase/env";

/** Menyegarkan sesi Supabase di tiap request & mengarahkan yang belum login ke /masuk (cek optimistis). */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { url, key, configured } = supabaseEnv();
  let response = NextResponse.next({ request });
  let loggedIn = false;

  if (configured) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    try {
      const { data } = await supabase.auth.getClaims();
      loggedIn = Boolean(data?.claims);
    } catch {
      loggedIn = false;
    }
  }

  if (!loggedIn && !isPublicPath(path)) {
    const target = request.nextUrl.clone();
    target.pathname = "/masuk";
    target.search = path === "/" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(target);
  }
  if (loggedIn && isPublicPath(path)) {
    const target = request.nextUrl.clone();
    target.pathname = "/beranda";
    target.search = "";
    return NextResponse.redirect(target);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
