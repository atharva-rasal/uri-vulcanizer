import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { recipeScheduler } from "./recipe-scheduler";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Start Recipe Scheduler
recipeScheduler.start(10000); // Check every 10 seconds

// PLC → Backend endpoint
app.post("/api/data", async (req, res) => {
  const { temperature, pressure, timestamp } = req.body;

  await prisma.reading.create({
    data: {
      temperature,
      pressure,
      timestamp: new Date(timestamp),
    },
  });

  io.emit("live-data", { temperature, pressure, timestamp });

  res.json({ status: "saved" });
});

// Read history
app.get("/api/history", async (req, res) => {
  const { from, to } = req.query;

  const data = await prisma.reading.findMany({
    where: {
      timestamp: {
        gte: from ? new Date(from as string) : undefined,
        lte: to ? new Date(to as string) : undefined,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  res.json(data);
});

// Create recipe
app.post("/api/recipes", async (req, res) => {
  try {
    const recipe = await prisma.recipe.create({
      data: {
        ...req.body,
        status: req.body.scheduledAt ? "pending" : "draft",
      },
    });

    await prisma.changeLog.create({
      data: {
        user: "admin",
        action: "recipe-created",
        details: recipe,
      },
    });

    io.emit("recipe-created", recipe);
    res.json(recipe);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// Get all recipes
app.get("/api/recipes", async (req, res) => {
  const { status } = req.query;

  const recipes = await prisma.recipe.findMany({
    where: status ? { status: status as string } : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json(recipes);
});

// Get recipe by ID
app.get("/api/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);

  const recipe = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  res.json(recipe);
});

// Update recipe
app.put("/api/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const oldRecipe = await prisma.recipe.findUnique({ where: { id } });

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        ...req.body,
        // Reset status to pending if scheduledAt is set
        status:
          req.body.scheduledAt && !oldRecipe?.scheduledAt
            ? "pending"
            : req.body.status,
      },
    });

    await prisma.changeLog.create({
      data: {
        user: "admin",
        action: "recipe-updated",
        details: {
          old: oldRecipe ?? {},
          new: updated,
        },
      },
    });

    io.emit("recipe-updated", updated);
    res.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// Delete recipe
app.delete("/api/recipes/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } });

    await prisma.recipe.delete({ where: { id } });

    await prisma.changeLog.create({
      data: {
        user: "admin",
        action: "recipe-deleted",
        details: recipe ?? { id },
      },
    });

    io.emit("recipe-deleted", id);
    res.json({ status: "deleted" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// Get all changelogs
app.get("/api/logs", async (req, res) => {
  const { action, from, to, limit = "100" } = req.query;

  const logs = await prisma.changeLog.findMany({
    where: {
      ...(action && { action: action as string }),
      ...(from || to
        ? {
            timestamp: {
              gte: from ? new Date(from as string) : undefined,
              lte: to ? new Date(to as string) : undefined,
            },
          }
        : {}),
    },
    orderBy: { timestamp: "desc" },
    take: parseInt(limit as string),
  });

  res.json(logs);
});

// Get changelog by action type
app.get("/api/logs/action/:action", async (req, res) => {
  const { action } = req.params;

  const logs = await prisma.changeLog.findMany({
    where: { action },
    orderBy: { timestamp: "desc" },
  });

  res.json(logs);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", scheduler: "running" });
});

server.listen(3000, () => {
  console.log("✓ Backend running at http://localhost:3000");
  console.log("✓ Recipe Scheduler active");
});
