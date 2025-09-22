// UTILITIES

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));


const output = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'rohit-code-editor-web';

const espaceHtml = str => String(str).replace(/[&<>"']/g, m => ({
  '&': "&amp;",
  '<': "&lt;",
  '>': "&gt;",
  '"': "&quot;",
}[m] ));


function log(msg, type="info") {
  const color = type === "error" ? "var(--err)" : (type === "warn" ? "var(--warn)" : "var(--brand)" );
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');

  line.innerHTML  = `<span style="color: ${color}">[${time}]</span> ${espaceHtml(msg)}`;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  output.innerHTML = '';
}

$("#clearLog")?.addEventListener('click', clearOutput);

function makeEditor(id, mode,) {
  const ed = ace.edit(id, {
    theme: "ace/theme/dracula",
    mode,
    tabSize: 2,
     useSoftTabs: true,
     showPrintMargin: false,
     wrap: true
  });

  ed.session.setUseWrapMode(true);
  ed.commands.addCommand({
    name : "run",
    bindKey : {win: "Ctrl-Enter", mac: "Command-Enter"},
    exec(){
      runWeb(false);
    }
  });

  ed.commands.addCommand({
    name : "save",
    bindKey : {win: "Ctrl-S", mac: "Command-S"},
    exec(){
      saveProject();
    }
  });

  return ed;
}

const ed_html = makeEditor("ed_html", "ace/mode/html");
const ed_css = makeEditor("ed_css", "ace/mode/css");
const ed_js = makeEditor("ed_js", "ace/mode/javascript");

const TAB_ORDER = ["html", "css", "js"];

const wraps = Object.fromEntries($$("#webEditors .editor-wrap").map(w => [w.dataset.pane, w]));

const editors = {
  html: ed_html,
  css: ed_css,
  js: ed_js
};

function activePane() {
  const t = $$("#webTabs .tab.active")[0];

  return t ? t.dataset.pane : "html";
}

function showPane(name) {
  TAB_ORDER.forEach(k => {
    if(wraps[k]) {
      wraps[k].hidden = k !== name;
    }
  });

  $$("#webTabs .tab").forEach(t => {
    const on = t.dataset.pane === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
    t.tabindex = on ? 0 : -1;
  }); 

  requestAnimationFrame(() => {
    const ed = editors[name];
    if(ed && ed.resize) {
      ed.resize(true);
      ed.focus();
    }
  });
}

$("#webTabs")?.addEventListener('click', e => {
  const t = e.target.closest('.tab');
  if(t && t.dataset.pane) {
    showPane(t.dataset.pane);
  }
});

$("#webtabs")?.addEventListener('keydown', e => {
  const idx = TAB_ORDER.indexOf(activePane());
  if(e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const delta = e.key === "ArrowLeft" ? -1 : 1;
    showPane(TAB_ORDER[(idx + delta + TAB_ORDER.length) % TAB_ORDER.length]);
  }
});

showPane("html");

function buildWebSrcDoc(withTests = false) {
  const html = ed_html.getValue();
  const css = ed_css.getValue();
  const js = ed_js.getValue();
  const tests = ($("#testArea")?.value || "").trim();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
        ${withTests && tests ? `\n/*tests */\n${tests}` : ''};
      } catch(err) {
        document.body.innerHTML += '<div style="color: red; font-weight: bold;">' + err.message + '</div>';
        console.error(err);
      }
    </script>
  </body>
  </html>
  `;
}

function runWeb(withTests = false) {
  preview.srcdoc = buildWebSrcDoc(withTests);
  log(withTests ? "Run with tests" : "Web Preview Updated");
}

$("#runWeb")?.addEventListener('click', () => runWeb(false));
$("#runTests")?.addEventListener('click', () => runWeb(true));

$("openPreview")?.addEventListener('click', () => {
  const src = buildWebSrcDoc(false);
  
  const w = window.open("about:blank");

  w.document.open();
  w.document.write(src);
  w.document.close();
});

function projectJSON() {
  return {
    version: 1,
    kind: 'web-only',
    assignMent: $("#assignment")?.value || "",
    test: $("#testArea")?.value || "",
    html: ed_html.getValue(),
    css: ed_css.getValue(),
    js: ed_js.getValue(), 
  };
}

function loadProject(obj) {
  try{
    if($("assignment") && obj.assignment) {
      $("assignment").value = obj.assignment || "";
    }

    if($("testArea") && obj.test) {
      $("testArea").value = obj.test || "";
    }
    ed_html.setValue(obj.html || "", -1);
    ed_css.setValue(obj.css || "", -1);
    ed_js.setValue(obj.js || "", -1);
    log("Project loaded");
    showPane("html");
  
  } catch(err){
    log("Unable to load project: " + e, "error");
  }
}

function setDefaultContent() {
  ed_html.setValue(`<!-- Write your HTML here -->`, -1);
  ed_css.setValue(`/* Write your CSS here */`, -1);
  ed_js.setValue(`// Write your JavaScript here`, -1);
}

function saveProject() {
  try {
    const data = JSON.stringify(projectJSON(), null, 2);
    localStorage.setItem(STORAGE_KEY, data);

    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "project.json";
    a.click();
    log("Saved locally and downloaded JSON file");
    
  } catch (error) {
    log("Unable to save project: " + error, "error");
  }
}

$("#savebtn")?.addEventListener('click', saveProject);
$("loadBtn")?.addEventListener('click', () => $("#loadFile")?.click());
$("openFile")?.addEventListener('change', async(e) => {
  const file = e.target.files?.[0];
  if(!file) {
    return;
  }

  try{
    const obj = JSON.parse(await file.text());
    loadProject(obj);
  
  } catch(err){
    log("Invalid project file: " + e, "error");
  }
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const cache = localStorage.getItem(STORAGE_KEY);
    if(cache) {
      const obj = JSON.parse(cache);
      loadProject(obj);
    } else {
      setDefaultContent();
      log("Welcome! Start coding your web project.");
    }
    
  } catch (error) {
    setDefaultContent();
  }
  
  log("Ready - Web Only Editor (HTML/CSS/JS)");
});
