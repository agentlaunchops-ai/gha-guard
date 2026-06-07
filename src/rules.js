export const RULES = {
  unpinnedAction: {
    id: "GHA001",
    severity: "warning",
    title: "External action is not pinned to a commit SHA"
  },
  pullRequestTargetCheckout: {
    id: "GHA002",
    severity: "error",
    title: "pull_request_target workflow checks out repository code"
  },
  broadPermissions: {
    id: "GHA003",
    severity: "warning",
    title: "Workflow or job grants broad write permissions"
  },
  missingTimeout: {
    id: "GHA004",
    severity: "warning",
    title: "Job is missing timeout-minutes"
  },
  runExpression: {
    id: "GHA005",
    severity: "warning",
    title: "run step interpolates event or input data directly"
  }
};

export function makeFinding(rule, file, message, path) {
  return {
    ruleId: rule.id,
    severity: rule.severity,
    title: rule.title,
    file,
    path,
    message
  };
}
