#!/usr/bin/env node

const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawn } = require("node:child_process");

const rootDir = __dirname;
const clientDir = path.join(rootDir, "client");
const serverDir = path.join(rootDir, "server");
const schemaPath = path.join(rootDir, "database", "schema.sql");
const seedPath = path.join(rootDir, "database", "seed.sql");

const config = {
  containerName: "campusmate-mysql",
  mysqlImage: "mysql:8.4",
  mysqlPort: 3306,
  serverPort: 8000,
  clientPort: 5173
};

const args = new Set(process.argv.slice(2));
const lanHostArg = process.argv.slice(2).find((arg) => arg.startsWith("--lan-host="));
const options = {
  resetDatabase: args.has("--reset-db") || args.has("--reset-database"),
  skipInstall: args.has("--skip-install"),
  noBrowser: args.has("--no-browser"),
  lanHttps: args.has("--lan-https") || args.has("--https-lan"),
  lan: args.has("--lan") || args.has("--lan-https") || args.has("--https-lan") || Boolean(lanHostArg),
  lanHost: lanHostArg ? lanHostArg.slice("--lan-host=".length) : null
};

const children = [];

function step(message) {
  console.log(`\n==> ${message}`);
}

function ok(message) {
  console.log(`OK  ${message}`);
}

function run(command, commandArgs = [], runOptions = {}) {
  return execFileSync(command, commandArgs, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: runOptions.stdio || "pipe",
    input: runOptions.input,
    shell: false
  });
}

function mysqlClientArgs(extraArgs = []) {
  return ["-uroot", "--protocol=TCP", "-h", "127.0.0.1", ...extraArgs];
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";

  try {
    run(checker, [command]);
    return true;
  } catch {
    return false;
  }
}

function assertCommand(command) {
  if (!commandExists(command)) {
    throw new Error(`Comando '${command}' non trovato. Installalo e rilancia lo script.`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        candidates.push({ name, address: address.address });
      }
    }
  }

  const physicalCandidates = candidates.filter((candidate) => {
    const name = candidate.name.toLowerCase();
    return !/(docker|hyper-v|vethernet|virtual|virtualbox|wsl|nord|vpn)/.test(name);
  });
  const preferredCandidates = physicalCandidates.length ? physicalCandidates : candidates;

  return preferredCandidates.find((candidate) => candidate.address.startsWith("192.168."))?.address
    || preferredCandidates.find((candidate) => candidate.address.startsWith("10."))?.address
    || preferredCandidates.find((candidate) => candidate.address.startsWith("172."))?.address
    || preferredCandidates[0]?.address
    || "127.0.0.1";
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function waitForDocker() {
  step("Controllo Docker");

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      run("docker", ["info"]);
      ok("Docker e pronto");
      return;
    } catch {
      await sleep(2000);
    }
  }

  throw new Error("Docker non risponde. Avvia Docker Desktop e rilancia questo script.");
}

function containerExists() {
  const output = run("docker", [
    "ps",
    "-a",
    "--filter",
    `name=^/${config.containerName}$`,
    "--format",
    "{{.Names}}"
  ]).trim();

  return output === config.containerName;
}

function containerIsRunning() {
  const output = run("docker", ["inspect", "-f", "{{.State.Running}}", config.containerName]).trim();
  return output === "true";
}

async function startMysqlContainer() {
  step("Avvio database MySQL");

  if (!containerExists()) {
    if (await isPortOpen("127.0.0.1", config.mysqlPort)) {
      throw new Error(`La porta ${config.mysqlPort} e gia occupata. Libera la porta oppure configura MySQL manualmente.`);
    }

    run("docker", [
      "run",
      "--name",
      config.containerName,
      "-e",
      "MYSQL_ALLOW_EMPTY_PASSWORD=yes",
      "-e",
      "MYSQL_DATABASE=campusmate",
      "-p",
      `${config.mysqlPort}:3306`,
      "-d",
      config.mysqlImage
    ], { stdio: "inherit" });

    ok(`Container ${config.containerName} creato`);
    return;
  }

  if (!containerIsRunning()) {
    run("docker", ["start", config.containerName], { stdio: "inherit" });
    ok(`Container ${config.containerName} avviato`);
    return;
  }

  ok(`Container ${config.containerName} gia attivo`);
}

async function waitForMysql() {
  step("Attendo MySQL nel container Docker");

  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      run("docker", ["exec", config.containerName, "mysqladmin", ...mysqlClientArgs(["ping", "--silent"])]);
      ok("MySQL e pronto");
      return;
    } catch {
      await sleep(2000);
    }
  }

  run("docker", ["logs", "--tail", "80", config.containerName], { stdio: "inherit" });
  throw new Error("MySQL non e diventato pronto in tempo.");
}

