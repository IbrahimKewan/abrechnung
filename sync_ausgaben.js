const fetch = require("node-fetch");
const fs = require("fs");
const { execSync } = require("child_process");

// URL zu deiner API, die die aktuelle ausgaben.json liefert
const URL = "https://abrechnung.onrender.com/";

async function sync() {
    try {
        // 1. Datei vom Server holen
        const res = await fetch(URL);
        if (!res.ok) throw new Error("Fehler beim Abrufen der Datei");
        const data = await res.json();

        // 2. Lokal speichern
        fs.writeFileSync("ausgaben.json", JSON.stringify(data, null, 2));
        console.log("ausgaben.json aktualisiert.");

        // 3. Git add/commit/push
        execSync("git add ausgaben.json");
        execSync('git commit -m "Automatisches Update der Ausgaben"');
        execSync("git push origin main");
        console.log("Änderungen zu GitHub gepusht.");
    } catch (err) {
        console.error("Fehler:", err.message);
    }
}

// Alle 60 Minuten ausführen
setInterval(sync, 60 * 60 * 1000);

// Beim Start sofort ausführen
sync();
