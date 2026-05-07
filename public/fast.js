console.log("fast playground loaded");

let timer;

async function loadDetails(section) {
  const title = document.getElementById("detailTitle");
  const details = document.getElementById("details");

  title.textContent = section;
  details.textContent = "Loading...";

  const res = await fetch(`/details/${section}`);
  const json = await res.json();

  if (!json.success) {
    details.textContent = json.error;
    return;
  }

  details.textContent =
    JSON.stringify(json.data, null, 2);
}

function card(label, value, section) {
  return `
    <div class="card" onclick="loadDetails('${section}')">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `;
}

async function parse() {
  const started = performance.now();

  try {
    const sql = document.getElementById("sql").value;

    const res = await fetch("/parse-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql })
    });

    const data = await res.json();

    document.getElementById("time").textContent =
      `${(performance.now() - started).toFixed(2)} ms`;

    const summary = document.getElementById("summary");

    if (!data.success) {
      summary.innerHTML = `<pre>${data.error}</pre>`;
      return;
    }

    const s = data.summary;

    summary.innerHTML =
      card("Parser Issues", s.issues, "issues") +
      card("Semantic Diagnostics", s.semanticDiagnostics, "semanticDiagnostics") +
      card("Combined Diagnostics", s.diagnostics, "diagnostics") +
      card("Lineage Edges", s.lineageEdges, "lineage") +
      card("Column Resolutions", s.columnResolutions, "columns") +
      card("AST", s.astReady ? "Ready" : "No", "ast") +
      card("Scope", s.scopeReady ? "Ready" : "No", "scope");
  }
  catch(err){
    document.getElementById("summary").innerHTML =
      `<pre>${err}</pre>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sql = document.getElementById("sql");

  sql.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(parse, 350);
  });

  parse();
});