function mysqlExec(sql) {
  return run("docker", ["exec", "-i", config.containerName, "mysql", ...mysqlClientArgs()], {
    input: sql
  });
}

function getTableCount() {
  const output = run("docker", [
    "exec",
    config.containerName,
    "mysql",
    ...mysqlClientArgs(["-N", "-B"]),
    "-e",
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'campusmate';"
  ]).trim();

  return Number(output || 0);
}

function initializeDatabase() {
  step("Controllo schema e dati iniziali");

  if (options.resetDatabase || getTableCount() === 0) {
    mysqlExec(fs.readFileSync(schemaPath, "utf8"));
    mysqlExec(fs.readFileSync(seedPath, "utf8"));
    ok("Database campusmate importato da schema.sql e seed.sql");
    ensureBuildingMetadataColumns();
    ensureTableLayoutColumns();
    ensureReceptionSchema();
    return;
  }

  ok("Database campusmate gia inizializzato");
  ensureBuildingMetadataColumns();
  ensureTableLayoutColumns();
  ensureReceptionSchema();
}

function ensureBuildingMetadataColumns() {
  const requiredColumns = [
    ["image_url", "VARCHAR(500) NULL"],
    ["latitude", "DECIMAL(9,6) NULL"],
    ["longitude", "DECIMAL(9,6) NULL"],
    ["weekday_hours", "VARCHAR(80) NULL"],
    ["weekend_hours", "VARCHAR(80) NULL"],
    ["services", "JSON NULL"]
  ];

  const missingColumns = requiredColumns.filter(([columnName]) => {
    const output = run("docker", [
      "exec",
      config.containerName,
      "mysql",
      ...mysqlClientArgs(["-N", "-B"]),
      "-e",
      `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'campusmate' AND table_name = 'buildings' AND column_name = '${columnName}';`
    ]).trim();

    return Number(output || 0) === 0;
  });

  if (missingColumns.length === 0) {
    ok("Campi metadati edifici gia presenti");
    return;
  }

  mysqlExec(`
    USE campusmate;
    ALTER TABLE buildings
      ${missingColumns.map(([columnName, definition]) => `ADD COLUMN ${columnName} ${definition}`).join(",\n      ")};
  `);

  ok("Campi metadati edifici aggiunti al database esistente");
}

function ensureTableLayoutColumns() {
  const output = run("docker", [
    "exec",
    config.containerName,
    "mysql",
    ...mysqlClientArgs(["-N", "-B"]),
    "-e",
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'campusmate' AND table_name = 'study_tables' AND column_name = 'layout_x';"
  ]).trim();

  if (Number(output || 0) > 0) {
    ok("Campi layout tavoli gia presenti");
    return;
  }

  mysqlExec(`
    USE campusmate;
    ALTER TABLE study_tables
      ADD COLUMN layout_x DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      ADD COLUMN layout_y DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      ADD COLUMN layout_width DECIMAL(5,2) NOT NULL DEFAULT 14.00,
      ADD COLUMN layout_height DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      ADD COLUMN layout_rotation SMALLINT NOT NULL DEFAULT 0;
    UPDATE study_tables SET layout_x = 18.00, layout_y = 24.00, layout_width = 13.00, layout_height = 13.00 WHERE room_id = 1 AND table_code = 'T1';
    UPDATE study_tables SET layout_x = 42.00, layout_y = 24.00, layout_width = 13.00, layout_height = 13.00 WHERE room_id = 1 AND table_code = 'T2';
    UPDATE study_tables SET layout_x = 18.00, layout_y = 58.00, layout_width = 13.00, layout_height = 13.00 WHERE room_id = 1 AND table_code = 'T3';
    UPDATE study_tables SET layout_x = 42.00, layout_y = 58.00, layout_width = 13.00, layout_height = 13.00 WHERE room_id = 1 AND table_code = 'T4';
    UPDATE study_tables SET layout_x = 12.00, layout_y = 18.00, layout_width = 12.00, layout_height = 12.00 WHERE room_id = 2 AND table_code = 'T1';
    UPDATE study_tables SET layout_x = 12.00, layout_y = 44.00, layout_width = 12.00, layout_height = 12.00 WHERE room_id = 2 AND table_code = 'T2';
    UPDATE study_tables SET layout_x = 46.00, layout_y = 18.00, layout_width = 27.00, layout_height = 16.00 WHERE room_id = 2 AND table_code = 'G1';
    UPDATE study_tables SET layout_x = 46.00, layout_y = 54.00, layout_width = 27.00, layout_height = 16.00 WHERE room_id = 2 AND table_code = 'G2';
    UPDATE study_tables SET layout_x = 16.00, layout_y = 20.00, layout_width = 31.00, layout_height = 18.00 WHERE room_id = 3 AND table_code = 'G1';
    UPDATE study_tables SET layout_x = 54.00, layout_y = 20.00, layout_width = 31.00, layout_height = 18.00 WHERE room_id = 3 AND table_code = 'G2';
    UPDATE study_tables SET layout_x = 34.00, layout_y = 58.00, layout_width = 29.00, layout_height = 16.00 WHERE room_id = 3 AND table_code = 'G3';
    UPDATE study_tables SET layout_x = 26.00, layout_y = 28.00, layout_width = 14.00, layout_height = 14.00 WHERE room_id = 4 AND table_code = 'T1';
    UPDATE study_tables SET layout_x = 58.00, layout_y = 56.00, layout_width = 14.00, layout_height = 14.00 WHERE room_id = 4 AND table_code = 'T2';
  `);

  ok("Campi layout tavoli aggiunti al database esistente");
}

