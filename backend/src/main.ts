import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

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

server.listen(3000, () => {
  console.log("Backend running at http://localhost:3000");
});
