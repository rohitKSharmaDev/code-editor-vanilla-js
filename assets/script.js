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
    theme: "ace/theme/monokai",
    mode,
    tabsize: 2,
     usesofttabs: true,
     showprintmargin: false,
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

const TAB_ORDER = ["htnkl", "css", "js"];

const wraps = Object.fromEntries($$("webEditors .editorWrap").map(w => [w.dataset.pane, w]));

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

  $$("webTabs .tab").forEach(t => {
    const on = t.dataset.pane === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
    t.tabindex = on ? 0 : -1;
  }); 
}

