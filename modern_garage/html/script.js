let selectedVehicle = null;
let selectedEl = null;
let lightsOn = false;
let spawnAvailable = true;
let lightsEligible = false;

function clearSelection() {
    selectedVehicle = null;
    if (selectedEl) selectedEl.classList.remove("selected");
    selectedEl = null;
    const spawnBtn = document.getElementById("spawn-btn");
    if (spawnBtn) spawnBtn.disabled = true;
    const lightsBtn = document.getElementById("lights-btn");
    if (lightsBtn) {
        lightsEligible = false;
        lightsBtn.disabled = true;
        // Show the action label (what will happen on click): default state is OFF, so offer to turn ON
        lightsBtn.textContent = "Lights On";
    }
}

function buildDivisions(divisions) {
    const container = document.getElementById("divisions-list");
    const emptyNote = document.getElementById("empty-note");
    container.innerHTML = "";
    clearSelection();

    if (!divisions || divisions.length === 0) {
        if (emptyNote) emptyNote.style.display = "block";
        return;
    }
    if (emptyNote) emptyNote.style.display = "none";

    divisions.forEach((d, idx) => {
        const wrapper = document.createElement("div");
        wrapper.className = "division";

        const header = document.createElement("div");
        header.className = "division-header";
        header.innerText = d.label || `Division ${idx+1}`;

        const body = document.createElement("div");
        body.className = "division-body";
        body.style.display = "none"; // collapsed by default

        // Toggle
        header.onclick = () => {
            const isOpen = body.style.display === "block";
            body.style.display = isOpen ? "none" : "block";
            header.classList.toggle("open", !isOpen);
        };

        // Populate vehicles
        (d.vehicles || []).forEach(v => {
            const item = document.createElement("div");
            item.className = "vehicle";
            item.innerText = `${v.name || v.model}`;
            item.onclick = (e) => {
                e.stopPropagation();
                if (selectedEl) selectedEl.classList.remove("selected");
                selectedEl = item;
                item.classList.add("selected");
                selectedVehicle = v;
                const spawnBtn = document.getElementById("spawn-btn");
                if (spawnBtn) spawnBtn.disabled = !spawnAvailable;
                const lightsBtn = document.getElementById("lights-btn");
                if (lightsBtn) {
                    // Disable until client confirms eligibility for this model
                    lightsEligible = false;
                    lightsBtn.disabled = true;
                    // Show action label (what clicking will do) based on current lightsOn state
                    lightsBtn.textContent = lightsOn ? "Lights Off" : "Lights On";
                }

                fetch(`https://${GetParentResourceName()}/previewVehicle`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(v)
                });

                // If lights were left on, re-apply to the new preview
                if (lightsOn) {
                    fetch(`https://${GetParentResourceName()}/toggleLights`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ on: true })
                    });
                }
            };
            body.appendChild(item);
        });

        wrapper.appendChild(header);
        wrapper.appendChild(body);
        container.appendChild(wrapper);

        // Auto-open first division
        if (idx === 0) header.click();
    });
}

window.addEventListener("message", (event) => {
    if (event.data.action === "open") {
        const ui = document.getElementById("garage-ui");
        ui.style.display = "block";
        // Set dynamic header from payload (garage name and optional station)
        const hdr = document.getElementById("garage-header");
        if (hdr) {
            const g = event.data.garageName || "Garage";
            const st = event.data.station ? ` — ${event.data.station}` : "";
            hdr.textContent = `${g}${st}`;
        }
        // Reset lights toggle on open
        lightsOn = false;
        lightsEligible = false;
        spawnAvailable = true; // default until we get a status update from client
        const warn = document.getElementById("spawn-full");
        if (warn) warn.style.display = "none";
        const lightsBtn = document.getElementById("lights-btn");
        if (lightsBtn) { lightsBtn.textContent = "Lights On"; lightsBtn.disabled = true; }
        buildDivisions(event.data.divisions || []);
    }

    if (event.data.action === "close") {
        const ui = document.getElementById("garage-ui");
        const container = document.getElementById("divisions-list");
        if (container) container.innerHTML = "";
        ui.style.display = "none";
        clearSelection();
        const emptyNote = document.getElementById("empty-note");
        if (emptyNote) emptyNote.style.display = "none";
        // Reset lights state
        lightsOn = false;
        const warn = document.getElementById("spawn-full");
        if (warn) warn.style.display = "none";
    }

    if (event.data.action === "spawnStatus") {
        spawnAvailable = !!event.data.available;
        const spawnBtn = document.getElementById("spawn-btn");
        if (spawnBtn) {
            // Enabled only when a vehicle is selected and there is availability
            spawnBtn.disabled = !selectedVehicle || !spawnAvailable;
        }
        const warn = document.getElementById("spawn-full");
        if (warn) warn.style.display = spawnAvailable ? "none" : "block";
    }

    if (event.data.action === "lightsEligible") {
        // Server/client told us if current preview can use lights (class 18 only)
        lightsEligible = !!event.data.eligible;
        if (typeof event.data.lightsOn !== 'undefined') {
            lightsOn = !!event.data.lightsOn;
        }
        const lightsBtn = document.getElementById("lights-btn");
        if (lightsBtn) {
            lightsBtn.disabled = !lightsEligible || !selectedVehicle;
            lightsBtn.textContent = lightsOn ? "Lights Off" : "Lights On";
        }
    }
});

document.getElementById("spawn-btn").onclick = () => {
    if (!selectedVehicle) return;
    const btn = document.getElementById("spawn-btn");
    btn.disabled = true; // prevent double submissions
    fetch(`https://${GetParentResourceName()}/spawnVehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedVehicle)
    }).finally(() => {
        setTimeout(() => { if (document.getElementById("garage-ui").style.display !== "none") btn.disabled = false; }, 500);
    });
};

document.getElementById("close-btn").onclick = () => {
    fetch(`https://${GetParentResourceName()}/close`, { method: "POST" });
    document.getElementById("garage-ui").style.display = "none";
};

document.getElementById("lights-btn").onclick = () => {
    const btn = document.getElementById("lights-btn");
    if (!selectedVehicle || !btn || !lightsEligible) return;
    lightsOn = !lightsOn;
    // Show action label after toggle
    btn.textContent = lightsOn ? "Lights Off" : "Lights On";
    fetch(`https://${GetParentResourceName()}/toggleLights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: lightsOn })
    });
};
