import * as vscode from "vscode";
import { getSystemInfo, scanDynamicVersions, getEnvironmentVariables } from "./SystemInfo";

export class DevEnvTreeProvider implements vscode.TreeDataProvider<TreeItem> {

    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {

        if (!element) {
            // Root groups
            return [
                // new TreeItem("System Information", "group"),
                new TreeItem("Versions", "group"),
                new TreeItem("Environment Variables", "group"),
                // new TreeItem("Snapshots", "group")
            ];
        }

        if (element.label === "System Information") {
            const sys = getSystemInfo();
            return Object.entries(sys).map(([k, v]) => new TreeItem(`${k}: ${JSON.stringify(v)}`, "item"));

        } else if (element.label === "Versions") {
            const versions = await scanDynamicVersions();
            return versions.map(v => new TreeItem(`${v.name}: ${v.version}`, "item"));

        } else if (element.label === "Environment Variables") {
            const env = getEnvironmentVariables();
            return Object.entries(env).map(([k, v]) => new TreeItem(`${k} = ${v}`, "item"));

        } else if (element.label === "Snapshots") {
            return this.loadSnapshots();
        }

        return [];
    }

    private async loadSnapshots(): Promise<TreeItem[]> {
        const uri = vscode.workspace.getConfiguration().get<string>("devEnv.snapshotPath");

        const folder = uri ?? vscode.Uri.joinPath(
            vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(__dirname),
            "snapshots"
        ).fsPath;

        try {
            const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folder));

            return files
                .filter(([name, type]) => name.endsWith(".json"))
                .map(([name]) => new TreeItem(name, "snapshot"));

        } catch {
            return [new TreeItem("No snapshots found", "item")];
        }
    }

    getTreeItem(element: TreeItem) {
        return element;
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public kind: "group" | "item" | "snapshot"
    ) {
        super(
            label,
            kind === "group"
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );
    }
}
