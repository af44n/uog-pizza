import axios from "axios";

// Small helper for talking to the staff API. The PIN is kept in sessionStorage,
// so it is forgotten when the browser tab is closed.
export const getPin = () => sessionStorage.getItem("uog-pin") || "";
export const savePin = (pin) => sessionStorage.setItem("uog-pin", pin);
export const clearPin = () => sessionStorage.removeItem("uog-pin");

const staff = axios.create({ baseURL: "/api/staff" });
staff.interceptors.request.use((config) => {
  config.headers["x-staff-pin"] = getPin();
  return config;
});

// staffFetch("/orders", { method: "POST", data: {...} }) -> the response body, or a thrown Error with the server's message
export async function staffFetch(path, options = {}) {
  try {
    const res = await staff({ url: path, ...options });
    return res.data;
  } catch (err) {
    throw Object.assign(new Error(err.response?.data?.error || "Request failed"), { status: err.response?.status });
  }
}

export async function login(pin) {
  await axios.post("/api/staff/login", { pin });
}

// Downloads the sales spreadsheet (the PIN header means we can't use a plain link)
export async function downloadReport(days) {
  const res = await staff.get("/report.csv", { params: { days }, responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `uog-pizza-sales-${days}d.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const timeOf = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const typeLabel = { "dine-in": "Dine in", takeaway: "Takeaway", delivery: "Delivery" };
export const payLabel = { cash: "Cash", card: "Card", cod: "Cash on delivery" };
