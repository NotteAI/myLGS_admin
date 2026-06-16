import { createBrowserClient } from "@supabase/ssr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof createBrowserClient<any>>;

let _client: AnyClient | undefined;

export const supabase: AnyClient = new Proxy({} as AnyClient, {
  get(_, prop, receiver) {
    if (!_client) {
      _client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
    }
    return Reflect.get(_client, prop, receiver);
  },
});
