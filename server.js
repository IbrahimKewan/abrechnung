const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const DATA_FILE = path.join(__dirname, "ausgaben.json");

app.use(express.static(__dirname));
app.use(express.json());

// API: Daten laden
app.get("/api/ausgaben", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        res.json(JSON.parse(content));
    } else {
        res.json([]);
    }
});

// API: Daten speichern & mergen
app.post("/api/ausgaben", (req, res) => {
    const incoming = req.body;
    let current = [];
    if (fs.existsSync(DATA_FILE)) {
        current = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }

    const isDuplicate = (a, b) =>
        a.date === b.date && a.title === b.title && a.amount === b.amount;
    const merged = [
        ...current,
        ...incoming.filter(
            (entry) => !current.some((e) => isDuplicate(e, entry))
        ),
    ];

    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2));
    res.json({ status: "ok", updated: merged.length });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
