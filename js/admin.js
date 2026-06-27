import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// === CONFIG ===
const SUPABASE_URL = "https://zmqckvwqjkabkfjdzqji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptcWNrdndxamthYmtmamR6cWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTE4MzIsImV4cCI6MjA5ODAyNzgzMn0.kuX5mctiWdboF7kGtK9heiNJICVZJnKB-pBa5gneW7s";

// 🔐 CHANGE THIS PASSWORD — make it strong!
const ADMIN_PASSWORD = "SBS2026ADMIN!";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allRegistrations = [];

// === LOGIN ===
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

if (sessionStorage.getItem("adminLoggedIn") === "yes") {
  showDashboard();
}

loginBtn.addEventListener("click", login);
passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") login();
});

function login() {
  if (passwordInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminLoggedIn", "yes");
    showDashboard();
  } else {
    loginError.textContent = "❌ Wrong password. Try again.";
    passwordInput.value = "";
    passwordInput.focus();
  }
}

function showDashboard() {
  loginScreen.style.display = "none";
  dashboard.style.display = "block";
  loadRegistrations();
}

// === LOGOUT ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("adminLoggedIn");
  location.reload();
});

// === LOAD DATA ===
async function loadRegistrations() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = `<tr><td colspan="14" class="text-center py-8 text-gray-500">⏳ Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="14" class="text-center py-8 text-red-500">❌ Error: ${error.message}</td></tr>`;
    return;
  }

  allRegistrations = data || [];
  renderTable(allRegistrations);
  updateStats(allRegistrations);
}

// === RENDER TABLE ===
function renderTable(rows) {
  const tbody = document.getElementById("tableBody");

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" class="text-center py-8 text-gray-500">No registrations found 🤷</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, i) => {
    const expectationFull = r.expectation || "";
    const expectationShort = expectationFull.length > 40
      ? expectationFull.substring(0, 40) + "..."
      : expectationFull;

    const expectationCell = expectationFull
      ? `<button class="btn-view-expectation" data-name="${escapeHtml(r.full_name)}" data-text="${escapeHtml(expectationFull)}" title="Click to see full text">
           💬 ${escapeHtml(expectationShort)}
         </button>`
      : `<span class="text-gray-400 italic text-xs">— none —</span>`;

    return `
    <tr data-id="${r.id}">
      <td class="font-bold">${i + 1}</td>
      <td class="font-semibold">${escapeHtml(r.full_name)}</td>
      <td><a href="mailto:${r.email}" class="text-blue-600 hover:underline">${escapeHtml(r.email)}</a></td>
      <td><a href="https://wa.me/${cleanPhone(r.phone)}" target="_blank" class="text-green-600 hover:underline">${escapeHtml(r.phone)}</a></td>
      <td>${escapeHtml(r.gender || "-")}</td>
      <td>${escapeHtml(r.age_range || "-")}</td>
      <td>${escapeHtml((r.city ? r.city + ", " : "") + (r.state || ""))}</td>
      <td>${escapeHtml(r.church_name || "-")}</td>
      <td>${escapeHtml(r.role_in_church || "-")}</td>
      <td><span class="badge badge-${(r.attendance_mode || "").toLowerCase()}">${escapeHtml(r.attendance_mode || "-")}</span></td>
      <td>${escapeHtml(r.heard_from || "-")}</td>
      <td>${expectationCell}</td>
      <td class="whitespace-nowrap text-xs text-gray-600">${formatDate(r.created_at)}</td>
      <td>
        <button class="btn-delete-row" data-id="${r.id}" data-name="${escapeHtml(r.full_name)}">
          🗑️ Delete
        </button>
      </td>
    </tr>
  `;
  }).join("");

  document.querySelectorAll(".btn-delete-row").forEach(btn => {
    btn.addEventListener("click", handleDeleteRow);
  });

  document.querySelectorAll(".btn-view-expectation").forEach(btn => {
    btn.addEventListener("click", handleViewExpectation);
  });
}

// === VIEW FULL EXPECTATION ===
function handleViewExpectation(e) {
  const name = e.currentTarget.getAttribute("data-name");
  const text = e.currentTarget.getAttribute("data-text");

  const modal = document.getElementById("expectationModal");
  document.getElementById("modalName").textContent = name;
  document.getElementById("modalText").textContent = text;
  modal.style.display = "flex";
}

document.getElementById("closeModalBtn")?.addEventListener("click", () => {
  document.getElementById("expectationModal").style.display = "none";
});

