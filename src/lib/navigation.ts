import { useEffect, useMemo, useState } from "react";

export type AppRoute =
  | { name: "dashboard" }
  | { name: "editor"; id: string }
  | { name: "slides"; id: string }
  | { name: "profile" }
  | { name: "not-found" };

export function navigateTo(path: string): void {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

export function parseRoute(hash: string): AppRoute {
  const path = hash.replace(/^#/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { name: "dashboard" };
  }

  if (segments[0] === "profile" && segments.length === 1) {
    return { name: "profile" };
  }

  if (segments[0] === "editor" && segments[1]) {
    return { name: "editor", id: decodeURIComponent(segments[1]) };
  }

  if (segments[0] === "slides" && segments[1]) {
    return { name: "slides", id: decodeURIComponent(segments[1]) };
  }

  return { name: "not-found" };
}

export function useHashRoute(): AppRoute {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return useMemo(() => parseRoute(hash), [hash]);
}
