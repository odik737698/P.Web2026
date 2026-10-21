// File: main.js
// Integrasi Logika Data (CRUD + Cari + Filter) dan Render ke Elemen DOM

const STORAGE_KEY = "projects_data";
const CATEGORIES = ["Web App", "Desktop App", "Mobile App"];

// Data awal (dipakai saat localStorage masih kosong)
const DEFAULT_PROJECTS = [
    { id: 1, title: "Sistem Inventaris Keuangan", category: "Web App", budget: 2500000, completed: true },
    { id: 2, title: "Sistem Kasir Digital POS", category: "Desktop App", budget: 5000000, completed: true },
    { id: 3, title: "Landing Page Profil Perusahaan", category: "Web App", budget: 1500000, completed: false },
    { id: 4, title: "Aplikasi Presensi GPS Mobile", category: "Mobile App", budget: 4500000, completed: false }
];

// ---------- Penyimpanan ----------
const loadProjects = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return DEFAULT_PROJECTS.map(p => ({ ...p }));
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : DEFAULT_PROJECTS.map(p => ({ ...p }));
    } catch (e) {
        return DEFAULT_PROJECTS.map(p => ({ ...p }));
    }
};

const saveProjects = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error("Gagal menyimpan data:", e);
    }
};

// ---------- State ----------
let projects = loadProjects();
let activeCategory = "Semua";
let searchKeyword = "";
let editingId = null;

// ---------- Util ----------
const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka);
};

// Mencegah XSS karena data dari input user dimasukkan lewat innerHTML
const escapeHtml = (str) => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const getNextId = () => projects.reduce((max, p) => Math.max(max, p.id), 0) + 1;

// ---------- Statistik ----------
const updateStats = (dataList) => {
    const totalProjects = dataList.length;
    const totalBudget = dataList.reduce((acc, curr) => acc + curr.budget, 0);
    const completedCount = dataList.filter(item => item.completed).length;

    const elTotal = document.getElementById("stat-total-projects");
    const elBudget = document.getElementById("stat-total-budget");
    const elDone = document.getElementById("stat-completed-projects");

    if (elTotal) elTotal.textContent = totalProjects;
    if (elBudget) elBudget.textContent = formatRupiah(totalBudget);
    if (elDone) elDone.textContent = completedCount;
};