function ensureReceptionSchema() {
  mysqlExec(`
    USE campusmate;
    ALTER TABLE users
      MODIFY COLUMN role ENUM('student', 'admin', 'receptionist') NOT NULL DEFAULT 'student';

    CREATE TABLE IF NOT EXISTS receptionist_assignments (
      user_id INT NOT NULL,
      building_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, building_id),
      CONSTRAINT fk_receptionist_assignment_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      CONSTRAINT fk_receptionist_assignment_building
        FOREIGN KEY (building_id) REFERENCES buildings(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    );
  `);

  const requiredColumns = [
    ["checked_in_at", "DATETIME NULL"],
    ["checked_out_at", "DATETIME NULL"],
    ["checked_in_by", "INT NULL"],
    ["checked_out_by", "INT NULL"]
  ];

  const missingColumns = requiredColumns.filter(([columnName]) => {
    const output = run("docker", [
      "exec",
      config.containerName,
      "mysql",
      ...mysqlClientArgs(["-N", "-B"]),
      "-e",
      `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'campusmate' AND table_name = 'reservations' AND column_name = '${columnName}';`
    ]).trim();

    return Number(output || 0) === 0;
  });

  if (missingColumns.length > 0) {
    mysqlExec(`
      USE campusmate;
      ALTER TABLE reservations
        ${missingColumns.map(([columnName, definition]) => `ADD COLUMN ${columnName} ${definition}`).join(",\n        ")};
    `);
  }

  mysqlExec(`
    USE campusmate;
    INSERT IGNORE INTO users (
      first_name,
      last_name,
      email,
      password_hash,
      role,
      student_number,
      degree_course,
      year_of_study,
      phone,
      status
    ) VALUES
    ('Reception', 'Economia', 'reception.economia@campusmate.local', 'scrypt$Rk4AIE0Kb3t9h_ya1sIP-g$C4h6NzsEe6co-UJKpOFJOe2Ic5A5-69Vt1jhkChG9nDItBGfb1YU7vpHL3WgcI7ZwlEX1bzwo4y8ZrSsSeHP4w', 'receptionist', NULL, NULL, NULL, NULL, 'active'),
    ('Reception', 'Giurisprudenza', 'reception.giurisprudenza@campusmate.local', 'scrypt$Rk4AIE0Kb3t9h_ya1sIP-g$C4h6NzsEe6co-UJKpOFJOe2Ic5A5-69Vt1jhkChG9nDItBGfb1YU7vpHL3WgcI7ZwlEX1bzwo4y8ZrSsSeHP4w', 'receptionist', NULL, NULL, NULL, NULL, 'active');

    INSERT IGNORE INTO receptionist_assignments (user_id, building_id) VALUES
    ((SELECT id FROM users WHERE email = 'reception.economia@campusmate.local'), (SELECT id FROM buildings WHERE code = 'RM019')),
    ((SELECT id FROM users WHERE email = 'reception.giurisprudenza@campusmate.local'), (SELECT id FROM buildings WHERE code = 'CU002'));

    DELETE ra
    FROM receptionist_assignments ra
    INNER JOIN users u ON u.id = ra.user_id
    INNER JOIN buildings b ON b.id = ra.building_id
    WHERE u.email = 'reception.economia@campusmate.local'
      AND b.code = 'CU026';
  `);

  ok("Schema e utenti reception verificati");
}

function npmCommand() {
  return "npm";
}

function npmRun(args, cwd, stdio = "inherit") {
  return execFileSync(npmCommand(), args, {
    cwd,
    stdio,
    shell: process.platform === "win32"
  });
}

