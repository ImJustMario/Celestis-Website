import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { writeFileSync, mkdirSync } from "fs";
import readline from "readline";
import { join, basename, posix } from "path";
import { Buffer } from "buffer";
import { inspect } from "util";
import chalk from "chalk";
import boxen from "boxen";
import Table from "cli-table3";

dotenv.config();

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function toBoolean(value, fallback = false) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function formatValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return inspect(value, { depth: 1, breakLength: 80 });
  return String(value);
}

const dashboardState = {
  serial: {
    port: process.env.SERIAL_PORT ?? "COM15",
    baudRate: Number(process.env.SERIAL_BAUD_RATE ?? 115200),
    status: "starting",
  },
  radio: {
    received: 0,
    lastRssi: null,
    lastSnr: null,
    lastUpdatedAt: "-",
  },
  data: {
    received: 0,
    inserted: 0,
    lastType: "-",
    lastResult: "Esperando datos...",
    lastPayload: "-",
    lastUpdatedAt: "-",
    errors: 0,
  },
  images: {
    received: 0,
    processed: 0,
    stored: 0,
    pending: 0,
    lastId: "-",
    lastFile: "-",
    lastUrl: "-",
    receiving: false,
  },
  lastEvent: "Iniciando consola...",
};

let dashboardRenderTimer = null;
let dashboardRenderedOnce = false;
let dashboardLastFrame = "";

const ui = {
  border: chalk.cyan,
  title: chalk.bold.white,
  muted: chalk.gray,
  info: chalk.cyanBright,
  success: chalk.greenBright,
  warning: chalk.yellowBright,
  danger: chalk.redBright,
  accent: chalk.magentaBright,
  cool: chalk.blueBright,
};

