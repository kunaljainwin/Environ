import * as vscode from "vscode";

export function createPanelHtml(): string {

    // Minimal CSP needed since your HTML uses inline script
    const csp = `
        default-src 'none';
        img-src vscode-resource: ${'*'}; 
        script-src 'unsafe-inline';
        style-src 'unsafe-inline';
        font-src 'unsafe-inline';
    `.trim();

    return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }

        h1 {
            font-size: 1.4rem;
            margin-bottom: 18px;
            font-weight: 600;
        }

        h2 {
            margin-top: 24px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 6px;
            font-size: 1.1rem;
            display: flex;
            justify-content: space-between;
            cursor: pointer;
        }

        .section {
            display: none;
            padding: 12px;
            margin-top: 12px;
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            animation: fadeIn 150ms ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-3px); }
            to { opacity: 1; transform: translateY(0); }
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th, td {
            padding: 6px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        tr:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .chevron {
            transition: transform 140ms ease;
        }

        .input {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 6px;
            width: 100%;
            border-radius: 4px;
            margin-bottom: 10px;
        }

        .row {
            margin: 4px 0;
        }
        .key {
            font-weight: 600;
        }
    </style>
</head>

<body>
    <h1>Developer Environment Inspector</h1>

    <!-- SYSTEM INFO -->
    <h2 id="sysHeader">System Information <span class="chevron">▾</span></h2>
    <div id="sysSection" class="section">
        <div id="sysInfo"></div>
    </div>

    <!-- VERSIONS -->
    <h2 id="verHeader">Tool Versions <span class="chevron">▾</span></h2>
    <div id="verSection" class="section">
        <input class="input" id="verSearch" placeholder="Search tools…">
        <table id="verTable"></table>
    </div>

    <!-- ENVIRONMENT -->
    <h2 id="envHeader">Environment Variables <span class="chevron">▾</span></h2>
    <div id="envSection" class="section">
        <input class="input" id="envSearch" placeholder="Search variables…">
        <table id="envTable"></table>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        vscode.postMessage({ type: "load" });

        function toggle(id, headerId) {
            const el = document.getElementById(id);
            const header = document.getElementById(headerId);
            const chev = header.querySelector(".chevron");
            const open = el.style.display === "block";
            el.style.display = open ? "none" : "block";
            chev.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
        }

        document.getElementById("sysHeader").onclick = () => toggle("sysSection", "sysHeader");
        document.getElementById("verHeader").onclick = () => toggle("verSection", "verHeader");
        document.getElementById("envHeader").onclick = () => toggle("envSection", "envHeader");

        window.addEventListener("message", (event) => {
            const msg = event.data;
            if (msg.type !== "data") return;

            renderSystem(msg.os);
            renderVersions(msg.versions);
            renderEnv(msg.env);
        });

        function renderSystem(info) {
            const out = [
                ["Platform", info.platform],
                ["Distro", info.distro],
                ["Kernel", info.kernel],
                ["Arch", info.arch],
                ["CPU Count", info.cpus.count],
                ["CPU Model", info.cpus.model],
                ["Memory", info.memory.totalMB + " MB"],
                ["Free Memory", info.memory.freeMB + " MB"],
                ["Hostname", info.hostname]
            ];

            document.getElementById("sysInfo").innerHTML = out
                .map(([k,v]) => \`<div class="row"><span class="key">\${k}:</span> \${v}</div>\`)
                .join("");
        }

        function renderVersions(list) {
            const header = "<tr><th>Tool</th><th>Version</th></tr>";
            const rows = list.map(i => \`<tr><td>\${i.name}</td><td>\${i.version}</td></tr>\`);
            document.getElementById("verTable").innerHTML = header + rows.join("");
        }

        function renderEnv(env) {
            const header = "<tr><th>Variable</th><th>Value</th></tr>";
            const rows = Object.entries(env).map(([k,v]) =>
                \`<tr><td>\${k}</td><td>\${v}</td></tr>\`
            );
            document.getElementById("envTable").innerHTML = header + rows.join("");
        }

        function filter(tableId, query) {
            const q = query.toLowerCase();
            const rows = document.querySelectorAll("#" + tableId + " tr");
            rows.forEach((row,i) => {
                if (i===0) return;
                row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
            });
        }

        document.getElementById("verSearch").oninput = e => filter("verTable", e.target.value);
        document.getElementById("envSearch").oninput = e => filter("envTable", e.target.value);
    </script>
</body>
</html>`;
}
