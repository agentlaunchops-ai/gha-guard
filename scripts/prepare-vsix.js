import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, ".vscode-extension");

const sourcePackage = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const extensionPackage = {
  ...sourcePackage,
  name: "gha-guard",
  displayName: "GHA Guard",
  publisher: "agentlaunchops",
  repository: {
    type: "git",
    url: "https://github.com/agentlaunchops-ai/gha-guard.git"
  },
  bugs: {
    url: "https://github.com/agentlaunchops-ai/gha-guard/issues"
  },
  homepage: "https://github.com/agentlaunchops-ai/gha-guard#readme",
  files: ["src", "docs", "README.md", "LICENSE", "PUBLISH_CHECKLIST.md"],
  private: true,
  bin: undefined,
  scripts: undefined,
  devDependencies: undefined
};

await fs.rm(output, { force: true, recursive: true });
await fs.mkdir(path.join(output, "src"), { recursive: true });
await fs.mkdir(path.join(output, "docs"), { recursive: true });

await fs.writeFile(path.join(output, "package.json"), `${JSON.stringify(extensionPackage, null, 2)}\n`);

for (const file of ["README.md", "LICENSE", "PUBLISH_CHECKLIST.md"]) {
  await fs.copyFile(path.join(root, file), path.join(output, file));
}

await fs.copyFile(path.join(root, "docs", "LICENSE_SERVER.md"), path.join(output, "docs", "LICENSE_SERVER.md"));

for (const file of ["extension.js", "extension-core.js", "scanner.js", "rules.js"]) {
  await fs.copyFile(path.join(root, "src", file), path.join(output, "src", file));
}