// ---------- READ: render daftar ----------
const renderProjects = (filteredList) => {
    const container = document.getElementById("project-list");

    if (!container) return;

    if (filteredList.length === 0) {
        const pesan = projects.length === 0
            ? "Belum ada proyek. Tambahkan proyek pertama lewat form di atas."
            : "Tidak ada proyek yang cocok dengan kategori/pencarian ini.";
        container.innerHTML = `<p style='text-align: center; color: #64748b; padding: 20px;'>${pesan}</p>`;
        return;
    }

    const htmlString = filteredList.map(proj => {
        const badgeClass = proj.completed ? "badge-success" : "badge-pending";
        const statusText = proj.completed ? "Selesai" : "Dalam Pengerjaan";

        return `
            <div class="project-card">
                <div class="project-info">
                    <span class="project-category">${escapeHtml(proj.category)}</span>
                    <h4>${escapeHtml(proj.title)}</h4>
                    <p class="project-budget">${formatRupiah(proj.budget)}</p>
                </div>
                <div>
                    <span class="badge ${badgeClass}">${statusText}</span>
                    <div class="project-actions" style="margin-top: 10px; display: flex; gap: 6px; justify-content: flex-end;">
                        <button type="button" class="btn-edit" data-action="edit" data-id="${proj.id}" style="cursor:pointer; padding:4px 10px;">Ubah</button>
                        <button type="button" class="btn-delete" data-action="delete" data-id="${proj.id}" style="cursor:pointer; padding:4px 10px;">Hapus</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = htmlString;
};

// ---------- Gabungan filter kategori + pencarian ----------
const getVisibleProjects = () => {
    const keyword = searchKeyword.trim().toLowerCase();

    return projects.filter(p => {
        const matchCategory = activeCategory === "Semua" || p.category === activeCategory;
        if (!matchCategory) return false;
        if (keyword === "") return true;

        const statusText = p.completed ? "selesai" : "dalam pengerjaan";
        const haystack = [p.title, p.category, statusText, String(p.budget), formatRupiah(p.budget)]
            .join(" ")
            .toLowerCase();
        return haystack.includes(keyword);
    });
};

const refresh = () => {
    const visible = getVisibleProjects();
    renderProjects(visible);
    updateStats(projects);

    const info = document.getElementById("search-info");
    if (info) {
        info.textContent = `Menampilkan ${visible.length} dari ${projects.length} proyek.`;
    }
};

// ---------- UI form + pencarian (disisipkan lewat JS) ----------
const injectUI = () => {
    if (document.getElementById("project-form")) return; // jika sudah ada di HTML, pakai itu

    const container = document.getElementById("project-list");
    if (!container) return;

    const categoryOptions = CATEGORIES
        .map(c => `<option value="${c}">${c}</option>`)
        .join("");

    const wrapper = document.createElement("div");
    wrapper.id = "crud-panel";
    wrapper.innerHTML = `
        <form id="project-form" novalidate style="margin-bottom: 16px; display: grid; gap: 10px;">
            <h3 id="form-title" style="margin: 0;">Tambah Proyek Baru</h3>

            <label>Judul Proyek
                <input type="text" id="input-title" placeholder="Contoh: Aplikasi Rental Mobil" style="width:100%; padding:8px; box-sizing:border-box;">
            </label>

            <label>Kategori
                <select id="input-category" style="width:100%; padding:8px; box-sizing:border-box;">${categoryOptions}</select>
            </label>

            <label>Budget (Rp)
                <input type="number" id="input-budget" min="0" step="1000" placeholder="Contoh: 3000000" style="width:100%; padding:8px; box-sizing:border-box;">
            </label>

            <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="input-completed"> Proyek sudah selesai
            </label>

            <p id="form-error" role="alert" style="color:#b00020; margin:0; min-height:1.2em;"></p>

            <div style="display:flex; gap:8px;">
                <button type="submit" id="btn-submit" style="cursor:pointer; padding:8px 16px;">Simpan Proyek</button>
                <button type="button" id="btn-cancel" hidden style="cursor:pointer; padding:8px 16px;">Batal Ubah</button>
            </div>
        </form>

        <div style="margin-bottom: 8px;">
            <input type="search" id="search-input" placeholder="Cari proyek (judul, kategori, status, budget)..." style="width:100%; padding:8px; box-sizing:border-box;">
            <small id="search-info" style="color:#64748b;"></small>
        </div>
    `;

    container.parentNode.insertBefore(wrapper, container);
};

// ---------- CREATE & UPDATE ----------
const resetForm = () => {
    const form = document.getElementById("project-form");
    if (!form) return;
    form.reset();
    editingId = null;
    document.getElementById("form-title").textContent = "Tambah Proyek Baru";
    document.getElementById("btn-submit").textContent = "Simpan Proyek";
    document.getElementById("btn-cancel").hidden = true;
    document.getElementById("form-error").textContent = "";
};

const handleSubmit = (e) => {
    e.preventDefault();

    const title = document.getElementById("input-title").value.trim();
    const category = document.getElementById("input-category").value;
    const budgetRaw = document.getElementById("input-budget").value;
    const completed = document.getElementById("input-completed").checked;
    const errorEl = document.getElementById("form-error");

    const budget = Number(budgetRaw);

    if (title === "") {
        errorEl.textContent = "Judul proyek wajib diisi.";
        return;
    }
    if (budgetRaw === "" || isNaN(budget) || budget < 0) {
        errorEl.textContent = "Budget wajib diisi dengan angka 0 atau lebih.";
        return;
    }

    if (editingId === null) {
        // CREATE
        projects.push({ id: getNextId(), title, category, budget, completed });
    } else {
        // UPDATE
        const target = projects.find(p => p.id === editingId);
        if (target) {
            target.title = title;
            target.category = category;
            target.budget = budget;
            target.completed = completed;
        }
    }

    saveProjects();
    resetForm();
    refresh();
};

const startEdit = (id) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;

    editingId = id;
    document.getElementById("input-title").value = target.title;
    document.getElementById("input-category").value = target.category;
    document.getElementById("input-budget").value = target.budget;
    document.getElementById("input-completed").checked = target.completed;
    document.getElementById("form-title").textContent = "Ubah Proyek";
    document.getElementById("btn-submit").textContent = "Simpan Perubahan";
    document.getElementById("btn-cancel").hidden = false;
    document.getElementById("form-error").textContent = "";

    document.getElementById("project-form").scrollIntoView({ behavior: "smooth" });
    document.getElementById("input-title").focus();
};

// ---------- DELETE ----------
const deleteProject = (id) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    if (!confirm(`Hapus proyek "${target.title}"?`)) return;

    projects = projects.filter(p => p.id !== id);
    if (editingId === id) resetForm();

    saveProjects();
    refresh();
};

// ---------- Inisialisasi ----------
document.addEventListener("DOMContentLoaded", () => {
    injectUI();
    refresh();

    // Form tambah/ubah
    const form = document.getElementById("project-form");
    if (form) form.addEventListener("submit", handleSubmit);

    const btnCancel = document.getElementById("btn-cancel");
    if (btnCancel) btnCancel.addEventListener("click", resetForm);

    // Pencarian real-time
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchKeyword = e.target.value;
            refresh();
        });
    }

    // Tombol Ubah / Hapus (event delegation)
    const container = document.getElementById("project-list");
    if (container) {
        container.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-action]");
            if (!btn) return;
            const id = Number(btn.getAttribute("data-id"));
            if (btn.getAttribute("data-action") === "edit") startEdit(id);
            if (btn.getAttribute("data-action") === "delete") deleteProject(id);
        });
    }

    // Filter kategori (tetap berfungsi, kini digabung dengan pencarian)
    const filterButtons = document.querySelectorAll(".btn-filter");

    filterButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterButtons.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");

            activeCategory = e.currentTarget.getAttribute("data-category");
            refresh();
        });
    });
});
