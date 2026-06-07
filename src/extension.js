import path from "node:path";
import * as vscode from "vscode";
import { scanPath, scanWorkflowFile } from "./scanner.js";
import { findingToDiagnostic, findingsSummary, isWorkflowPath } from "./extension-core.js";

let diagnosticCollection;

export function activate(context) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection("gha-guard");
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    vscode.commands.registerCommand("ghaGuard.scanWorkspace", async () => {
      const folders = vscode.workspace.workspaceFolders || [];
      if (folders.length === 0) {
        vscode.window.showInformationMessage("GHA Guard: open a workspace folder to scan.");
        return;
      }

      const findings = [];
      for (const folder of folders) {
        findings.push(...(await scanPath(folder.uri.fsPath)));
      }

      await refreshWorkspaceDiagnostics(folders);
      vscode.window.showInformationMessage(findingsSummary(findings));
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => refreshDocumentDiagnostics(document)),
    vscode.workspace.onDidSaveTextDocument((document) => refreshDocumentDiagnostics(document)),
    vscode.workspace.onDidCloseTextDocument((document) => diagnosticCollection.delete(document.uri))
  );

  for (const document of vscode.workspace.textDocuments) {
    refreshDocumentDiagnostics(document);
  }
}

export function deactivate() {
  diagnosticCollection?.dispose();
}

async function refreshWorkspaceDiagnostics(folders) {
  for (const folder of folders) {
    const workflowUris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, ".github/workflows/*.{yml,yaml}"),
      "**/node_modules/**"
    );

    for (const uri of workflowUris) {
      await refreshFileDiagnostics(uri, folder.uri.fsPath);
    }
  }
}

async function refreshDocumentDiagnostics(document) {
  if (document.uri.scheme !== "file" || !isWorkflowPath(document.uri.fsPath)) {
    return;
  }

  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  await refreshFileDiagnostics(document.uri, folder?.uri.fsPath || path.dirname(document.uri.fsPath));
}

async function refreshFileDiagnostics(uri, rootPath) {
  try {
    const findings = await scanWorkflowFile(uri.fsPath, rootPath);
    diagnosticCollection.set(
      uri,
      findings.map((finding) => toVsCodeDiagnostic(finding))
    );
  } catch (error) {
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 1),
      `GHA Guard: ${error.message}`,
      vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = "gha-guard";
    diagnosticCollection.set(uri, [diagnostic]);
  }
}

function toVsCodeDiagnostic(finding) {
  const plain = findingToDiagnostic(finding);
  const severity =
    plain.severity === "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(
      plain.range.start.line,
      plain.range.start.character,
      plain.range.end.line,
      plain.range.end.character
    ),
    plain.message,
    severity
  );
  diagnostic.source = plain.source;
  diagnostic.code = plain.code;
  return diagnostic;
}
