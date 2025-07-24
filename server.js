const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const DATA_FILE = path.join(__dirname, "ausgaben.json");
const PASSWORD = process.env.APP_PASSWORD || "meinpasswort"; // besser über .env

app.use(express.static(__dirname));
app.use(express.json());

// Passwortprüfung (simple, nur POST)
app.post("/api/login", (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Ausgaben laden
app.get("/api/ausgaben", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        res.json(JSON.parse(content));
    } else {
        res.json([]);
    }
});

// Ausgaben speichern mit Merging (keine Duplikate)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
