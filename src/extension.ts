import * as vscode from "vscode";
import {
    showSystemInfoPanel,
    saveEnvironmentSnapshot,
    // generateParityScore
} from "./feature/environmentFeatures";

import {compareSnapshots} from "./feature/compareSnapshot"
import {DevEnvTreeProvider} from "./feature/sidebarView"
export function activate(context: vscode.ExtensionContext) {

    const treeProvider = new DevEnvTreeProvider();
    vscode.window.registerTreeDataProvider("devEnvSidebar", treeProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand("devEnvInfo.show", () => {
            showSystemInfoPanel(context);
        }),

        // vscode.commands.registerCommand("environ.checkVersions", () => {
        //     showVersionsPanel(context);
        // }),

        // vscode.commands.registerCommand("environ.showEnv", () => {
        //     showEnvPanel(context);
        // }),

        vscode.commands.registerCommand("environ.saveSnapshot", () => {
            saveEnvironmentSnapshot(context);
        }),
        vscode.commands.registerCommand("devEnv.refreshSidebar", () => {
            treeProvider.refresh();
        }),
        vscode.commands.registerCommand("environ.compareSnapshots", () => {
            compareSnapshots(context);
        }),
        // vscode.commands.registerCommand("environ.parityScore", () => {
        //     generateParityScore(context);
        // })
    );
}
