import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getWebviewForDiff } from "./diffView";

export async function compareSnapshots(context: vscode.ExtensionContext) {
    try {
        const folder = path.join(context.globalStorageUri.fsPath, "snapshots");

        if (!fs.existsSync(folder)) {
            vscode.window.showErrorMessage("No snapshots saved yet.");
            return;
        }

        // Let the user pick Snapshot 1
        const snap1 = await selectSnapshot(folder, "Select first snapshot");
        if (!snap1) return;

        // Let the user pick Snapshot 2
        const snap2 = await selectSnapshot(folder, "Select second snapshot");
        if (!snap2) return;

        // Load JSON
        const json1 = JSON.parse(fs.readFileSync(snap1, "utf-8"));
        const json2 = JSON.parse(fs.readFileSync(snap2, "utf-8"));

        // Create diff
        const diff = {
            system: diffObjects(json1.system, json2.system),
            versions: diffList(json1.versions, json2.versions),
            env: diffObjects(json1.env, json2.env)
        };

        // Launch diff panel
        const panel = vscode.window.createWebviewPanel(
            "envDiff",
            "Environment Snapshot Diff",
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewForDiff(diff);

    } catch (err: any) {
        vscode.window.showErrorMessage("Snapshot comparison failed: " + err.message);
    }
}

async function selectSnapshot(folder: string, placeholder: string) {
    const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));

    if (files.length === 0) {
        vscode.window.showErrorMessage("No snapshots found.");
        return null;
    }

    const pick = await vscode.window.showQuickPick(files, {
        placeHolder: placeholder
    });

    return pick ? path.join(folder, pick) : null;
}

// Compare flat objects
function diffObjects(a: any, b: any) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

    const result: any[] = [];

    for (const key of keys) {
        if (!(key in a)) {
            result.push({ key, type: "added", newValue: b[key] });
        } else if (!(key in b)) {
            result.push({ key, type: "removed", oldValue: a[key] });
        } else if (a[key] !== b[key]) {
            result.push({ key, type: "changed", oldValue: a[key], newValue: b[key] });
        } else {
            result.push({ key, type: "same", value: a[key] });
        }
    }

    return result;
}

// Compare version arrays
function diffList(a: any[], b: any[]) {
    const mapA = new Map(a.map(x => [x.name, x.version]));
    const mapB = new Map(b.map(x => [x.name, x.version]));

    const result: any[] = [];
    const names = new Set([...mapA.keys(), ...mapB.keys()]);

    for (const name of names) {
        const v1 = mapA.get(name);
        const v2 = mapB.get(name);

        if (!v1) {
            result.push({ name, type: "added", newValue: v2 });
        } else if (!v2) {
            result.push({ name, type: "removed", oldValue: v1 });
        } else if (v1 !== v2) {
            result.push({ name, type: "changed", oldValue: v1, newValue: v2 });
        } else {
            result.push({ name, type: "same", value: v1 });
        }
    }

    return result;
}
