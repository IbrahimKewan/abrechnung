const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // .env-Unterstützung laden (optional)

const app = express();
const DATA_FILE = path.join(__dirname, "ausgaben.json");
const PASSWORD = process.env.APP_PASSWORD || "meinpasswort"; // Passwort aus .env oder fallback

// 🔓 Statische Dateien bereitstellen (HTML, CSS, JS im "public"-Ordner)
app.use(express.static(path.join(__dirname, "public")));

// 📦 JSON-Daten empfangen (POST body)
app.use(express.json());

// 🔐 Login-Endpunkt (einfacher Passwortvergleich)
app.post("/api/login", (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 📥 Ausgaben laden (GET)
app.get("/api/ausgaben", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        res.json(JSON.parse(content));
    } else {
        res.json([]); // keine Datei = leeres Array
    }
});

// 📤 Ausgaben speichern (POST mit Duplikatprüfung)
app.post("/api/ausgaben", (req, res) => {
    const incoming = req.body;
    let current = [];

    if (fs.existsSync(DATA_FILE)) {
        current = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    const isDuplicate = (a, b) =>
        a.date === b.date &&
        a.title === b.title &&
        a.amount === b.amount &&
        a.paid === b.paid &&
        a.category === b.category;

    const merged = [
        ...current,
        ...incoming.filter(
            (entry) => !current.some((e) => isDuplicate(e, entry))
        ),
    ];

    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2));
    res.json({ status: "ok", updated: merged.length });
});

// DELETE mit Index + optional Titel & Datum zur Sicherheit
app.post("/api/delete", (req, res) => {
    const { date, title, amount } = req.body;

    if (!fs.existsSync(DATA_FILE)) return res.json({ success: false });

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const filtered = data.filter(
        (e) => !(e.date === date && e.title === title && e.amount === amount)
    );

    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
});

// 🟢 Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
