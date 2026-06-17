import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof createBrowserClient<any>>;

let _client: AnyClient | undefined;

export const supabase: AnyClient = new Proxy({} as AnyClient, {
  get(_, prop) {
    if (!_client) {
      _client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { db: { schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public" } },
      );
    }
    const value = Reflect.get(_client, prop, _client);
    return typeof value === "function" ? value.bind(_client) : value;
  },
});
