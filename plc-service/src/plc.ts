import ModbusRTU from "modbus-serial";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PLC_IP = process.env.PLC_IP!;
const PLC_PORT = Number(process.env.PLC_PORT!);
const BACKEND_URL = process.env.BACKEND_URL!;

const client = new ModbusRTU();

async function connectPLC() {
  try {
    await client.connectTCP(PLC_IP, { port: PLC_PORT });
    client.setID(1);

    console.log("PLC Connected successfully.");

    // Turn ON M0 to enable test mode
    await client.writeCoil(2048, true);
    console.log("M0 Enabled");
  } catch (err) {
    console.log("PLC connection failed. Retrying...");
    setTimeout(connectPLC, 2000);
  }
}

async function pollPLC() {
  try {
    // Read D0 (INT) → register 4096 offset
    const d0 = await client.readHoldingRegisters(4096, 1);
    const pressure = d0.data[0];

    // Read D4 (FLOAT) → register 4100 offset
    const d4 = await client.readHoldingRegisters(4100, 2);

    const buffer = Buffer.alloc(4);
    buffer.writeUInt16BE(d4.data[1], 0); // high word
    buffer.writeUInt16BE(d4.data[0], 2); // low word

    const temperature = buffer.readFloatBE(0);

    const reading = {
      temperature,
      pressure,
      timestamp: new Date().toISOString(),
    };

    console.log("PLC Data:", reading);

    await axios.post(BACKEND_URL, reading);
  } catch (err: any) {
    console.error("PLC read error:", err.message || err);
  }
}

(async () => {
  await connectPLC();
  setInterval(pollPLC, 1000);
})();
