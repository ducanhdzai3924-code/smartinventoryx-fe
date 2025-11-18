/* SmartInventoryX — Frontend (Firebase Realtime + BE Connection Stable) */

/* ================= FIREBASE INIT ================= */
(function initFirebase() {
  try {
    // Cấu hình Firebase Web
    const firebaseConfig = {
      apiKey: "AIzaSyCHd8ZWbnOUIMYiQ1sgOUdR2lBjkPt7PxQ",
      databaseURL: "https://quanlykho-6ae1d-default-rtdb.asia-southeast1.firebasedatabase.app",
    };

    // Kiểm tra firebase đã được load chưa
    if (typeof firebase === "undefined") {
      console.error("⚠️ Firebase SDK chưa được load! Kiểm tra lại index.html");
      return;
    }

    // Chỉ khởi tạo 1 lần
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Kết nối Realtime DB
    const db = firebase.database();
   // ================= FIREBASE REALTIME UPDATE =================
const allData = { NHAP_KHO: [], XUAT_KHO: [] };

db.ref("NHAP_KHO").on("value", snap => {
  allData.NHAP_KHO = Object.values(snap.val() || {});
  updateInventory();
});

db.ref("XUAT_KHO").on("value", snap => {
  allData.XUAT_KHO = Object.values(snap.val() || {});
  updateInventory();
});

function updateInventory() {
  inventory = [
    ...allData.NHAP_KHO.map(item => ({
      uid: item.MaLo || "N/A",
      ma_lo: item.MaLo || "N/A",
      ten: item.TenHang || "Không rõ",
      so_luong_con_lai: item.SoLuong || 0,
      ngay_nhap: item.Time || new Date().toISOString(),
      trang_thai: "tồn kho"
    })),
    ...allData.XUAT_KHO.map(item => ({
      uid: item.MaLo || "N/A",
      ma_lo: item.MaLo || "N/A",
      ten: item.TenHang || "Không rõ",
      so_luong_con_lai: item.SoLuong || 0,
      ngay_nhap: item.Time || new Date().toISOString(),
      trang_thai: "đã xuất"
    }))
  ];

  renderStats();
  renderRecent();
  renderStock();
}

  } catch (err) {
    console.error("❌ Firebase init error:", err);
  }
})();
// ================= FIREBASE REALTIME UPDATE =================
const allData = { NHAP_KHO: [], XUAT_KHO: [] };

db.ref("NHAP_KHO").on("value", snap => {
  allData.NHAP_KHO = Object.values(snap.val() || {});
  updateInventory();
});

db.ref("XUAT_KHO").on("value", snap => {
  allData.XUAT_KHO = Object.values(snap.val() || {});
  updateInventory();
});

function updateInventory() {
  inventory = [
    ...allData.NHAP_KHO.map(item => ({
      uid: item.MaLo || "N/A",
      ma_lo: item.MaLo || "N/A",
      ten: item.TenHang || "Không rõ",
      so_luong_con_lai: item.SoLuong || 0,
      ngay_nhap: item.Time || new Date().toISOString(),
      trang_thai: "tồn kho"
    })),
    ...allData.XUAT_KHO.map(item => ({
      uid: item.MaLo || "N/A",
      ma_lo: item.MaLo || "N/A",
      ten: item.TenHang || "Không rõ",
      so_luong_con_lai: item.SoLuong || 0,
      ngay_nhap: item.Time || new Date().toISOString(),
      trang_thai: "đã xuất"
    }))
  ];

  renderStats();
  renderRecent();
  renderStock();
}

/* ================= Config chung ================= */
const API_BASE = "https://smartinventoryx-cloud.onrender.com/api";
const STORAGE_THEME_KEY = "smartinvx_theme";
const STORAGE_SETTINGS_KEY = "smartinvx_settings";

/* ================= DOM helpers ================= */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toast(msg, type = "success", t = 2400) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), t);
}
function busy(on = true) {
  $("#loading")?.classList.toggle("hidden", !on);
}

/* ================= Theme ================= */
function applyTheme(v) {
  if (v === "dark") document.documentElement.classList.add("theme-dark");
  else document.documentElement.classList.remove("theme-dark");
  localStorage.setItem(STORAGE_THEME_KEY, v);
}
function loadTheme() {
  applyTheme(localStorage.getItem(STORAGE_THEME_KEY) || "blue");
}
$("#theme-blue")?.addEventListener("click", () => applyTheme("blue"));
$("#theme-dark")?.addEventListener("click", () => applyTheme("dark"));

/* ================= Navigation ================= */
const VIEWS = ["dashboard", "inbound", "outbound", "stock", "reports", "settings"];

function animateIn(el) {
  if (!el) return;
  el.classList.remove("reveal");
  void el.offsetWidth;
  el.classList.add("reveal");
}
function navigate(view) {
  $$(".view").forEach((v) => v.classList.add("hidden"));
  const target = $(`#view-${view}`);
  if (target) {
    target.classList.remove("hidden");
    animateIn(target);
  }
  $$(".nav-item").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === view)
  );
  if (location.hash !== `#${view}`) history.replaceState({}, "", `#${view}`);
}
window.addEventListener("hashchange", () => {
  const v = (location.hash || "#dashboard").slice(1);
  if (VIEWS.includes(v)) navigate(v);
});
$$(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => navigate(btn.dataset.view))
);
$("#btn-toggle")?.addEventListener("click", () =>
  document.querySelector(".app").classList.toggle("sidebar-closed")
);
$("#open-inbound")?.addEventListener("click", () => navigate("inbound"));
$("#open-outbound")?.addEventListener("click", () => navigate("outbound"));

