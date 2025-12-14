import { startSpinner, stopSpinner } from "../ui/spinner.mjs";
import { pplx } from "../api/perplexity.mjs";
import { analyzeProject } from "../project/analysis.mjs";

export async function scaffold(type, name, settings) {
  const projectType = await analyzeProject();
  let template = "";
  let filename = "";

  if (projectType === "android" && type === "activity") {
    filename = `${name}Activity.kt`;
    template = `package com.example.app\n\nimport android.os.Bundle\nimport androidx.appcompat.app.AppCompatActivity\n\nclass ${name}Activity : AppCompatActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        // TODO: Set content view\n    }\n}`;
  } else if (projectType === "javascript" && type === "component") {
    filename = `${name}.jsx`;
    template = `import React from 'react';\n\nconst ${name} = () => {\n  return (\n    <div>\n      <h1>${name}</h1>\n    </div>\n  );\n};\n\nexport default ${name};`;
  } else {
    const sys = `Generate a ${type} template named ${name} for ${projectType}. Return ONLY code.`;
    const user = `Create ${type}: ${name}`;

    startSpinner("Generating");
    const { text } = await pplx([{ role: "system", content: sys }, { role: "user", content: user }], { settings });
    stopSpinner();

    template = text;
    filename = `${name}.${projectType === 'python' ? 'py' : projectType === 'java' ? 'java' : 'js'}`;
  }

  return { filename, content: template };
}
