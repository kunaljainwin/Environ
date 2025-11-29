export function getWebviewForDiff(diff: any): string {

    function row(label: string, type: string, oldV?: any, newV?: any) {
        const color =
            type === "added" ? "var(--vscode-terminal-ansiGreen)" :
            type === "removed" ? "var(--vscode-terminal-ansiRed)" :
            type === "changed" ? "var(--vscode-terminal-ansiYellow)" :
            "var(--vscode-disabledForeground)";

        const val =
            type === "added" ? `+ ${newV}` :
            type === "removed" ? `- ${oldV}` :
            type === "changed" ? `${oldV} → ${newV}` :
            oldV ?? newV;

        return `<div style="margin:4px;color:${color}"><b>${label}:</b> ${val}</div>`;
    }

    const system = diff.system.map(
        (        d: { key: string; type: string; oldValue: any; newValue: any; }) => row(d.key, d.type, d.oldValue, d.newValue)
    ).join("");

    const versions = diff.versions.map(
        (        d: { name: string; type: string; oldValue: any; newValue: any; }) => row(d.name, d.type, d.oldValue, d.newValue)
    ).join("");

    const env = diff.env.map(
        (        d: { key: string; type: string; oldValue: any; newValue: any; }) => row(d.key, d.type, d.oldValue, d.newValue)
    ).join("");

    return `
    <html>
    <body style="font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); padding:12px;">
        <h2>System Info</h2>
        ${system}

        <h2>Tool Versions</h2>
        ${versions}

        <h2>Environment Variables</h2>
        ${env}
    </body>
    </html>`;
}
