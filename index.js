const express = require("express");
const {
  Lexer,
  Parser,
  ScopeBuilder,
  diagnose
} = require("@saralsql/tsql-parser");

const expressApp = require("express");
const app = expressApp();

app.use(expressApp.json());
app.use(expressApp.static("public"));

app.post("/parse", (req, res) => {
  try {
    const sql = req.body.sql || "";

    const parser = new Parser(new Lexer(sql));
    const parseResult = parser.parse();   // raw result
    const ast = parseResult.ast;

    const scope = new ScopeBuilder().build(ast);
    const diagnostics = diagnose(ast, scope);

    res.json({
      success: true,
      parseResult,     // raw parser output
      diagnostics,
      scope: {
        undeclared: scope.undeclared,
        duplicates: scope.duplicates
      }
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});