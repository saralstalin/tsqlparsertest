const express = require("express");
const { analyze } = require("@saralsql/tsql-parser");

const app = express();

app.use(express.json());
app.use(express.static("public"));

function safeJson(value) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(value, (key, val) => {
    if (val && typeof val === "object") {
      if (seen.has(val)) {
        return "[Circular]";
      }
      seen.add(val);
    }

    if (["parent", "_parent", "node"].includes(key)) {
      return undefined;
    }

    return val;
  }));
}

app.post("/parse", (req, res) => {
  try {
    const sql = req.body.sql || "";

    // Analyze using the new public API
    const result = analyze(sql);

    // Log sections separately
    console.log("\n=== AST ===");
    console.log(result.ast);

    console.log("\n=== Parser Issues ===");
    console.log(result.issues);

    console.log("\n=== Semantic Diagnostics ===");
    console.log(result.semanticDiagnostics);

    console.log("\n=== Combined Diagnostics ===");
    console.log(result.diagnostics);

    console.log("\n=== Scope Root ===");
    console.log(result.scope.root);

    console.log("\n=== Lineage Edges ===");
    console.log(result.lineage.edges);

    console.log("\n=== Column Resolutions ===");
    console.log(result.columns.resolutions);

    const responseBody = {
      success: true,
      ast: safeJson(result.ast),
      issues: safeJson(result.issues),
      semanticDiagnostics: safeJson(result.semanticDiagnostics),
      diagnostics: safeJson(result.diagnostics),
      scope: {
        root: safeJson(result.scope.root)
      },
      lineage: {
        edges: safeJson(result.lineage.edges)
      },
      columns: {
        resolutions: safeJson(result.columns.resolutions)
      }
    };

    res.json(responseBody);

  } catch (err) {
    res.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});