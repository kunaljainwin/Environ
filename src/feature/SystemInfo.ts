import * as os from "os";
import * as fs from "fs";
import { exec } from "child_process";

export interface DynamicVersion {
    name: string;
    version: string;
}

export interface SystemInfo {
    platform: string;
    distro: string | null;
    kernel: string;
    arch: string;
    cpus: { count: number; model: string };
    memory: { totalMB: number; freeMB: number };
    hostname: string;
}

// -------- OS INFO ----------
export function getSystemInfo(): SystemInfo {
    const platform = os.platform();
    const release = os.release();
    const arch = os.arch();
    const hostname = os.hostname();

    const cpu = os.cpus();
    const cpus = {
        count: cpu.length,
        model: cpu[0]?.model ?? "Unknown"
    };

    const memory = {
        totalMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMB: Math.round(os.freemem() / 1024 / 1024)
    };

    let distro: string | null = null;

    if (platform === "linux") {
        try {
            const osRelease = fs.readFileSync("/etc/os-release", "utf8");
            distro = /PRETTY_NAME="(.+)"/.exec(osRelease)?.[1] ?? null;
        } catch {}
    }

    if (platform === "darwin") distro = "macOS";
    if (platform === "win32") distro = "Windows";

    return { platform, distro, kernel: release, arch, cpus, memory, hostname };
}

// -------- VERSION SCANNER ----------
function execPromise(cmd: string): Promise<string | null> {
    return new Promise(resolve => {
        exec(cmd, { timeout: 1500 }, (err, stdout) => {
            if (err) return resolve(null);
            resolve(stdout?.trim() || null);
        });
    });
}

const windowsTools = [
    // 🧱 Core languages & runtimes
    "node", "npm", "npx",
    "python", "python3", "py", "pip", "pip3",
    "ruby", "gem",
    "perl",
    "php", 
    "java", "javac", "javadoc", "jar",
    "kotlinc",
    "scala", "scalac",
    "groovy",
    "go",
    "rustc", "cargo",
    "dart",
    "deno",
    "bun",
    "luajit", "lua",

    // 🧰 Build tools
    "make", "nmake",
    "cmake",
    "ninja",
    "gradle", "gradlew",
    "mvn", "mvn.cmd",
    "ant",

    // 📦 Package managers
    "winget",
    "choco", "choco.exe",
    "scoop",
    "conda", "mamba",
    "yarn", "yarnpkg",
    "pnpm",
    "pipenv",
    "poetry",

    // 🏗️ DevOps / Cloud CLIs
    "docker", "docker-compose",
    "kubectl",
    "helm",
    "terraform",
    "aws",
    "az",
    "gcloud",
    "doctl", // DigitalOcean
    "flyctl",

    // 🗄️ Databases & DB Tools
    "mysql",
    "mysqldump",
    "psql",
    "pg_dump",
    "sqlite3",
    "mongosh", "mongo",
    "redis-cli",
    "cqlsh", // Cassandra
    "sqlcmd", // Microsoft SQL

    // 🛠️ Version control
    "git", "gh", // GitHub CLI
    "glab", // GitLab CLI

    // 🌐 Networking tools
    "curl",
    "wget",
    "http", // HTTPie
    "openssl",
    "netstat",
    "whois",
    "dig",
    "nslookup",

    // 🐳 Container/VM
    "vagrant",
    "minikube",
    "kind",

    // ⚙️ System scripting tools
    "powershell",
    "pwsh",
    "bash",
    "zsh",
    "fish",

    // 📁 File/Process tools
    "7z",
    "tar",
    "gzip",
    "gunzip",
    "zip",
    "unzip",

    // 🧪 Testing tools
    "jest",
    "mocha",
    "vitest",
    "pytest",
    "nosetests",

    // 🧬 AI/ML tools
    "uv",
    "pipx",
    "huggingface-cli",
    "ollama",

    // 📦 Misc dev utilities
    "eslint",
    "prettier",
    "ts-node",
    "tsc",
    "webpack",
    "rollup",
    "vite",
    "eslint",
    "prettier",
    "nodemon",
    "pm2",

    // 📝 Formatters / Linters
    "black",
    "flake8",
    "mypy",
    "ruff",
    "pylint"
];

function extractVersion(str: string): string {
    const m = str.match(/\d+(\.\d+)+/);
    return m ? m[0] : str;
}

export async function scanDynamicVersions(): Promise<DynamicVersion[]> {
    const isWin = os.platform() === "win32";
    const tools = isWin ? windowsTools : process.env.PATH!.split(":");

    const tasks = tools.map(name => async () => {
        const out = await execPromise(`${name} --version`);
        return out ? { name, version: extractVersion(out) } : null;
    });

    const results = await Promise.all(tasks.map(t => t()));
    return results.filter(Boolean) as DynamicVersion[];
}

export function getEnvironmentVariables(): Record<string, string | undefined> {
    return process.env as Record<string, string | undefined>;
}
