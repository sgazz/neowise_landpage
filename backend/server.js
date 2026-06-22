const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const DEFAULT_IP_HASH_SALT = "development-only-ip-hash-salt";
const DEFAULT_ADMIN_TOKEN = "dev-admin-token";
const PORT = Number(process.env.PORT) || 8787;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const IP_HASH_SALT = process.env.IP_HASH_SALT || DEFAULT_IP_HASH_SALT;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN;
const NODE_ENV = process.env.NODE_ENV || "development";
const DATA_DIR = path.join(__dirname, "data");
const LOGS_DIR = path.join(__dirname, "logs");
const DATA_FILE = path.join(__dirname, "data", "beta-requests.json");

const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMax = 10;
const requestLog = new Map();

function validateEnvironment() {
  if (IP_HASH_SALT === DEFAULT_IP_HASH_SALT) {
    console.warn("IP_HASH_SALT is not set. Using development fallback salt.");
  }

  if (ADMIN_TOKEN === DEFAULT_ADMIN_TOKEN) {
    console.warn("ADMIN_TOKEN is not set. Using development fallback token.");
  }

  if (NODE_ENV === "production") {
    const fatalIssues = [];

    if (ADMIN_TOKEN === DEFAULT_ADMIN_TOKEN) {
      fatalIssues.push("ADMIN_TOKEN must be set to a strong unique value");
    }

    if (IP_HASH_SALT === DEFAULT_IP_HASH_SALT) {
      fatalIssues.push("IP_HASH_SALT must be set to a strong unique value");
    }

    if (FRONTEND_ORIGIN === "*") {
      fatalIssues.push("FRONTEND_ORIGIN must list allowed origins (not '*')");
    }

    if (fatalIssues.length) {
      console.error("Neowise beta backend refused to start in production:");
      fatalIssues.forEach((issue) => console.error(`- ${issue}`));
      process.exit(1);
    }
  }
}

function getCorsOptions() {
  if (FRONTEND_ORIGIN === "*") {
    return { origin: "*" };
  }

  const allowedOrigins = FRONTEND_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  };
}

app.set("trust proxy", true);
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: "50kb" }));
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
});

function sanitizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
}

function clampString(value, maxLength) {
  const sanitized = sanitizeString(value);
  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashIp(ip) {
  return crypto.createHash("sha256").update(`${IP_HASH_SALT}:${ip}`).digest("hex");
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readRequests() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRequests(records) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = requestLog.get(ip) || [];
  const recent = current.filter((timestamp) => now - timestamp < rateLimitWindowMs);

  if (recent.length >= rateLimitMax) {
    return res.status(429).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }

  recent.push(now);
  requestLog.set(ip, recent);
  return next();
}

function requireAdmin(req, res, next) {
  const header = req.get("authorization") || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  const queryToken =
    NODE_ENV !== "production" && typeof req.query.token === "string" ? req.query.token : "";

  if (bearerToken === ADMIN_TOKEN || queryToken === ADMIN_TOKEN) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized.",
  });
}

function escapeCsv(value) {
  const stringValue = value === undefined || value === null ? "" : String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function toCsv(records) {
  const headers = [
    "id",
    "name",
    "email",
    "role",
    "goal",
    "source",
    "consent",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "created_at",
    "user_agent",
    "ip_hash",
  ];
  const rows = records.map((record) => headers.map((header) => escapeCsv(record[header])).join(","));

  return [headers.join(","), ...rows].join("\n");
}

function normalizeRole(role) {
  const value = sanitizeString(role).toLowerCase();

  if (!value) return "unknown";
  if (value.includes("student")) return "student";
  if (
    value.includes("educator") ||
    value.includes("teacher") ||
    value.includes("professor") ||
    value.includes("school")
  ) {
    return "educator";
  }
  if (value.includes("lifelong") || value.includes("professional") || value.includes("adult")) {
    return "lifelong learner";
  }

  return "other";
}

function normalizeSource(source) {
  const value = sanitizeString(source);

  if (!value) return "unknown";
  if (value === "home-modal" || value === "beta-page" || value === "unknown") return value;

  return value;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "neowise-beta-backend" });
});

app.post("/api/beta-request", rateLimit, async (req, res) => {
  try {
    const email = sanitizeString(req.body.email).toLowerCase();
    const consent = req.body.consent === true;

    if (!isValidEmail(email) || !consent) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email and accept the beta consent.",
      });
    }

    const records = await readRequests();
    const alreadyExists = records.some((record) => record.email.toLowerCase() === email);

    if (alreadyExists) {
      return res.json({
        success: true,
        message: "You are already on the beta list.",
      });
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const record = {
      id: crypto.randomUUID(),
      name: clampString(req.body.name, 120),
      email,
      role: clampString(req.body.role, 80),
      goal: clampString(req.body.goal, 2000),
      source: clampString(req.body.source, 40) || "unknown",
      consent,
      utm_source: clampString(req.body.utm_source, 100),
      utm_medium: clampString(req.body.utm_medium, 100),
      utm_campaign: clampString(req.body.utm_campaign, 100),
      created_at: new Date().toISOString(),
      user_agent: clampString(req.get("user-agent"), 500),
      ip_hash: hashIp(ip),
    };

    records.push(record);
    await writeRequests(records);

    return res.status(201).json({
      success: true,
      message: "Thank you. Your beta request has been received.",
    });
  } catch (error) {
    console.error("Beta request failed:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.get("/api/admin/beta-requests", requireAdmin, async (req, res) => {
  try {
    const records = await readRequests();

    return res.json({
      success: true,
      count: records.length,
      requests: records,
    });
  } catch (error) {
    console.error("Admin beta request list failed:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.get("/api/admin/beta-requests.csv", requireAdmin, async (req, res) => {
  try {
    const records = await readRequests();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="neowise-beta-requests.csv"');
    return res.send(toCsv(records));
  } catch (error) {
    console.error("Admin beta request CSV failed:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const records = await readRequests();
    const byRole = {
      student: 0,
      educator: 0,
      "lifelong learner": 0,
      other: 0,
      unknown: 0,
    };
    const bySource = {
      "home-modal": 0,
      "beta-page": 0,
      unknown: 0,
    };
    let latestCreatedAt = null;

    records.forEach((record) => {
      const role = normalizeRole(record.role);
      const source = normalizeSource(record.source);

      byRole[role] = (byRole[role] || 0) + 1;
      bySource[source] = (bySource[source] || 0) + 1;

      if (record.created_at && (!latestCreatedAt || record.created_at > latestCreatedAt)) {
        latestCreatedAt = record.created_at;
      }
    });

    return res.json({
      total: records.length,
      by_role: byRole,
      by_source: bySource,
      latest_created_at: latestCreatedAt,
    });
  } catch (error) {
    console.error("Admin stats failed:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email and accept the beta consent.",
    });
  }

  return next(err);
});

async function startServer() {
  validateEnvironment();
  await ensureDataFile();

  const server = app.listen(PORT, () => {
    console.log(`Neowise beta backend running on port ${PORT}`);
    console.log(`CORS origin: ${FRONTEND_ORIGIN}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the existing process or set a different PORT.`);
      process.exit(1);
    }

    console.error("Neowise beta backend server error:", error);
    process.exit(1);
  });

  const shutdown = () => {
    console.log("Shutting down Neowise beta backend...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start Neowise beta backend:", error);
  process.exit(1);
});
