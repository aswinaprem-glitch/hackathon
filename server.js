const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, "[]");

app.use(express.json({ limit: "6mb" }));
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"]
}));

function readReports() {
  try {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

function validCoordinate(v, min, max) {
  return Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "SlopeWatch", time: new Date().toISOString() });
});

app.get("/api/reports", (req, res) => {
  const reports = readReports();
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 10, 1), 50);

  if (!validCoordinate(lat, -90, 90) || !validCoordinate(lon, -180, 180)) {
    return res.json(reports.slice(-200).reverse());
  }

  const filtered = reports
    .map(r => ({ ...r, distanceKm: haversine(lat, lon, r.latitude, r.longitude) }))
    .filter(r => r.distanceKm <= radiusKm)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(filtered.slice(0, 200));
});

app.post("/api/reports", (req, res) => {
  const { latitude, longitude, type, description, photo } = req.body || {};
  const lat = Number(latitude);
  const lon = Number(longitude);

  const allowedTypes = [
    "ground_crack",
    "water_seepage",
    "rockfall",
    "soil_movement",
    "road_damage",
    "landslide"
  ];

  if (!validCoordinate(lat, -90, 90) || !validCoordinate(lon, -180, 180)) {
    return res.status(400).json({ error: "Valid latitude and longitude are required." });
  }
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid report type." });
  }
  if (typeof description !== "string" || description.trim().length < 3 || description.length > 600) {
    return res.status(400).json({ error: "Description must be 3–600 characters." });
  }

  let safePhoto = null;
  if (photo) {
    if (typeof photo !== "string" || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(photo) || photo.length > 4_000_000) {
      return res.status(400).json({ error: "Photo must be a small JPG, PNG or WebP image." });
    }
    safePhoto = photo;
  }

  const report = {
    id: "SW-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    latitude: lat,
    longitude: lon,
    type,
    description: description.trim(),
    photo: safePhoto,
    verified: false,
    createdAt: new Date().toISOString()
  };

  const reports = readReports();
  reports.push(report);
  writeReports(reports.slice(-2000));

  res.status(201).json(report);
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

app.get("*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SlopeWatch running at http://localhost:${PORT}`);
});