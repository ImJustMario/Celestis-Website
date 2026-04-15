import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

dotenv.config();

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function normalizeTelemetry(payload) {
  return {
    temperature: toNumber(payload.T, 0),
    temperature2: toNumber(payload.T2 ?? payload.temperature2 ?? payload.T, 0),
    co2ppm: toNumber(payload.CO2 ?? payload.co2ppm, 0),
    altitude: toNumber(payload.A, 0),
    pressure: toNumber(payload.P, 0),
    humidity: toNumber(payload.H, 0),
    gpsAltitude: toNumber(payload.GPS?.A ?? payload.gpsAltitude),
    gpsLatitude: toNumber(payload.GPS?.Lat ?? payload.gpsLatitude),
    gpsLongitude: toNumber(payload.GPS?.Lon ?? payload.gpsLongitude),
    gpsConnected: toBoolean(payload.GPS?.S ?? payload.gpsConnected, false),
  };
}

async function insertTelemetry(supabase, payload) {
  const record = normalizeTelemetry(payload);
  const { error } = await supabase.from("data").insert(record);

  if (error) {
    throw error;
  }

  console.log("Inserted telemetry:", record);
}

async function main() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const serialPath = process.env.SERIAL_PORT ?? "COM11";
  const baudRate = Number(process.env.SERIAL_BAUD_RATE ?? 115200);

  if (!Number.isFinite(baudRate)) {
    throw new Error("SERIAL_BAUD_RATE must be a valid number");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const port = new SerialPort({
    path: serialPath,
    baudRate,
  });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  port.on("open", () => {
    console.log(`Serial port opened on ${serialPath} at ${baudRate} baud`);
  });

  port.on("error", (error) => {
    console.error("Serial port error:", error.message);
  });

  parser.on("data", async (line) => {
    const trimmed = String(line).trim();

    if (!trimmed) {
      return;
    }

    try {
      const payload = JSON.parse(trimmed);
      await insertTelemetry(supabase, payload);
    } catch (error) {
      console.error("Could not process line:", trimmed);
    }
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

