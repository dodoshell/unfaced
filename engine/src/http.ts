/** Calls a paid or stock service, turning a network failure into "Could not reach <service>: <why>". */
export async function reach(service: string, fetchImpl: typeof fetch, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchImpl(url, init);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    throw new Error(`Could not reach ${service}: ${err.message}${err.cause instanceof Error ? ` (${err.cause.message})` : ""}`);
  }
}