function stripAnsi(text) {
  return String(text).replace(/\x1b\[[0-9;]*m/g, "");
}

function padRight(text, width) {
  const value = String(text);
  const visibleLength = stripAnsi(value).length;
  return visibleLength >= width ? value : value + " ".repeat(width - visibleLength);
}

function truncateVisible(text, width) {
  const value = String(text);
  let visible = 0;
  let output = "";
  const ansiPattern = /\x1b\[[0-9;]*m/g;
  let index = 0;

  while (index < value.length && visible < width) {
    ansiPattern.lastIndex = index;
    const match = ansiPattern.exec(value);
    if (match && match.index === index) {
      output += match[0];
      index += match[0].length;
      continue;
    }

    output += value[index];
    visible += 1;
    index += 1;
  }

  return output;
}

function colorize(value, color, bold = false) {
  const prefix = `${bold ? ansi.bold : ""}${color ?? ""}`;
  return `${prefix}${value}${ansi.reset}`;
}

function getLayoutWidth() {
  const columns = Number(process.stdout?.columns ?? 0);
  if (!Number.isFinite(columns) || columns <= 0) return 132;
  return Math.max(92, Math.min(columns - 2, 160));
}

function splitToLines(text) {
  return String(text).split("\n");
}

function ellipsizeVisible(text, width) {
  if (width <= 0) return "";
  const value = String(text);
  const plain = stripAnsi(value);
  if (plain.length <= width) return value;
  return truncateVisible(value, Math.max(0, width - 1)) + "…";
}

function createTable(rows) {
  const table = new Table({
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: " ",
    },
    colWidths: [18, 44],
    wordWrap: true,
    style: {
      head: [],
      border: [],
      compact: true,
    },
  });

  for (const row of rows) {
    table.push([
      { content: chalk.gray.bold(row.label), hAlign: "left" },
      { content: row.content, hAlign: "left" },
    ]);
  }

  return table.toString();
}

function createCard(title, rows, width, borderColor) {
  return boxen(createTable(rows), {
    title,
    padding: 1,
    margin: 0,
    width,
    borderStyle: "round",
    borderColor,
    titleAlignment: "center",
  });
}

function mergeColumns(left, right, gap = 3) {
  const leftLines = splitToLines(left);
  const rightLines = splitToLines(right);
  const height = Math.max(leftLines.length, rightLines.length);
  const leftWidth = leftLines.reduce((max, line) => Math.max(max, stripAnsi(line).length), 0);
  const rightWidth = rightLines.reduce((max, line) => Math.max(max, stripAnsi(line).length), 0);
  const spacer = " ".repeat(gap);
  const output = [];

  for (let i = 0; i < height; i += 1) {
    const leftLine = padRight(leftLines[i] ?? "", leftWidth);
    const rightLine = padRight(rightLines[i] ?? "", rightWidth);
    output.push(`${leftLine}${spacer}${rightLine}`.trimEnd());
  }

  return output.join("\n");
}

function buildHeader(now, width) {
  const innerWidth = Math.max(28, width - 2);
  const title = chalk.bold.whiteBright("Celestis WS Live Console");
  const subtitle = chalk.gray(`Actualizado: ${now}`);
  return boxen(`${title}\n${subtitle}`, {
    padding: { top: 0, bottom: 0, left: 2, right: 2 },
    margin: 0,
    width: innerWidth,
    borderStyle: "double",
    borderColor: "magenta",
    align: "center",
  });
}

function renderDashboard() {
  const width = getLayoutWidth();
  const columnWidth = Math.floor((width - 6) / 2);
  const compact = width < 122;
  const header = buildHeader(new Date().toLocaleString(), width);

  const serialCard = createCard("SERIAL", [
    { label: "Puerto", content: chalk.cyanBright(dashboardState.serial.port) },
    { label: "Baud rate", content: chalk.yellowBright(String(dashboardState.serial.baudRate)) },
    { label: "Estado", content: dashboardState.serial.status === "open" ? chalk.greenBright(dashboardState.serial.status) : dashboardState.serial.status === "error" || dashboardState.serial.status === "fatal" ? chalk.redBright(dashboardState.serial.status) : chalk.yellowBright(dashboardState.serial.status) },
  ], columnWidth, "cyan");

  const statusCard = createCard("ESTADO", [
    { label: "Ultimo evento", content: chalk.greenBright(ellipsizeVisible(dashboardState.lastEvent, 34)) },
    { label: "Refresco", content: dashboardRenderTimer ? chalk.greenBright("pendiente") : chalk.greenBright("inmediato") },
    { label: "RX recibidos", content: chalk.cyanBright(String(dashboardState.radio.received)) },
    { label: "RSSI / SNR", content: dashboardState.radio.lastRssi !== null && dashboardState.radio.lastSnr !== null ? chalk.whiteBright(`${dashboardState.radio.lastRssi.toFixed(2)} dBm / ${dashboardState.radio.lastSnr.toFixed(2)} dB`) : chalk.gray("sin datos") },
    { label: "Ultimo RX", content: chalk.whiteBright(dashboardState.radio.lastUpdatedAt) },
  ], columnWidth, "green");

  const dataCard = createCard("DATOS", [
    { label: "Recibidos", content: chalk.cyanBright(String(dashboardState.data.received)) },
    { label: "Insertados", content: chalk.greenBright(String(dashboardState.data.inserted)) },
    { label: "Ultimo resultado", content: chalk.whiteBright(ellipsizeVisible(dashboardState.data.lastResult, 34)) },
    { label: "Ultimo payload", content: chalk.magentaBright(ellipsizeVisible(dashboardState.data.lastPayload, 34)) },
    { label: "Actualizado", content: chalk.whiteBright(dashboardState.data.lastUpdatedAt) },
  ], columnWidth, "yellow");

  const imageCard = createCard("IMAGENES", [
    { label: "Estado", content: dashboardState.images.receiving ? chalk.greenBright("Llega una imagen") : chalk.gray("Sin imagen") },
    { label: "Recibidas", content: chalk.cyanBright(String(dashboardState.images.received)) },
    { label: "Procesadas", content: chalk.greenBright(String(dashboardState.images.processed)) },
    { label: "Guardadas", content: chalk.yellowBright(String(dashboardState.images.stored)) },
    { label: "Pendientes", content: dashboardState.images.pending > 0 ? chalk.magentaBright(String(dashboardState.images.pending)) : chalk.greenBright("0") },
    { label: "Ultimo ID", content: chalk.whiteBright(dashboardState.images.lastId) },
    { label: "Ultimo archivo", content: chalk.whiteBright(ellipsizeVisible(dashboardState.images.lastFile, 34)) },
    { label: "Ultima URL", content: chalk.blueBright(ellipsizeVisible(dashboardState.images.lastUrl, 34)) },
  ], columnWidth, "magenta");

  const topRow = compact ? [serialCard, statusCard].join("\n\n") : mergeColumns(serialCard, statusCard);
  const bottomRow = compact ? [dataCard, imageCard].join("\n\n") : mergeColumns(dataCard, imageCard);
  const footer = chalk.gray("Consejo: la consola se actualiza por evento para evitar parpadeos.");
  const frame = [header, "", topRow, "", bottomRow, "", footer].join("\n");

  if (frame === dashboardLastFrame) return;
  dashboardLastFrame = frame;

  if (!process.stdout.isTTY) {
    console.log(frame);
    return;
  }

  if (!dashboardRenderedOnce) {
    process.stdout.write("\x1b[2J\x1b[H");
    dashboardRenderedOnce = true;
  } else {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }

  process.stdout.write(frame);
}

function requestDashboardRender() {
  if (dashboardRenderTimer) return;
  dashboardRenderTimer = setTimeout(() => {
    dashboardRenderTimer = null;
    renderDashboard();
  }, 50);
}

function updateDashboard(event, details = {}) {
  if (event) dashboardState.lastEvent = event;
  if (details.serialStatus !== undefined) dashboardState.serial.status = details.serialStatus;
  if (details.radioReceived) dashboardState.radio.received += details.radioReceived;
  if (details.lastRssi !== undefined) dashboardState.radio.lastRssi = details.lastRssi;
  if (details.lastSnr !== undefined) dashboardState.radio.lastSnr = details.lastSnr;
  if (details.radioUpdatedAt !== undefined) dashboardState.radio.lastUpdatedAt = details.radioUpdatedAt;
  if (details.dataReceived) dashboardState.data.received += details.dataReceived;
  if (details.dataInserted) dashboardState.data.inserted += details.dataInserted;
  if (details.dataErrors) dashboardState.data.errors += details.dataErrors;
  if (details.lastResult !== undefined) dashboardState.data.lastResult = details.lastResult;
  if (details.lastPayload !== undefined) dashboardState.data.lastPayload = formatValue(details.lastPayload);
  if (details.lastUpdatedAt !== undefined) dashboardState.data.lastUpdatedAt = details.lastUpdatedAt;
  if (details.imageReceived) dashboardState.images.received += details.imageReceived;
  if (details.imageProcessed) dashboardState.images.processed += details.imageProcessed;
  if (details.imageStored) dashboardState.images.stored += details.imageStored;
  if (details.imagePending !== undefined) dashboardState.images.pending = details.imagePending;
  if (details.lastImageId !== undefined) dashboardState.images.lastId = details.lastImageId;
  if (details.lastImageFile !== undefined) dashboardState.images.lastFile = details.lastImageFile;
  if (details.lastImageUrl !== undefined) dashboardState.images.lastUrl = details.lastImageUrl;
  if (details.receivingImage !== undefined) dashboardState.images.receiving = details.receivingImage;
  requestDashboardRender();
}

function normalizeTelemetry(payload) {
  return {
    temperature:   toNumber(payload.T, 0),
    temperature2:  toNumber(payload.T2 ?? payload.temperature2 ?? payload.T, 0),
    co2ppm:        toNumber(payload.CO2 ?? payload.co2ppm, 0),
    altitude:      toNumber(payload.A, 0),
    pressure:      toNumber(payload.P, 0),
    humidity:      toNumber(payload.H, 0),
    gpsAltitude:   toNumber(payload.GPS?.AA ?? payload.gpsAltitude),
    gpsLatitude:   toNumber(payload.LAT ?? payload.gpsLatitude),
    gpsLongitude:  toNumber(payload.LON ?? payload.gpsLongitude),
    gpsConnected:  toBoolean(payload.GPS?.S ?? payload.gpsConnected, false),
  };
}

function parseRadioStatus(line) {
  const match = line.match(/^\[RX\]\s*RSSI:\s*([-+]?\d+(?:\.\d+)?)\s*\|\s*SNR:\s*([-+]?\d+(?:\.\d+)?)/i);
  if (!match) return null;

  return {
    rssi: Number(match[1]),
    snr: Number(match[2]),
  };
}

async function insertTelemetry(supabase, payload) {
  const record = normalizeTelemetry(payload);

  // Adjuntar imagen pendiente si existe
  if (pendingImage.url) {
    record.img = pendingImage.url;
    pendingImage.url = null; // limpiar después de usar
    updateDashboard("Imagen pendiente asociada a la telemetria", { imagePending: 0, lastImageUrl: record.img });
  }

  const { error } = await supabase.from("data_nacional").insert(record);
  if (error) {
    updateDashboard("Error al insertar telemetria", {
      dataErrors: 1,
      lastResult: error.message,
      lastPayload: payload,
      lastUpdatedAt: new Date().toLocaleTimeString(),
    });
    throw error;
  }

  updateDashboard(`Telemetry insertada (${record?.temperature ?? "?"}C, ${record?.co2ppm ?? "?"}ppm)`, {
    dataInserted: 1,
    lastResult: `Telemetry insertada (${record?.temperature ?? "?"}C, ${record?.co2ppm ?? "?"}ppm)`,
    lastPayload: payload,
    lastUpdatedAt: new Date().toLocaleTimeString(),
  });
}
// ===================== Estado imagen =====================
const imageState = {
  receiving: false,
  id: null,
  chunks: [],   // Líneas Base64 acumuladas
};

const IMAGE_DIR = process.env.IMAGE_DIR ?? "./images";
mkdirSync(IMAGE_DIR, { recursive: true });

async function handleImageLine(line, supabase) {
  // Inicio de imagen
  if (line.startsWith("IMG_START:")) {
    imageState.receiving = true;
    imageState.id = line.split(":")[1].trim();
    imageState.chunks = [];
    updateDashboard(`Inicio de imagen ${imageState.id}`, {
      imageReceived: 1,
      imagePending: dashboardState.images.pending + 1,
      lastImageId: imageState.id,
      receivingImage: true,
      lastUpdatedAt: new Date().toLocaleTimeString(),
    });
    return;
  }

  // Fin de imagen
  if (line.startsWith("IMG_END:")) {
    const id = line.split(":")[1].trim();
    if (!imageState.receiving || imageState.id !== id) {
      updateDashboard(`IMG_END inesperado para ID ${id}`, {
        dataErrors: 1,
        lastResult: "Fin de imagen inesperado",
        lastImageId: id,
        receivingImage: false,
        lastUpdatedAt: new Date().toLocaleTimeString(),
      });
      imageState.receiving = false;
      return;
    }

    const base64str = imageState.chunks.join("");
    const buffer = Buffer.from(base64str, "base64");
    const localPath = join(IMAGE_DIR, `img_${id}_${Date.now()}.jpg`);
    // storage key must use forward slashes and not include local directories
    const storagePath = basename(localPath).replace(/\\/g, "/");

    try {
      writeFileSync(localPath, buffer);
      updateDashboard(`Imagen ${id} guardada`, {
        imageProcessed: 1,
        lastImageFile: localPath,
        lastImageId: id,
        lastUpdatedAt: new Date().toLocaleTimeString(),
      });

      // Subir a Supabase Storage si quieres
      const { data, error: uploadError } = await supabase.storage
      .from("images")
      .upload(storagePath, buffer, { 
        contentType: "image/jpeg" 
      });

      if (uploadError) throw uploadError;

      // Prefer the path returned by Supabase (it is normalized)
      const uploadedPath = (data && data.path) ? data.path.replace(/\\/g, "/") : storagePath;
      const { data: publicData } = supabase.storage
      .from("images")
      .getPublicUrl(uploadedPath);

      const publicUrl = publicData?.publicUrl ?? null;

      pendingImage.url = publicUrl;
      updateDashboard(`Imagen ${id} subida a storage`, {
        imageStored: 1,
        imagePending: Math.max(0, dashboardState.images.pending - 1),
        lastImageUrl: publicUrl,
        lastUpdatedAt: new Date().toLocaleTimeString(),
      });
    }

    catch (err) {
      updateDashboard(`Error procesando imagen ${id}`, {
        dataErrors: 1,
        lastResult: err.message,
        lastImageId: id,
        lastUpdatedAt: new Date().toLocaleTimeString(),
      });
    }

    imageState.receiving = false;
    imageState.id = null;
    imageState.chunks = [];
    updateDashboard(`Fin de imagen ${id}`, { receivingImage: false });
    return;
  }

  if (line.startsWith("IMG_DATA:")) {
    imageState.chunks.push(line.slice("IMG_DATA:".length));
    return;
  }
}

const pendingImage = { url: null };

async function main() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const serialPath  = dashboardState.serial.port;
  const baudRate    = dashboardState.serial.baudRate;
  if (!Number.isFinite(baudRate)) throw new Error("SERIAL_BAUD_RATE must be a valid number");

  const supabase = createClient(supabaseUrl, supabaseKey);

  const port   = new SerialPort({ path: serialPath, baudRate });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  renderDashboard();

  port.on("open",  () => updateDashboard(`Puerto serial abierto en ${serialPath}`, { serialStatus: "open" }));
  port.on("error", (err) => updateDashboard(`Error serial: ${err.message}`, { serialStatus: "error", dataErrors: 1 }));

  parser.on("data", async (rawLine) => {
    // Dividir por \n por si vienen múltiples líneas concatenadas
    const subLines = String(rawLine).split("\n");

    for (const subLine of subLines) {
      // Limpiar caracteres de control y espacios
      const trimmed = subLine.replace(/[\x00-\x1F\x7F]/g, c => c === "\n" ? "" : "").trim();
      if (!trimmed) continue;

      updateDashboard("Linea recibida", {
        dataReceived: 1,
        lastPayload: trimmed,
        lastUpdatedAt: new Date().toLocaleTimeString(),
      });

      if (trimmed.includes("IMG_START:")) {
        handleImageLine(trimmed.slice(trimmed.indexOf("IMG_START:")), supabase);
        continue;
      }
      if (trimmed.includes("IMG_END:")) {
        handleImageLine(trimmed.slice(trimmed.indexOf("IMG_END:")), supabase);
        continue;
      }
      if (trimmed.includes("IMG_DATA:")) {
        handleImageLine(trimmed.slice(trimmed.indexOf("IMG_DATA:")), supabase);
        continue;
      }
      if (imageState.receiving) {
        handleImageLine(trimmed, supabase);
        continue;
      }

      const radioStatus = parseRadioStatus(trimmed);
      if (radioStatus) {
        updateDashboard(`RX recibido RSSI ${radioStatus.rssi.toFixed(2)} | SNR ${radioStatus.snr.toFixed(2)}`, {
          radioReceived: 1,
          lastRssi: radioStatus.rssi,
          lastSnr: radioStatus.snr,
          radioUpdatedAt: new Date().toLocaleTimeString(),
          lastUpdatedAt: new Date().toLocaleTimeString(),
        });
        continue;
      }

      try {
        const payload = JSON.parse(trimmed);
        await insertTelemetry(supabase, payload);
      } catch {
        updateDashboard("Linea ignorada: no es JSON ni comando de imagen", {
          dataErrors: 1,
          lastUpdatedAt: new Date().toLocaleTimeString(),
        });
      }
    }
  });
}
main().catch((err) => {
  updateDashboard(`Error fatal: ${err.message}`, { serialStatus: "fatal", dataErrors: 1 });
  console.error("Fatal error:", err);
  process.exit(1);
});