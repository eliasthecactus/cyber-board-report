"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Username is required for login now
    if (!displayName.trim()) {
      setError("Please enter your username to continue");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Start authentication with username
      const startResponse = await fetch("/api/auth/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || "Failed to start authentication");
      }

      const { options } = await startResponse.json();

      // Step 2: Prompt user to authenticate with their passkey
      const credential = await startAuthentication(options);

      // Step 3: Verify authentication on server
      const finishResponse = await fetch("/api/auth/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, displayName }),
      });

      if (!finishResponse.ok) {
        const error = await finishResponse.json();
        throw new Error(error.error || "Authentication failed");
      }

      setMessage("Authentication successful! Redirecting...");
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMsg);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!displayName.trim()) {
      setError("Please enter your username");
      return;
    }

    setLoading(true);

    try {
      // Normalize username to lowercase for case-insensitive comparison
      const normalizedName = displayName.trim().toLowerCase();

      // Step 1: Start registration
      const startResponse = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: normalizedName }),
      });

      if (!startResponse.ok) {
        const error = await startResponse.json();
        throw new Error(error.error || "Failed to start registration");
      }

      const { options } = await startResponse.json();

      // Step 2: Create passkey on device
      const credential = await startRegistration(options);

      // Step 3: Verify registration on server
      const finishResponse = await fetch("/api/auth/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          credential, 
          displayName: normalizedName
        }),
      });

      if (!finishResponse.ok) {
        const error = await finishResponse.json();
        throw new Error(error.error || "Registration failed");
      }

      setMessage("Registration successful! Redirecting...");
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Registration failed";
      setError(errorMsg);
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="navbar bg-base-300 bg-opacity-95 shadow-sm">
        <div className="flex-1">
          <span className="btn btn-ghost text-xl">Cyber Board Reports</span>
        </div>
      </div>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-2xl max-w-md w-full">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Security Authentication</h2>

            {error && (
              <div className="alert alert-error mb-4">
                <div className="text-sm">{error}</div>
              </div>
            )}

            {message && (
              <div className="alert alert-success mb-4">
                <div className="text-sm">{message}</div>
              </div>
            )}

            <div className="tabs tabs-bordered w-full mb-6" role="tablist">
              {/* Sign In Tab */}
              <input
                type="radio"
                name="auth_tabs"
                role="tab"
                className="tab"
                aria-label="Sign In"
                checked={mode === "login"}
                onChange={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                  setDisplayName("");
                }}
              />
              <div role="tabpanel" className="tab-content p-4 w-full">
                {mode === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Username</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setError("");
                        }}
                        disabled={loading}
                        required
                        className="input input-bordered w-full"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !displayName.trim()}
                      className="btn btn-primary w-full gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Signing In...
                        </>
                      ) : (
                        "Sign In with Passkey"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Create Account Tab */}
              <input
                type="radio"
                name="auth_tabs"
                role="tab"
                className="tab"
                aria-label="Create Account"
                checked={mode === "register"}
                onChange={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                  setDisplayName("");
                }}
              />
              <div role="tabpanel" className="tab-content p-4 w-full">
                {mode === "register" && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Username</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setError("");
                        }}
                        disabled={loading}
                        required
                        className="input input-bordered w-full"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !displayName.trim()}
                      className="btn btn-primary w-full gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Creating...
                        </>
                      ) : (
                        "Create Passkey"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
