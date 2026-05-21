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
const options = {
  resetDatabase: args.has("--reset-db") || args.has("--reset-database"),
  skipInstall: args.has("--skip-install"),
  noBrowser: args.has("--no-browser")
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
      run("docker", ["exec", config.containerName, "mysqladmin", "ping", "-uroot", "--silent"]);
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
  return run("docker", ["exec", "-i", config.containerName, "mysql", "-uroot"], {
    input: sql
  });
}

function getTableCount() {
  const output = run("docker", [
    "exec",
    config.containerName,
    "mysql",
    "-uroot",
    "-N",
    "-B",
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
    return;
  }

  ok("Database campusmate gia inizializzato");
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

function startProcess(name, cwd, commandArgs, port) {
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
      env: process.env
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
      const response = await fetch(url);
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

  await startProcess("backend CampusMate", serverDir, ["start"], config.serverPort);
  await waitForHttp("backend CampusMate", `http://127.0.0.1:${config.serverPort}/api/health`);

  await startProcess("frontend CampusMate", clientDir, ["run", "dev", "--", "--host", "127.0.0.1"], config.clientPort);
  await waitForHttp("frontend CampusMate", `http://127.0.0.1:${config.clientPort}`);

  openBrowser(`http://127.0.0.1:${config.clientPort}`);

  console.log("");
  console.log("CampusMate e pronto.");
  console.log(`Frontend:  http://127.0.0.1:${config.clientPort}`);
  console.log(`Backend:   http://127.0.0.1:${config.serverPort}`);
  console.log(`Database:  Docker container '${config.containerName}' su localhost:${config.mysqlPort}`);
  console.log("");
  console.log("Uso rapido:");
  console.log("  node start-campusmate.js");
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
