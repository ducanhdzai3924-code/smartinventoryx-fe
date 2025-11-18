/* SmartInventoryX — Frontend (Nav mượt + Animation + Kết nối BE) */

/* ================== Config ================== */
// Cấu hình Firebase (lấy từ BE)
const firebaseConfig = {
  apiKey: "AIzaSyCHd8ZWbnOUIMYiQ1sgOUdR2lBjkPt7PxQ",
  databaseURL: "https://quanlykho-6ae1d-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Khởi tạo app
firebase.initializeApp(firebaseConfig);

// Lấy instance database
const db = firebase.database();

// Lắng nghe dữ liệu từ node "XUAT_KHO"
db.ref("XUAT_KHO").on("value", (snapshot) => {
  const data = snapshot.val();
  console.log("Realtime update:", data);
});


firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Lắng nghe dữ liệu Realtime
db.ref("logs").on("value", (snapshot) => {
  const data = snapshot.val() || {};
  const logs = Object.values(data);
  const tbody = document.querySelector("#tbl-stock tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  logs.reverse().forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.uid}</td>
      <td>${item.action}</td>
      <td>${new Date(item.time).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  console.log("Realtime update:", logs.length, "records");
});

/* ================== DOM helpers ================== */
const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));
const sleep = (ms)=> new Promise(r=>setTimeout(r, ms));

function toast(msg, type='success', t=2400){
  const el = $('#toast'); if(!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  setTimeout(()=> el.classList.add('hidden'), t);
}
function busy(on=true){ $('#loading')?.classList.toggle('hidden', !on); }

/* ================== Theme ================== */
function applyTheme(v){
  if(v==='dark') document.documentElement.classList.add('theme-dark');
  else document.documentElement.classList.remove('theme-dark');
  localStorage.setItem(STORAGE_THEME_KEY, v);
}
function loadTheme(){ applyTheme(localStorage.getItem(STORAGE_THEME_KEY) || 'blue'); }
$('#theme-blue')?.addEventListener('click', ()=>applyTheme('blue'));
$('#theme-dark')?.addEventListener('click', ()=>applyTheme('dark'));

/* ================== Navigation ================== */
const VIEWS = ['dashboard','inbound','outbound','stock','reports','settings'];

function animateIn(el){
  if(!el) return; el.classList.remove('reveal'); void el.offsetWidth; el.classList.add('reveal');
}
function navigate(view){
  $$('.view').forEach(v => v.classList.add('hidden'));
  const target = $(`#view-${view}`); if(target){ target.classList.remove('hidden'); animateIn(target); }
  $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  if (location.hash !== `#${view}`) history.replaceState({}, '', `#${view}`);
}
window.addEventListener('hashchange', ()=>{ const v=(location.hash||'#dashboard').slice(1); if(VIEWS.includes(v)) navigate(v); });
$$('.nav-item').forEach(btn=> btn.addEventListener('click', ()=> navigate(btn.dataset.view)));
$('#btn-toggle')?.addEventListener('click', ()=> document.querySelector('.app').classList.toggle('sidebar-closed'));
$('#open-inbound')?.addEventListener('click', ()=> navigate('inbound'));
$('#open-outbound')?.addEventListener('click', ()=> navigate('outbound'));

/* ================== BE Check ================== */
async function checkBackend(){
  try{
    const res = await fetch(`${API_BASE}/hello`);
    const js  = await res.json();
    if(js?.message){
      $('#stat-be').textContent = 'Đã kết nối';
      $('#stat-be').style.color = 'var(--success)';
      return true;
    }
  }catch{}
  $('#stat-be').textContent = 'Không có BE';
  $('#stat-be').style.color = 'var(--danger)';
  return false;
}

/* ================== Mock data ================== */
let inventory = [
  { uid: '04A1B2C3', ma_lo: 'LO001', ten: 'Chuột Logitech', so_luong_con_lai: 120, ngay_nhap: '2025-10-10T08:00:00Z', trang_thai: 'tồn kho' },
  { uid: '04A1B2C4', ma_lo: 'LO002', ten: 'Bàn phím Razer',  so_luong_con_lai: 55,  ngay_nhap: '2025-10-05T09:30:00Z', trang_thai: 'tồn kho' },
  { uid: '04A1B2C5', ma_lo: 'LO003', ten: 'Tai nghe Sony',   so_luong_con_lai: 20,  ngay_nhap: '2025-09-28T11:15:00Z', trang_thai: 'tồn kho' },
];
let historyLogs = [];

/* ================== Render helpers ================== */
function staggerList(selector){
  $$(selector).forEach((row, i)=>{ row.style.animationDelay = (i*30)+'ms'; row.classList.add('reveal'); });
}
function renderStats(){
  $('#stat-lots').textContent = inventory.length;
  $('#stat-qty').textContent  = inventory.reduce((s,i)=> s + (i.so_luong_con_lai||0), 0);
  const alerts = inventory.filter(i => {
    const days = Math.floor((Date.now() - new Date(i.ngay_nhap)) / 86400000);
    return i.trang_thai==='tồn kho' && days > 10;
  });
  $('#stat-alerts').textContent = alerts.length;
  staggerList('.card.stat');
}
function renderRecent(){
  const tbody = $('#tbl-recent tbody'); if(!tbody) return;
  tbody.innerHTML = '';
  const rows = inventory.slice().sort((a,b)=> new Date(b.ngay_nhap)-new Date(a.ngay_nhap));
  rows.forEach(it=>{
    const days = Math.floor((Date.now() - new Date(it.ngay_nhap)) / 86400000);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.uid}</td><td>${it.ma_lo}</td><td>${it.ten}</td><td>${it.so_luong_con_lai}</td><td>${new Date(it.ngay_nhap).toLocaleString()}</td><td>${days}</td>`;
    tbody.appendChild(tr);
  });
  staggerList('#tbl-recent tbody tr');
}
function renderStock(filter=''){
  const tbody = $('#tbl-stock tbody'); if(!tbody) return;
  tbody.innerHTML = '';
  inventory.forEach(i=>{
    if(filter && i.trang_thai !== filter) return;
    const days = Math.floor((Date.now() - new Date(i.ngay_nhap)) / 86400000);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i.uid}</td><td>${i.ma_lo}</td><td>${i.ten}</td><td>${i.so_luong_con_lai}</td><td>${new Date(i.ngay_nhap).toLocaleString()}</td><td>${i.trang_thai}</td><td>${days}</td>`;
    tbody.appendChild(tr);
  });
  staggerList('#tbl-stock tbody tr');
}

/* ================== Chart ================== */
let chart;
function initChart(){
  const ctx = $('#chart-inventory')?.getContext('2d'); if(!ctx) return;
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type:'bar',
    data:{
      labels: inventory.map(i=>i.ten),
      datasets:[{ label:'Số lượng tồn', data: inventory.map(i=>i.so_luong_con_lai), backgroundColor:'rgba(37,99,235,0.9)' }]
    },
    options:{ responsive:true, plugins:{ legend:{ display:false }}, scales:{ y:{ beginAtZero:true } } }
  });
}
function updateChart(){ if(!chart) return; chart.data.labels=inventory.map(i=>i.ten); chart.data.datasets[0].data=inventory.map(i=>i.so_luong_con_lai); chart.update(); }
$('#btn-refresh-chart')?.addEventListener('click', ()=>{ updateChart(); toast('Đã làm mới biểu đồ'); });

