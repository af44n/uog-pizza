// Small helper for talking to the staff API. The PIN is kept in sessionStorage,
// so it is forgotten when the browser tab is closed.
export const getPin = () => sessionStorage.getItem("uog-pin") || "";
export const savePin = (pin) => sessionStorage.setItem("uog-pin", pin);
export const clearPin = () => sessionStorage.removeItem("uog-pin");

export async function staffFetch(path, options = {}) {
  const res = await fetch("/api/staff" + path, {
    ...options,
    headers: { "Content-Type": "application/json", "x-staff-pin": getPin(), ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status });
  return data;
}

export const timeOf = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