/* ================= BE Check ================= */
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/hello`);
    const js = await res.json();
    if (js?.message) {
      $("#stat-be").textContent = "Đã kết nối";
      $("#stat-be").style.color = "var(--success)";
      return true;
    }
  } catch {}
  $("#stat-be").textContent = "Không có BE";
  $("#stat-be").style.color = "var(--danger)";
  return false;
}

/* ================= Mock data ================= */
let inventory = [
  { uid: "04A1B2C3", ma_lo: "LO001", ten: "Chuột Logitech", so_luong_con_lai: 120, ngay_nhap: "2025-10-10T08:00:00Z", trang_thai: "tồn kho" },
  { uid: "04A1B2C4", ma_lo: "LO002", ten: "Bàn phím Razer", so_luong_con_lai: 55, ngay_nhap: "2025-10-05T09:30:00Z", trang_thai: "tồn kho" },
];
let historyLogs = [];
// ================= FIREBASE REALTIME =================
const firebaseConfig = {
  apiKey: "AIzaSyCHd8ZWbnOUIMYiQ1sgOUdR2lBjkPt7PxQ",
  databaseURL: "https://quanlykho-6ae1d-default-rtdb.asia-southeast1.firebasedatabase.app"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const allData = { NHAP_KHO: [], XUAT_KHO: [] };

db.ref("NHAP_KHO").on("value", (snap) => {
  allData.NHAP_KHO = Object.values(snap.val() || {});
  updateInventory();
});

db.ref("XUAT_KHO").on("value", (snap) => {
  allData.XUAT_KHO = Object.values(snap.val() || {});
  updateInventory();
});

function updateInventory() {
  inventory = [
    ...allData.NHAP_KHO.map(item => ({
      uid: item.MaLo || "N/A",
      ma_lo: item.MaLo || "N/A",
      ten: item.TenHang || "Không rõ",
      so_luong_con_lai: item.SoLuong || 0,
      ngay_nhap: item.Time || new Date().toISOString(),
      trang_thai: "tồn kho"
    })),
    ...allData.XUAT_KHO.map(item => ({
      uid: item.MaLo || "N/A",
      ma_lo: item.MaLo || "N/A",
      ten: item.TenHang || "Không rõ",
      so_luong_con_lai: item.SoLuong || 0,
      ngay_nhap: item.Time || new Date().toISOString(),
      trang_thai: "đã xuất"
    }))
  ];

  renderStats();
  renderRecent();
  renderStock();
  console.log("🔥 Realtime cập nhật từ Firebase:", inventory.length, "mặt hàng");
}

/* ================= Render helpers ================= */
function staggerList(selector) {
  $$(selector).forEach((row, i) => {
    row.style.animationDelay = i * 30 + "ms";
    row.classList.add("reveal");
  });
}
function renderStats() {
  $("#stat-lots").textContent = inventory.length;
  $("#stat-qty").textContent = inventory.reduce((s, i) => s + (i.so_luong_con_lai || 0), 0);
  const alerts = inventory.filter((i) => {
    const days = Math.floor((Date.now() - new Date(i.ngay_nhap)) / 86400000);
    return i.trang_thai === "tồn kho" && days > 10;
  });
  $("#stat-alerts").textContent = alerts.length;
  staggerList(".card.stat");
}
function renderRecent() {
  const tbody = $("#tbl-recent tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const rows = inventory.slice().sort((a, b) => new Date(b.ngay_nhap) - new Date(a.ngay_nhap));
  rows.forEach((it) => {
    const days = Math.floor((Date.now() - new Date(it.ngay_nhap)) / 86400000);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${it.uid}</td><td>${it.ma_lo}</td><td>${it.ten}</td><td>${it.so_luong_con_lai}</td><td>${new Date(it.ngay_nhap).toLocaleString()}</td><td>${days}</td>`;
    tbody.appendChild(tr);
  });
  staggerList("#tbl-recent tbody tr");
}
function renderStock(filter = "") {
  const tbody = $("#tbl-stock tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  inventory.forEach((i) => {
    if (filter && i.trang_thai !== filter) return;
    const days = Math.floor((Date.now() - new Date(i.ngay_nhap)) / 86400000);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i.uid}</td><td>${i.ma_lo}</td><td>${i.ten}</td><td>${i.so_luong_con_lai}</td><td>${new Date(i.ngay_nhap).toLocaleString()}</td><td>${i.trang_thai}</td><td>${days}</td>`;
    tbody.appendChild(tr);
  });
  staggerList("#tbl-stock tbody tr");
}

/* ================= INIT ================= */
async function init() {
  loadTheme();
  await checkBackend();
  renderStats();
  renderRecent();
  renderStock("");
  navigate("dashboard");
  toast("SmartInventoryX sẵn sàng!");
}
init();