function installDependencies() {
  if (options.skipInstall) {
    ok("Installazione dipendenze saltata");
    return;
  }

  step("Installo dipendenze server");
  npmRun(["install"], serverDir);

  step("Installo dipendenze client");
  npmRun(["install"], clientDir);
}

function startProcess(name, cwd, commandArgs, port, envOverrides = {}) {
  return isPortOpen("127.0.0.1", port).then((open) => {
    if (open) {
      ok(`${name} gia raggiungibile sulla porta ${port}`);
      return null;
    }

    step(`Avvio ${name}`);

    const child = spawn(npmCommand(), commandArgs, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ...envOverrides
      }
    });

    child.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`${name} terminato con codice ${code}`);
      }
    });

    children.push(child);
    return child;
  });
}

async function waitForHttp(name, url) {
  step(`Attendo ${name}`);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url, {
        dispatcher: url.startsWith("https://") ? getInsecureHttpsDispatcher() : undefined
      });
      if (response.status >= 200 && response.status < 500) {
        ok(`${name} risponde su ${url}`);
        return;
      }
    } catch {
      await sleep(1000);
    }
  }

  throw new Error(`${name} non risponde su ${url}.`);
}

function getInsecureHttpsDispatcher() {
  try {
    const { Agent } = require("undici");
    return new Agent({ connect: { rejectUnauthorized: false } });
  } catch {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return undefined;
  }
}

function openBrowser(url) {
  if (options.noBrowser) return;

  const commands = {
    win32: ["cmd", ["/c", "start", "", url]],
    darwin: ["open", [url]],
    linux: ["xdg-open", [url]]
  };

  const selected = commands[process.platform];
  if (!selected) return;

  try {
    spawn(selected[0], selected[1], {
      detached: true,
      stdio: "ignore"
    }).unref();
  } catch {
    // Non bloccare l'avvio se il browser non si apre automaticamente.
  }
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

async function main() {
  assertCommand("docker");
  assertCommand("node");
  assertCommand("npm");

  await waitForDocker();
  await startMysqlContainer();
  await waitForMysql();
  initializeDatabase();
  installDependencies();

  const lanAddress = options.lan ? options.lanHost || getLanAddress() : "127.0.0.1";
  const frontendHost = options.lan ? "0.0.0.0" : "127.0.0.1";
  const frontendProtocol = options.lanHttps ? "https" : "http";
  const frontendUrl = `${frontendProtocol}://${lanAddress}:${config.clientPort}`;
  const backendUrl = `http://${lanAddress}:${config.serverPort}`;

  await startProcess("backend CampusMate", serverDir, ["run", "dev"], config.serverPort);
  await waitForHttp("backend CampusMate", `http://127.0.0.1:${config.serverPort}/api/health`);

  await startProcess("frontend CampusMate", clientDir, ["run", "dev", "--", "--host", frontendHost], config.clientPort, {
    CAMPUSMATE_HTTPS: options.lanHttps ? "1" : "0",
    VITE_API_BASE_URL: options.lanHttps ? "" : backendUrl,
    VITE_WEBSOCKET_URL: options.lanHttps ? `wss://${lanAddress}:${config.clientPort}/ws` : `ws://${lanAddress}:${config.serverPort}`
  });
  await waitForHttp("frontend CampusMate", `${frontendProtocol}://127.0.0.1:${config.clientPort}`);

  openBrowser(`${frontendProtocol}://127.0.0.1:${config.clientPort}`);

  console.log("");
  console.log("CampusMate e pronto.");
  console.log(`Frontend:  ${frontendProtocol}://127.0.0.1:${config.clientPort}`);
  console.log(`Backend:   http://127.0.0.1:${config.serverPort}`);
  if (options.lan) {
    console.log(`Rete LAN:  ${frontendUrl}`);
    console.log(`API LAN:   ${backendUrl}`);
    if (options.lanHttps) {
      console.log("iPad/Safari: apri la Rete LAN, accetta il certificato dev e poi avvia la camera.");
    }
  }
  console.log(`Database:  Docker container '${config.containerName}' su localhost:${config.mysqlPort}`);
  console.log("");
  console.log("Uso rapido:");
  console.log("  node start-campusmate.js");
  console.log("  node start-campusmate.js --lan");
  console.log("  node start-campusmate.js --lan-https");
  console.log("  node start-campusmate.js --lan-host=192.168.1.10");
  console.log("  node start-campusmate.js --reset-db");
  console.log("  node start-campusmate.js --skip-install");

  if (children.length > 0) {
    console.log("");
    console.log("Lascia aperto questo terminale. Premi Ctrl+C per fermare server e client avviati dallo script.");
  }
}

main().catch((error) => {
  shutdown();
  console.error("");
  console.error(`Errore: ${error.message}`);
  process.exit(1);
});
