import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { createPanelHtml } from "./viewHtml";
import { 
    getSystemInfo,
    scanDynamicVersions,
    getEnvironmentVariables
} from "./SystemInfo";
 
export function showSystemInfoPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        "devEnvDashboard",
        "Developer Environment Dashboard",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Load your manual HTML template
    panel.webview.html = createPanelHtml();

    panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.type === "load") {

            const os = getSystemInfo();
            const versions = await scanDynamicVersions();
            const env = getEnvironmentVariables();

            panel.webview.postMessage({
                type: "data",
                os,
                versions,
                env
            });
        }
    });
}

export async function saveEnvironmentSnapshot(context: vscode.ExtensionContext) {
    try {
        // Gather environment
        const system = getSystemInfo();
        const versions = await scanDynamicVersions();
        const env = getEnvironmentVariables();

        const snapshot = {
            createdAt: new Date().toISOString(),
            system,
            versions,
            env
        };

        // Determine snapshot directory
        const folder = path.join(context.globalStorageUri.fsPath, "snapshots");

        // Ensure directory exists
        await fs.promises.mkdir(folder, { recursive: true });

        // Create file name
        const fileName = "snapshot-" + Date.now() + ".json";
        const filePath = path.join(folder, fileName);

        // Save file
        await fs.promises.writeFile(
            filePath,
            JSON.stringify(snapshot, null, 4),
            "utf8"
        );

        // Offer to open it
        const open = "Open Snapshot";
        vscode.window
            .showInformationMessage(
                `Environment Snapshot saved:\n${filePath}`,
                open
            )
            .then(choice => {
                if (choice === open) {
                    vscode.workspace.openTextDocument(filePath).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });

    } catch (err: any) {
        vscode.window.showErrorMessage("Failed to save snapshot: " + err.message);
    }
}

