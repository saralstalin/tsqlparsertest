const express = require("express");
const { analyze } = require("@saralsql/tsql-parser");

const app = express();

app.use(express.json());
app.use(express.static("public"));

let latestResult = null;

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

function count(v) {
  if (!v) return 0;

  if (Array.isArray(v)) return v.length;

  if (typeof v === "object") return Object.keys(v).length;

  return 1;
}

function buildResult(sql) {
  const result = analyze(sql);

  const ast = safeJson(result.ast);
  const issues = safeJson(result.issues);
  const semanticDiagnostics = safeJson(result.semanticDiagnostics);
  const diagnostics = safeJson(result.diagnostics);
  const scope = safeJson(result.scope?.root);
  const lineage = safeJson(result.lineage?.edges);
  const columns = safeJson(result.columns?.resolutions);

  latestResult = {
    ast,
    issues,
    semanticDiagnostics,
    diagnostics,
    scope,
    lineage,
    columns
  };

  return latestResult;
}

/*
|--------------------------------------------------------------------------
| Original endpoint (keeps old index.html working)
|--------------------------------------------------------------------------
*/
app.post("/parse", (req, res) => {
  try {
    const sql = req.body.sql || "";
    const data = buildResult(sql);

    res.json({
      success: true,
      ast: data.ast,
      issues: data.issues,
      semanticDiagnostics: data.semanticDiagnostics,
      diagnostics: data.diagnostics,
      scope: { root: data.scope },
      lineage: { edges: data.lineage },
      columns: { resolutions: data.columns }
    });

  } catch (err) {
    res.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

/*
|--------------------------------------------------------------------------
| Fast summary endpoint
|--------------------------------------------------------------------------
*/
app.post("/parse-summary", (req, res) => {
  try {
    const sql = req.body.sql || "";
    const data = buildResult(sql);

    res.json({
      success: true,
      summary: {
        issues: count(data.issues),
        semanticDiagnostics: count(data.semanticDiagnostics),
        diagnostics: count(data.diagnostics),
        lineageEdges: count(data.lineage),
        columnResolutions: count(data.columns),
        astReady: !!data.ast,
        scopeReady: !!data.scope
      }
    });

  } catch (err) {
    res.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

/*
|--------------------------------------------------------------------------
| Details endpoint
|--------------------------------------------------------------------------
*/
app.get("/details/:section", (req, res) => {
  try {
    const section = req.params.section;

    if (!latestResult) {
      return res.json({
        success: false,
        error: "No parse result available"
      });
    }

    res.json({
      success: true,
      data: latestResult[section] ?? null
    });

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