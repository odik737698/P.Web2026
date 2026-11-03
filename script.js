// File: script.js
document.addEventListener("DOMContentLoaded", () => {
    // 1. Ambil elemen DOM
    const todoForm = document.querySelector("#todoForm");
    const taskInput = document.querySelector("#taskInput");
    const inputError = document.querySelector("#inputError");
    const todoList = document.querySelector("#todoList");
    const totalTugas = document.querySelector("#totalTugas");
    const clearCompletedBtn = document.querySelector("#clearCompletedBtn");

    // 2. Fungsi membaca dan menyimpan ke LocalStorage
    const getTasks = () => JSON.parse(localStorage.getItem("todo_tasks")) || [];
    const saveTasks = (tasks) => localStorage.setItem("todo_tasks", JSON.stringify(tasks));

    // 3. Fitur 1: perbarui penghitung jumlah tugas
    const updateTaskCounter = (tasks) => {
        const total = tasks.length;
        const selesai = tasks.filter((task) => task.completed).length;
        const belumSelesai = total - selesai;

        totalTugas.textContent = `Total: ${total} Tugas | Selesai: ${selesai} | Belum Selesai: ${belumSelesai}`;
    };

    // 4. Tampilkan daftar tugas ke layar
    const renderTasks = () => {
        const tasks = getTasks();
        todoList.innerHTML = "";

        updateTaskCounter(tasks);

        if (tasks.length === 0) {
            todoList.innerHTML = "<li class='empty-message'>Belum ada tugas tersimpan.</li>";
            return;
        }

        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            li.className = `todo-item ${task.completed ? "completed" : ""}`;
            li.innerHTML = `
                <span class="todo-text"></span>
                <div class="todo-actions">
                    <button class="action-btn complete-btn" data-index="${index}">
                        ${task.completed ? "Batal" : "Selesai"}
                    </button>
                    <button class="action-btn delete-btn" data-index="${index}">Hapus</button>
                </div>
            `;
            // textContent agar teks tugas ditampilkan sebagai teks biasa (aman dari HTML injection)
            li.querySelector(".todo-text").textContent = task.text;
            todoList.appendChild(li);
        });
    };

    // 5. Tambah tugas saat formulir dikirim
    todoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();

        // Validasi input sederhana
        if (taskText.length < 3) {
            taskInput.classList.add("error");
            inputError.textContent = "Tugas tidak boleh kosong atau kurang dari 3 karakter!";
            inputError.style.display = "block";
            return;
        }

        // Jika valid, hilangkan pesan error
        taskInput.classList.remove("error");
        inputError.style.display = "none";

        // Simpan tugas baru
        const tasks = getTasks();
        tasks.push({ text: taskText, completed: false });
        saveTasks(tasks);
        taskInput.value = "";
        renderTasks();
    });

    // 6. Tombol Selesai dan Hapus (event delegation)
    todoList.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-index]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const tasks = getTasks();

        if (Number.isNaN(index) || !tasks[index]) return;

        if (button.classList.contains("complete-btn")) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks(tasks);
            renderTasks();
        } else if (button.classList.contains("delete-btn")) {
            // Fitur 3: konfirmasi sebelum menghapus tugas
            if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
                tasks.splice(index, 1);
                saveTasks(tasks);
                renderTasks();
            }
        }
    });

    // 7. Fitur 2: hapus hanya tugas yang sudah selesai
    clearCompletedBtn.addEventListener("click", () => {
        const tasks = getTasks();
        const remainingTasks = tasks.filter((task) => !task.completed);

        saveTasks(remainingTasks);
        renderTasks();
    });

    // Render pertama kali saat halaman selesai dimuat
    renderTasks();
});
