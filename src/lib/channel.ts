/**
 * Which deployment this build is. The dev build is served from /dev/ on the
 * same origin as production, so anything stored in the browser must be kept
 * apart (see storage.ts).
 */
export const APP_CHANNEL: "dev" | "prod" = import.meta.env.VITE_APP_CHANNEL === "dev" ? "dev" : "prod";

export const IS_DEV_CHANNEL = APP_CHANNEL === "dev";

/** The version shown in the app; dev builds get a "-dev" suffix, e.g. "0.2.0-dev". */
export const APP_VERSION = IS_DEV_CHANNEL ? `${__APP_VERSION__}-dev` : __APP_VERSION__;