/* ================== API helpers ================== */
async function apiPost(path, body){
  try{
    const res = await fetch(API_BASE + path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    return await res.json();
  }catch(e){ console.warn('BE unavailable', e); return null; }
}
async function apiGet(path){
  try{ const res = await fetch(API_BASE + path); return await res.json(); }
  catch(e){ console.warn('BE unavailable', e); return null; }
}

/* ================== Actions: nhập / xuất ================== */
$('#btn-in')?.addEventListener('click', async ()=>{
  const uid  = $('#in-uid').value.trim();
  const lo   = $('#in-lo').value.trim();
  const ten  = $('#in-name').value.trim();
  const sl   = parseInt($('#in-qty').value||'0',10);
  const user = $('#in-user').value.trim() || 'unknown';
  if(!uid||!lo||!ten||!sl) return toast('Điền đủ thông tin!', 'error');

  busy(true);
  try{
    inventory.unshift({ uid, ma_lo:lo, ten, so_luong_con_lai: sl, ngay_nhap: new Date().toISOString(), trang_thai:'tồn kho' });
    historyLogs.unshift({ time: new Date().toLocaleString(), uid, ma_lo:lo, ten, so_luong:sl, trang_thai: 'nhập kho', nguoi: user });
    renderStats(); renderRecent(); renderStock($('#filter-status')?.value||''); updateChart();
    toast('Đã nhập kho');
    await apiPost('/add', { uid, ma_lo:lo, ten, so_luong:sl, nguoi:user });
  } finally {
    busy(false);
    $('#in-uid').value = $('#in-lo').value = $('#in-name').value = $('#in-qty').value = $('#in-user').value = '';
  }
});

$('#btn-out')?.addEventListener('click', async ()=>{
  const uid  = $('#out-uid').value.trim();
  const qty  = parseInt($('#out-qty').value||'0',10);
  const user = $('#out-user').value.trim() || 'unknown';
  if(!uid||!qty) return toast('Điền UID & số lượng xuất!', 'error');

  busy(true);
  try{
    const idx = inventory.findIndex(i=> i.uid === uid);
    if(idx === -1){ toast('Không tìm thấy UID', 'error'); return; }
    const item = inventory[idx];
    item.so_luong_con_lai = Math.max(0, item.so_luong_con_lai - qty);
    item.trang_thai = item.so_luong_con_lai === 0 ? 'đã xuất hết' : 'tồn kho';
    historyLogs.unshift({ time:new Date().toLocaleString(), uid:item.uid, ma_lo:item.ma_lo, ten:item.ten, so_luong:qty, trang_thai:'xuất kho', nguoi:user });
    renderStats(); renderRecent(); renderStock($('#filter-status')?.value||''); updateChart();
    toast('Đã xuất kho');
    await apiPost('/out', { uid, qty, nguoi:user });
  } finally {
    busy(false);
    $('#out-uid').value = $('#out-qty').value = $('#out-user').value = '';
  }
});

/* ================== Search / Filter / Export ================== */
$('#search')?.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  const tbody = $('#tbl-stock tbody'); if(!tbody) return;
  if(!q){ renderStock($('#filter-status')?.value||''); return; }
  tbody.innerHTML = '';
  inventory.forEach(i=>{
    const text = `${i.uid} ${i.ma_lo} ${i.ten}`.toLowerCase();
    if(text.includes(q)){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i.uid}</td><td>${i.ma_lo}</td><td>${i.ten}</td><td>${i.so_luong_con_lai}</td><td>${new Date(i.ngay_nhap).toLocaleString()}</td><td>${i.trang_thai}</td><td>${Math.floor((Date.now()-new Date(i.ngay_nhap))/86400000)}</td>`;
      tbody.appendChild(tr);
    }
  });
  staggerList('#tbl-stock tbody tr');
});
$('#filter-status')?.addEventListener('change', (e)=> renderStock(e.target.value));
$('#refresh')?.addEventListener('click', ()=>{ renderStats(); renderRecent(); renderStock($('#filter-status')?.value||''); updateChart(); toast('Đã làm mới'); });

$('#export-csv')?.addEventListener('click', ()=>{
  const rows = [['UID','Mã lô','Tên','Số lượng','Ngày nhập','Trạng thái']];
  inventory.forEach(i=> rows.push([i.uid, i.ma_lo, i.ten, i.so_luong_con_lai, i.ngay_nhap, i.trang_thai]));
  const csv = rows.map(r=> r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click(); URL.revokeObjectURL(url);
  toast('Đã xuất CSV');
});

/* ================== Settings ================== */
$('#save-settings')?.addEventListener('click', ()=>{
  const defaultTheme = $('#default-theme').value;
  const threshold = parseInt($('#threshold-day').value||'10',10);
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify({ defaultTheme, threshold }));
  applyTheme(defaultTheme); toast('Đã lưu cài đặt');
});
// ================== LẤY DỮ LIỆU REALTIME TỪ BE ==================
async function fetchRealtime() {
  try {
    const res = await fetch(`${API_BASE}/realtime`);
    const js = await res.json();
    if (js.ok) {
      console.log("🔥 Dữ liệu realtime:", js);

      // Gộp dữ liệu NHAP_KHO và XUAT_KHO lại
      inventory = [];

      js.NHAP_KHO.forEach(item => {
        inventory.push({
          uid: item.MaLo || "N/A",
          ma_lo: item.MaLo || "N/A",
          ten: item.TenHang || "Không rõ",
          so_luong_con_lai: item.SoLuong || 0,
          ngay_nhap: item.Time || new Date().toISOString(),
          trang_thai: "tồn kho"
        });
      });

      js.XUAT_KHO.forEach(item => {
        inventory.push({
          uid: item.MaLo || "N/A",
          ma_lo: item.MaLo || "N/A",
          ten: item.TenHang || "Không rõ",
          so_luong_con_lai: item.SoLuong || 0,
          ngay_nhap: item.Time || new Date().toISOString(),
          trang_thai: "đã xuất"
        });
      });

      renderStats();
      renderRecent();
      renderStock();
      updateChart();
      toast("Đã cập nhật dữ liệu Firebase!");
    }
  } catch (e) {
    console.error("❌ Lỗi lấy dữ liệu realtime:", e);
  }
}

/* ================== Login popup ================== */
function showLogin(){
  const box = document.createElement('div');
  box.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:3000;">
      <div style="background:var(--panel);padding:20px;border-radius:12px;width:320px;box-shadow:var(--card-shadow);">
        <h3 style="margin-top:0">Đăng nhập hệ thống</h3>
        <input id="lg-user" placeholder="Tài khoản (admin)" style="width:100%;margin-bottom:8px;padding:10px;border-radius:10px;border:1px solid rgba(0,0,0,0.1)">
        <input id="lg-pass" type="password" placeholder="Mật khẩu (123456)" style="width:100%;margin-bottom:8px;padding:10px;border-radius:10px;border:1px solid rgba(0,0,0,0.1)">
        <button id="lg-btn" class="btn primary" style="width:100%">Đăng nhập</button>
        <div id="lg-msg" style="font-size:12px;color:var(--danger);margin-top:8px;"></div>
      </div>
    </div>`;
  document.body.appendChild(box);

  const setMsg = (t='') => { const m = document.getElementById('lg-msg'); if (m) m.textContent = t; };

  $('#lg-btn').onclick = async ()=>{
    const u = $('#lg-user').value.trim();
    const p = $('#lg-pass').value.trim();
    setMsg(''); if(!u || !p){ setMsg('Nhập đủ thông tin'); return; }

    try{
      const helloRes = await fetch(`${API_BASE}/hello`);
      if(!helloRes.ok){ setMsg(`BE HTTP ${helloRes.status} ở /hello`); return; }

      const res = await fetch(`${API_BASE}/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username:u, password:p })
      });
      let data = {}; try{ data = await res.json(); }catch{}
      if(!res.ok){ setMsg(`BE HTTP ${res.status} ở /login`); return; }
      if(!data.success){ setMsg(data.message || 'Sai tài khoản hoặc mật khẩu'); return; }

      const who = $('#whoami'); if (who) who.textContent = `${data.user.username} (${data.user.role})`;
      document.body.removeChild(box);
      toast('Đăng nhập thành công');
    }catch(e){
      console.error('LOGIN ERROR', e);
      setMsg('Không kết nối được BE');
    }
  };
}

/* ================== INIT ================== */
async function init(){
  loadTheme();
  await checkBackend();
  renderStats(); renderRecent(); renderStock(''); initChart();
  const first = (location.hash || '#dashboard').slice(1);
  navigate(VIEWS.includes(first) ? first : 'dashboard');
  showLogin(); // bật popup login
}
init();
