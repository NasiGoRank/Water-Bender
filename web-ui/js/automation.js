const API_URL = "https://water-bender-service.onrender.com/api/schedules";

// --- 1. LOGIKA TAMPILAN INPUT (FIXED) ---
// Pastikan elemen ada sebelum menambah event listener
const typeSelect = document.getElementById("type");

if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
        const type = e.target.value;

        // Helper function untuk hide/show
        const toggle = (id, show) => {
            const el = document.getElementById(id);
            if (el) {
                if (show) {
                    el.classList.remove("hidden");
                    // Sedikit delay untuk animasi halus jika mau
                } else {
                    el.classList.add("hidden");
                }
            }
        };

        toggle("datetimeField", type === "once");
        toggle("dailyField", type === "daily");
        toggle("hourlyField", type === "hourly");
        toggle("weeklyField", type === "weekly");
    });

    // Trigger saat load pertama kali untuk set state awal
    typeSelect.dispatchEvent(new Event('change'));
}

// --- 2. SUBMIT SCHEDULE ---
const form = document.getElementById("scheduleForm");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Ambil nilai-nilai
        const type = document.getElementById("type").value;
        const duration = document.getElementById("duration").value;
        const keep_after_run = document.getElementById("keepAfterRun").checked ? 1 : 0;

        let payload = { type, duration, keep_after_run };

        // Isi payload sesuai tipe
        if (type === "once") payload.datetime = document.getElementById("datetime").value;
        if (type === "daily") payload.datetime = document.getElementById("dailyTime").value;
        if (type === "hourly") payload.repeat_interval = document.getElementById("interval").value;
        if (type === "weekly") {
            payload.weekday = document.getElementById("weekday").value;
            payload.datetime = document.getElementById("weeklyTime").value;
        }

        // Validasi sederhana
        if (!payload.duration) return alert("Duration is required");

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (window.Toast) window.Toast.success("Schedule added!");
                form.reset();
                // Reset type ke 'once' manual agar UI refresh
                document.getElementById("type").value = "once";
                document.getElementById("type").dispatchEvent(new Event('change'));

                loadSchedules();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "Failed to add"));
            }
        } catch (err) {
            console.error(err);
            alert("Connection Error");
        }
    });
}

// --- 3. AI BUTTON ---
const aiBtn = document.getElementById("autoScheduleBtn");
if (aiBtn) {
    aiBtn.addEventListener("click", async (e) => {
        const btn = e.target.closest('button'); // Pastikan targetnya tombol
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Generating...`;

        try {
            const soil = 40; // Bisa ambil dari dashboard jika ada, hardcode dulu aman
            const rain = 10;
            const locationQuery = localStorage.getItem('esp_public_ip') || 'Jakarta';

            const res = await fetch("https://water-bender-service.onrender.com/api/auto-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ soil, rain, location: locationQuery })
            });

            const data = await res.json();

            if (data.success) {
                if (window.Toast) window.Toast.success(`AI generated ${data.generated || 0} schedules!`);
                loadSchedules();
            } else {
                alert(data.message || "No schedule needed.");
            }
        } catch (err) {
            console.error("AI Error:", err);
            alert("AI Service Unavailable");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// --- 4. LOAD LIST (Responsive Card) ---
async function loadSchedules() {
    const container = document.getElementById("scheduleListContainer");
    if (!container) return;

    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 border-2 border-dashed border-gray-700/50 rounded-2xl text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-3 opacity-50"></i>
                    <p>No active schedules.</p>
                </div>`;
            return;
        }

        data.forEach(s => {
            let pattern = "-";
            let icon = "fa-clock";
            let typeColor = "text-gray-300 bg-gray-700";

            if (s.type === "once") {
                pattern = new Date(s.datetime).toLocaleString();
                icon = "fa-hourglass-start";
                typeColor = "text-blue-300 bg-blue-900/30 border border-blue-700/50";
            } else if (s.type === "daily") {
                pattern = `Daily at ${s.datetime}`;
                icon = "fa-calendar-day";
                typeColor = "text-green-300 bg-green-900/30 border border-green-700/50";
            } else if (s.type === "hourly") {
                pattern = `Every ${s.repeat_interval} hour(s)`;
                icon = "fa-history";
                typeColor = "text-purple-300 bg-purple-900/30 border border-purple-700/50";
            } else if (s.type === "weekly") {
                pattern = `${s.weekday} @ ${s.datetime}`;
                icon = "fa-calendar-week";
                typeColor = "text-orange-300 bg-orange-900/30 border border-orange-700/50";
            }

            const item = document.createElement("div");
            item.className = "relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:bg-gray-800/60 transition gap-4 group";

            item.innerHTML = `
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center shrink-0">
                        <i class="fas ${icon} text-gray-400 group-hover:text-white transition"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${typeColor}">${s.type}</span>
                            ${s.keep_after_run ? '<i class="fas fa-infinity text-xs text-gray-500" title="Kept after run"></i>' : ''}
                        </div>
                        <p class="text-sm text-gray-300 font-medium truncate">${pattern}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between w-full md:w-auto gap-6 pl-14 md:pl-0 border-t md:border-0 border-gray-700/30 pt-3 md:pt-0">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-gray-500 uppercase font-bold">Duration</span>
                        <span class="text-sm font-mono text-white">${s.duration}m</span>
                    </div>
                    
                    <button onclick="deleteSchedule(${s.id})" 
                        class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition" 
                        title="Delete Schedule">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        console.error("Load Error:", err);
    }
}

// --- Delete ---
window.deleteSchedule = async (id) => {
    if (confirm("Delete this schedule?")) {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        loadSchedules();
    }
};

// Init
document.addEventListener("DOMContentLoaded", loadSchedules);