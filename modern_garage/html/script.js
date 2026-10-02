let selectedVehicle = null;
let selectedEl = null;
let lightsOn = false;
let spawnAvailable = true;
let lightsEligible = false;
// Player's customization picks for the selected vehicle: { livery, colors: { key: id }, extras: { id: on }, mods: { type: index } }
let customSelection = {};

function nuiPost(name, body) {
    return fetch(`https://${GetParentResourceName()}/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
    });
}

function resetCustomize() {
    customSelection = {};
    const panel = document.getElementById("customize-ui");
    if (panel) panel.style.display = "none";
    const body = document.getElementById("customize-body");
    if (body) body.innerHTML = "";
}

// Shape sent to Lua: arrays instead of objects keyed by number, so ids survive JSON intact
function buildSelectionPayload() {
    const out = {};
    if (customSelection.livery !== undefined) out.livery = customSelection.livery;
    if (customSelection.colors) out.colors = customSelection.colors;
    if (customSelection.extras) {
        out.extras = Object.entries(customSelection.extras).map(([id, on]) => ({ id: Number(id), on }));
    }
    if (customSelection.mods) {
        out.mods = Object.entries(customSelection.mods).map(([type, index]) => ({ type: Number(type), index }));
    }
    return out;
}

function sendCustomize() {
    nuiPost("customizePreview", { selection: buildSelectionPayload() });
}

function addSection(container, title) {
    const section = document.createElement("div");
    section.className = "custom-section";
    const heading = document.createElement("div");
    heading.className = "custom-section-title";
    heading.textContent = title;
    section.appendChild(heading);
    container.appendChild(section);
    return section;
}

function addSelect(container, label, entries, current, onChange) {
    const row = document.createElement("div");
    row.className = "custom-row";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const sel = document.createElement("select");
    let hasCurrent = false;
    entries.forEach(e => {
        const opt = document.createElement("option");
        opt.value = String(e.id);
        opt.textContent = e.label;
        if (e.id === current) { opt.selected = true; hasCurrent = true; }
        sel.appendChild(opt);
    });
    // The vehicle's current value isn't one of the choices (e.g. a config default outside the whitelist)
    if (!hasCurrent && typeof current === "number") {
        const opt = document.createElement("option");
        opt.value = String(current);
        opt.textContent = "Default";
        opt.selected = true;
        sel.insertBefore(opt, sel.firstChild);
    }
    sel.onchange = () => onChange(Number(sel.value));
    row.appendChild(lbl);
    row.appendChild(sel);
    container.appendChild(row);
}

function buildCustomize(options) {
    resetCustomize();
    if (!options) return;
    const body = document.getElementById("customize-body");

    if (options.livery && options.livery.entries && options.livery.entries.length) {
        const section = addSection(body, "Livery");
        addSelect(section, "Livery", options.livery.entries, options.livery.current, (id) => {
            customSelection.livery = id;
            sendCustomize();
        });
    }

    if (options.colors && options.colors.length) {
        const section = addSection(body, "Colors");
        options.colors.forEach(slot => {
            addSelect(section, slot.label, slot.entries || [], slot.current, (id) => {
                customSelection.colors = customSelection.colors || {};
                customSelection.colors[slot.key] = id;
                sendCustomize();
            });
        });
    }

    if (options.extras && options.extras.length) {
        const section = addSection(body, "Extras");
        const grid = document.createElement("div");
        grid.className = "custom-extras";
        options.extras.forEach(e => {
            const lbl = document.createElement("label");
            const box = document.createElement("input");
            box.type = "checkbox";
            box.checked = !!e.on;
            box.onchange = () => {
                customSelection.extras = customSelection.extras || {};
                customSelection.extras[e.id] = box.checked;
                sendCustomize();
            };
            const text = document.createElement("span");
            text.textContent = e.label;
            lbl.appendChild(box);
            lbl.appendChild(text);
            grid.appendChild(lbl);
        });
        section.appendChild(grid);
    }

    if (options.mods && options.mods.length) {
        const section = addSection(body, "Modifications");
        options.mods.forEach(m => {
            addSelect(section, m.label, m.entries || [], m.current, (index) => {
                customSelection.mods = customSelection.mods || {};
                customSelection.mods[m.type] = index;
                sendCustomize();
            });
        });
    }

    if (body.childElementCount > 0) {
        document.getElementById("customize-ui").style.display = "block";
    }
}

function clearSelection() {
    resetCustomize();
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
                // Options panel is rebuilt when the client reports this vehicle's options
                resetCustomize();
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

    if (event.data.action === "options") {
        // Ignore results for a vehicle that is no longer selected
        if (!selectedVehicle || selectedVehicle.divIndex !== event.data.divIndex || selectedVehicle.vehIndex !== event.data.vehIndex) return;
        buildCustomize(event.data.options);
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
    nuiPost("spawnVehicle", { ...selectedVehicle, selection: buildSelectionPayload() }).finally(() => {
        setTimeout(() => { if (document.getElementById("garage-ui").style.display !== "none") btn.disabled = false; }, 500);
    });
};

document.getElementById("close-btn").onclick = () => {
    fetch(`https://${GetParentResourceName()}/close`, { method: "POST" });
    document.getElementById("garage-ui").style.display = "none";
    resetCustomize();
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