document.getElementById("expectationModal")?.addEventListener("click", (e) => {
  if (e.target.id === "expectationModal") {
    e.target.style.display = "none";
  }
});

// === DELETE SINGLE ROW ===
async function handleDeleteRow(e) {
  const id = e.currentTarget.getAttribute("data-id");
  const name = e.currentTarget.getAttribute("data-name");

  const confirmed = confirm(`⚠️ Are you sure you want to DELETE this registration?\n\n👤 ${name}\n\nThis cannot be undone.`);
  if (!confirmed) return;

  e.currentTarget.textContent = "⏳ Deleting...";
  e.currentTarget.disabled = true;

  const { error } = await supabase.from("registrations").delete().eq("id", id);

  if (error) {
    alert("❌ Failed to delete: " + error.message);
    e.currentTarget.textContent = "🗑️ Delete";
    e.currentTarget.disabled = false;
    return;
  }

  allRegistrations = allRegistrations.filter(r => r.id !== id);
  applyFilters();
  updateStats(allRegistrations);
}

// === DELETE ALL ===
document.getElementById("deleteAllBtn").addEventListener("click", async () => {
  if (allRegistrations.length === 0) {
    alert("Nothing to delete — table is already empty.");
    return;
  }

  const confirm1 = confirm(`⚠️ DANGER: This will DELETE ALL ${allRegistrations.length} registrations!\n\nThis cannot be undone.\n\nContinue?`);
  if (!confirm1) return;

  const confirm2 = prompt(`🚨 FINAL WARNING!\n\nType DELETE ALL (in capitals) to confirm:`);
  if (confirm2 !== "DELETE ALL") {
    alert("❌ Cancelled. You did not type DELETE ALL correctly.");
    return;
  }

  const btn = document.getElementById("deleteAllBtn");
  btn.textContent = "⏳ Deleting all...";
  btn.disabled = true;

  const { error } = await supabase
    .from("registrations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  btn.textContent = "🗑️ Delete All";
  btn.disabled = false;

  if (error) {
    alert("❌ Failed: " + error.message);
    return;
  }

  alert("✅ All registrations deleted successfully!");
  loadRegistrations();
});

// === STATS ===
function updateStats(rows) {
  document.getElementById("statTotal").textContent = rows.length;
  document.getElementById("statPhysical").textContent = rows.filter(r => r.attendance_mode === "Physical").length;
  document.getElementById("statOnline").textContent = rows.filter(r => r.attendance_mode === "Online").length;

  const today = new Date().toDateString();
  document.getElementById("statToday").textContent = rows.filter(r => new Date(r.created_at).toDateString() === today).length;
}

// === FILTERS ===
const searchInput = document.getElementById("searchInput");
const modeFilter = document.getElementById("modeFilter");
const roleFilter = document.getElementById("roleFilter");

[searchInput, modeFilter, roleFilter].forEach(el => {
  el.addEventListener("input", applyFilters);
  el.addEventListener("change", applyFilters);
});

function applyFilters() {
  const q = searchInput.value.toLowerCase();
  const mode = modeFilter.value;
  const role = roleFilter.value;

  const filtered = allRegistrations.filter(r => {
    const matchSearch = !q ||
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.church_name || "").toLowerCase().includes(q) ||
      (r.expectation || "").toLowerCase().includes(q);
    const matchMode = !mode || r.attendance_mode === mode;
    const matchRole = !role || r.role_in_church === role;
    return matchSearch && matchMode && matchRole;
  });

  renderTable(filtered);
}

// === REFRESH ===
document.getElementById("refreshBtn").addEventListener("click", loadRegistrations);

// === EXPORT CSV ===
document.getElementById("exportBtn").addEventListener("click", () => {
  if (allRegistrations.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = ["#", "Full Name", "Email", "Phone", "Gender", "Age Range", "Country", "State", "City", "Church Name", "Role", "Attendance Mode", "Heard From", "Prayer Request / Expectation", "Subscribed", "Registered At"];
  const rows = allRegistrations.map((r, i) => [
    i + 1,
    r.full_name,
    r.email,
    r.phone,
    r.gender,
    r.age_range,
    r.country,
    r.state,
    r.city,
    r.church_name,
    r.role_in_church,
    r.attendance_mode,
    r.heard_from,
    (r.expectation || "").replace(/\n/g, " "),
    r.subscribe_updates ? "Yes" : "No",
    formatDate(r.created_at),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${(cell ?? "").toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `instructed-scribes-registrations-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

// === HELPERS ===
function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanPhone(phone) {
  if (!phone) return "";
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "234" + p.substring(1);
  return p;
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}