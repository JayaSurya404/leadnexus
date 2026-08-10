"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main><h1>Application error</h1><button onClick={reset}>Try again</button></main></body></html>;
}
