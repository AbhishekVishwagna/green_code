var express = require("express");
var analyzeCode = require("./auditor-engine.cjs").analyzeCode;
var app     = express();
app.use(express.json({ limit: "2mb" }));

var badges       = new Map();
var certificates = new Map();

// Use the same compiled auditor engine as the React localhost app.
app.post("/audit", function(req, res) {
  var code = req.body && typeof req.body.code === "string" ? req.body.code : "";
  if (!code.trim()) return res.status(400).json({ error: "Missing Python code" });
  try {
    res.json(analyzeCode(code));
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : "Audit failed" });
  }
});

// ── GET / — GSCS Portal homepage ─────────────────────────────────────────────
app.get("/", function(_req, res) {
  res.setHeader("Content-Type", "text/html");
  res.send([
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>",
    "<meta name='viewport' content='width=device-width,initial-scale=1'>",
    "<title>Green Code</title>",
    "<style>",
    "* { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { background: #060e06; color: #c8e8c8; font-family: 'JetBrains Mono', monospace;",
    "  min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }",
    ".card { max-width: 600px; width: 100%; }",
    ".logo { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }",
    ".logo-title { font-size: 22px; font-weight: 700; color: #00e887; letter-spacing: 1px; }",
    ".logo-sub { font-size: 10px; color: #4a7a4a; letter-spacing: 3px; margin-top: 3px; }",
    "h1 { font-size: 24px; font-weight: 700; color: #e0f0e0; line-height: 1.3; margin-bottom: 12px; }",
    ".tagline { font-size: 13px; color: #7bd4a0; line-height: 1.8; margin-bottom: 24px; }",
    ".badge { display: inline-flex; align-items: center; gap: 8px; background: #00e88710;",
    "  border: 1px solid #00e88730; border-radius: 20px; padding: 6px 16px;",
    "  margin-bottom: 28px; font-size: 11px; color: #00e887; }",
    ".panel { background: #0a1a0a; border: 1px solid #1a3a1a; border-radius: 12px; padding: 20px; margin-bottom: 20px; }",
    ".panel h2 { font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #4a7a4a; margin-bottom: 14px; }",
    ".ep { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }",
    ".ep:last-child { margin-bottom: 0; }",
    ".method { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }",
    ".get { background: #00e88720; color: #00e887; border: 1px solid #00e88740; }",
    ".post { background: #7bd4a020; color: #7bd4a0; border: 1px solid #7bd4a040; }",
    ".ep-path { font-size: 12px; color: #c8e8c8; font-weight: 700; }",
    ".ep-desc { font-size: 11px; color: #4a7a4a; margin-top: 2px; }",
    ".try-btn { display: inline-flex; align-items: center; gap: 8px; background: #00e887;",
    "  color: #060e06; border: none; border-radius: 8px; padding: 12px 28px;",
    "  font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer;",
    "  text-decoration: none; margin-bottom: 24px; }",
    ".status { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #4a7a4a; margin-bottom: 16px; }",
    ".dot { width: 8px; height: 8px; border-radius: 50%; background: #00e887; box-shadow: 0 0 6px #00e887; }",
    ".footer { font-size: 10px; color: #2a4a2a; text-align: center; line-height: 1.8; }",
    "</style></head><body>",
    "<div class='card'>",
    "  <div class='logo'>",
    "    <div style='font-size:44px'>&#127807;</div>",
    "    <div><div class='logo-title'>Green Code</div><div class='logo-sub'>CARBON-AWARE CODE AUDITING</div></div>",
    "  </div>",
    "  <h1>Audit your Python code's carbon footprint</h1>",
    "  <p class='tagline'>Green Code analyses Python source code for computational inefficiencies, awards Green Credits, estimates CO&#8322; saved, and generates shareable badges and certificates.</p>",
    "  <div class='badge'>&#9889; Powered by BrowserPod &mdash; Node.js running in your browser via WebAssembly</div>",
    "  <a href='/audit' class='try-btn'>&#9654; Try Live Audit</a>",
    "  <div class='panel'>",
    "    <h2>API Endpoints</h2>",
    "    <div class='ep'><span class='method get'>GET</span><div><div class='ep-path'>/audit</div><div class='ep-desc'>Live Python code auditor &mdash; try it directly in your browser</div></div></div>",
    "    <div class='ep'><span class='method post'>POST</span><div><div class='ep-path'>/badge</div><div class='ep-desc'>Register an audit result and get a shareable badge URL</div></div></div>",
    "    <div class='ep'><span class='method get'>GET</span><div><div class='ep-path'>/badge/:id</div><div class='ep-desc'>View a Green Software certification badge</div></div></div>",
    "    <div class='ep'><span class='method post'>POST</span><div><div class='ep-path'>/certificate</div><div class='ep-desc'>Register a project scan and get a printable certificate URL</div></div></div>",
    "    <div class='ep'><span class='method get'>GET</span><div><div class='ep-path'>/certificate/:id</div><div class='ep-desc'>View a full project sustainability certificate</div></div></div>",
    "  </div>",
    "  <div class='status'><div class='dot'></div><span>Pod server running &middot; BrowserPod WebAssembly &middot; port 3000</span></div>",
    "  <div class='footer'>Green Code &copy; 2026 &middot; AI in the Box Hackathon, University of Leeds<br>Powered by <strong style='color:#7bd4a0'>BrowserPod</strong> by Leaning Technologies</div>",
    "</div></body></html>"
  ].join("\n"));
});

// ── GET /audit — standalone shareable audit page ──────────────────────────────
// Self-contained: auditor engine is inlined as JS. No React, no build needed.
// Anyone with the portal URL can visit /audit and analyse Python code.
app.get("/audit", function(_req, res) {
  res.setHeader("Content-Type", "text/html");
  res.send([
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>",
    "<meta name='viewport' content='width=device-width,initial-scale=1'>",
    "<title>Green Code Live Audit</title>",
    "<style>",
    "* { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { background: #060e06; color: #c8e8c8; font-family: 'JetBrains Mono', monospace; min-height: 100vh; }",
    ".layout { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }",
    "@media(max-width:700px){ .layout { grid-template-columns: 1fr; } }",
    ".left { display: flex; flex-direction: column; border-right: 1px solid #1a3a1a; }",
    ".topbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #0a1a0a; border-bottom: 1px solid #1a3a1a; }",
    ".brand { font-size: 13px; font-weight: 700; color: #00e887; }",
    ".run-btn { padding: 6px 18px; background: #00e887; color: #060e06; border: none; border-radius: 6px; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }",
    ".run-btn:disabled { opacity: 0.5; cursor: not-allowed; }",
    "textarea { flex: 1; width: 100%; background: #060e06; color: #c8e8c8; border: none; outline: none; padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; resize: none; min-height: 400px; }",
    ".right { overflow-y: auto; padding: 20px; background: #060e06; }",
    ".placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #2a4a2a; text-align: center; padding: 40px; }",
    ".score-row { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }",
    ".score-dial { width: 90px; height: 90px; }",
    ".grade-badge { font-size: 28px; font-weight: 700; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }",
    ".stat-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }",
    ".stat { background: #0a1a0a; border: 1px solid #1a3a1a; border-radius: 10px; padding: 12px 16px; flex: 1; min-width: 100px; text-align: center; }",
    ".stat-val { font-size: 22px; font-weight: 700; color: #00e887; }",
    ".stat-label { font-size: 9px; color: #4a7a4a; letter-spacing: 2px; margin-top: 4px; }",
    ".cert-banner { border: 1px solid #f5c54250; background: #f5c54210; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #f5c542; text-align: center; font-weight: 700; letter-spacing: 1px; }",
    ".issues-title { font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #4a7a4a; margin-bottom: 10px; }",
    ".issue { background: #0a1a0a; border: 1px solid #1a3a1a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }",
    ".issue-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }",
    ".impact-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }",
    ".issue-name { font-size: 12px; font-weight: 700; color: #c8e8c8; flex: 1; }",
    ".issue-line { font-size: 10px; color: #4a7a4a; }",
    ".penalty { font-size: 10px; font-weight: 700; color: #e05c5c; background: #e05c5c15; border-radius: 4px; padding: 1px 6px; }",
    ".issue-tip { font-size: 11px; color: #7bd4a0; line-height: 1.5; margin-top: 4px; }",
    ".badge-section { margin-top: 20px; padding: 14px; background: #0a1a0a; border: 1px solid #1a3a1a; border-radius: 10px; }",
    ".badge-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #4a7a4a; margin-bottom: 10px; }",
    ".copy-btn { padding: 8px 16px; background: transparent; border: 1px solid #1a3a1a; border-radius: 6px; color: #7bd4a0; font-family: inherit; font-size: 11px; cursor: pointer; }",
    ".copy-btn:hover { border-color: #00e887; color: #00e887; }",
    ".powered { font-size: 10px; color: #2a4a2a; text-align: center; margin-top: 20px; }",
    "</style></head><body>",
    "<div class='layout'>",
    "  <div class='left'>",
    "    <div class='topbar'>",
    "      <span class='brand'>&#127807; Green Code Live Audit</span>",
    "      <button class='run-btn' id='runBtn' onclick='runAudit()'>Run Audit &#9654;</button>",
    "    </div>",
    "    <textarea id='code' spellcheck='false'>import time",
    "",
    "def process_data(items):",
    "    result = \"\"",
    "    for i in range(len(items)):",
    "        for j in range(len(items)):",
    "            if items[i] == items[j]:",
    "                result = result + str(items[i])",
    "    temp = 42  # unused variable",
    "    time.sleep(0.1)",
    "    return result",
    "</textarea>",
    "  </div>",
    "  <div class='right' id='results'>",
    "    <div class='placeholder'>",
    "      <div style='font-size:48px;margin-bottom:16px'>&#127807;</div>",
    "      <p style='font-size:14px;color:#4a7a4a'>Paste Python code and click Run Audit</p>",
    "      <p style='font-size:11px;color:#2a4a2a;margin-top:8px'>Powered by BrowserPod</p>",
    "    </div>",
    "  </div>",
    "</div>",
    "<script>",
    "var HEAVY_LIBS = ['tensorflow','torch','keras','sklearn','cv2','matplotlib','seaborn','plotly','bokeh','pyspark','dask','ray'];",
    "var GRADE_TABLE = [[90,'A',10,'Excellent','Platinum'],[75,'A',10,'Excellent','Platinum'],[70,'B',5,'Good','Gold'],[60,'B',5,'Good','Silver'],[50,'C',2,'Fair','Silver'],[40,'C',2,'Fair','Bronze'],[0,'D',0,'Poor','None']];",
    "var CERT_COLORS = {Platinum:'#e2e8f0',Gold:'#f5c542',Silver:'#b0b8c1',Bronze:'#cd7f32',None:'#e05c5c'};",
    "var GRADE_COLORS = {A:'#00e887',B:'#7bd4a0',C:'#f5c542',D:'#e05c5c'};",
    "var IMPACT_COLORS = {High:'#e05c5c',Medium:'#f5c542',Low:'#7bd4a0'};",
    "var CO2_WEIGHTS = {nested_loop:0.50,triple_nested_loop:1.00,unused_variable:0.05,unused_import:0.10,heavy_import:0.20,list_membership:0.15,dead_function:0.05,repeated_call:0.20,string_concat_loop:0.30,global_in_loop:0.08};",
    "",
    "function getGrade(score){",
    "  for(var i=0;i<GRADE_TABLE.length;i++){",
    "    if(score>=GRADE_TABLE[i][0]) return {grade:GRADE_TABLE[i][1],credits:GRADE_TABLE[i][2],label:GRADE_TABLE[i][3],cert:GRADE_TABLE[i][4]};",
    "  }",
    "  return {grade:'D',credits:0,label:'Poor',cert:'None'};",
    "}",
    "",
    "function analyzeCode(source){",
    "  var lines = source.split('\\n');",
    "  var issues = [];",
    "  var imports = {};",
    "  var assignedVars = {};",
    "  var definedFns = {};",
    "  var calledFns = new Set();",
    "  var usedNames = new Set();",
    "",
    "  // Pass 1: imports, vars, functions",
    "  for(var li=0;li<lines.length;li++){",
    "    var raw = lines[li];",
    "    var line = raw.replace(/#.*/,'').trim();",
    "    var lno = li+1;",
    "    var m;",
    "    if((m=line.match(/^import\\s+(\\w+)/))) imports[m[1]]=lno;",
    "    if((m=line.match(/^from\\s+(\\w+)\\s+import/))) imports[m[1]]=lno;",
    "    if((m=line.match(/^def\\s+(\\w+)\\s*\\(/))) definedFns[m[1]]=lno;",
    "    var calls=[...raw.matchAll(/(\\w+)\\s*\\(/g)];",
    "    calls.forEach(function(c){calledFns.add(c[1]);});",
    "    if((m=line.match(/^([a-zA-Z_]\\w*)\\s*=/)) && !line.startsWith('def') && !line.startsWith('class') && !m[1].startsWith('_')) assignedVars[m[1]]=lno;",
    "    var words=[...raw.matchAll(/\\b([a-zA-Z_]\\w*)\\b/g)];",
    "    words.forEach(function(w){usedNames.add(w[1]);});",
    "    // heavy import",
    "    HEAVY_LIBS.forEach(function(lib){",
    "      if(line.indexOf(lib)>=0 && (line.startsWith('import') || line.startsWith('from')))",
    "        issues.push({rule_id:'heavy_import',issue:'Heavy library import: '+lib,impact:'Medium',penalty:10,line:lno,suggestion:'Consider lazy-loading '+lib+' only when needed to reduce startup cost.'});",
    "    });",
    "    // global in loop (simple heuristic)",
    "    if(/^global\\s/.test(line)) issues.push({rule_id:'global_in_loop',issue:'Global variable declaration',impact:'Low',penalty:7,line:lno,suggestion:'Avoid globals inside functions — cache them as local variables for better performance.'});",
    "  }",
    "",
    "  // Pass 2: loops",
    "  for(var i=0;i<lines.length;i++){",
    "    var raw2=lines[i];",
    "    var line2=raw2.replace(/#.*/,'').trim();",
    "    var lno2=i+1;",
    "    var ind=raw2.search(/\\S/);",
    "    if(!/^(for|while)\\s/.test(line2)) continue;",
    "    var foundNested=false, foundTriple=false;",
    "    for(var j=i+1;j<lines.length&&j<i+60;j++){",
    "      var inner=lines[j].replace(/#.*/,'').trim();",
    "      var iind=lines[j].search(/\\S/);",
    "      if(!inner) continue;",
    "      if(iind<=ind) break;",
    "      if(/^(for|while)\\s/.test(inner)&&!foundNested){",
    "        foundNested=true;",
    "        for(var k=j+1;k<lines.length&&k<j+60;k++){",
    "          var deep=lines[k].replace(/#.*/,'').trim();",
    "          var dind=lines[k].search(/\\S/);",
    "          if(!deep) continue;",
    "          if(dind<=iind) break;",
    "          if(/^(for|while)\\s/.test(deep)){foundTriple=true;break;}",
    "        }",
    "        break;",
    "      }",
    "    }",
    "    if(foundTriple) issues.push({rule_id:'triple_nested_loop',issue:'Triple-nested loop detected',impact:'High',penalty:35,line:lno2,suggestion:'O(n³) complexity — refactor with vectorised operations or algorithmic redesign.'});",
    "    else if(foundNested) issues.push({rule_id:'nested_loop',issue:'Nested loop detected',impact:'High',penalty:20,line:lno2,suggestion:'Flatten with itertools.product() or restructure with dict/set lookups.'});",
    "    // string concat in loop",
    "    for(var j2=i+1;j2<lines.length&&j2<i+30;j2++){",
    "      var si=lines[j2].replace(/#.*/,'').trim();",
    "      var siind=lines[j2].search(/\\S/);",
    "      if(!si) continue;",
    "      if(siind<=ind) break;",
    "      if(/\\w+\\s*\\+=\\s*(str\\(|f?[\"'])/.test(si)||/\\w+\\s*=\\s*\\w+\\s*\\+\\s*(str\\(|f?[\"'])/.test(si)){",
    "        issues.push({rule_id:'string_concat_loop',issue:'String concatenation in loop',impact:'High',penalty:18,line:j2+1,suggestion:'Use a list and join() after the loop instead.'});break;",
    "      }",
    "    }",
    "    // list membership in loop",
    "    for(var j3=i+1;j3<lines.length&&j3<i+30;j3++){",
    "      var mi2=lines[j3].replace(/#.*/,'').trim();",
    "      var mi2ind=lines[j3].search(/\\S/);",
    "      if(!mi2) continue;",
    "      if(mi2ind<=ind) break;",
    "      if(/\\bin\\s+\\[/.test(mi2)){issues.push({rule_id:'list_membership',issue:'List membership test in loop',impact:'Medium',penalty:12,line:j3+1,suggestion:'Replace [list] with {set} for O(1) lookups.'});break;}",
    "    }",
    "  }",
    "",
    "  // Pass 3: unused",
    "  Object.keys(imports).forEach(function(name){",
    "    var count=(source.match(new RegExp('\\\\b'+name+'\\\\b','g'))||[]).length;",
    "    if(count<=1) issues.push({rule_id:'unused_import',issue:'Unused import: '+name,impact:'Medium',penalty:8,line:imports[name],suggestion:'Remove unused import '+name+' to reduce load time.'});",
    "  });",
    "  Object.keys(assignedVars).forEach(function(name){",
    "    if(name==='_') return;",
    "    var count=(source.match(new RegExp('\\\\b'+name+'\\\\b','g'))||[]).length;",
    "    if(count<=1) issues.push({rule_id:'unused_variable',issue:'Unused variable: '+name,impact:'Low',penalty:5,line:assignedVars[name],suggestion:'Remove unused variable '+name+'.'});",
    "  });",
    "  Object.keys(definedFns).forEach(function(name){",
    "    if(name.startsWith('_')||name==='main') return;",
    "    if(!calledFns.has(name)) issues.push({rule_id:'dead_function',issue:'Dead function: '+name+'()',impact:'Low',penalty:5,line:definedFns[name],suggestion:'Remove unused function '+name+'.'});",
    "  });",
    "",
    "  var penalty=issues.reduce(function(s,i){return s+i.penalty;},0);",
    "  var score=Math.max(0,Math.min(100,100-penalty));",
    "  var g=getGrade(score);",
    "  var co2=issues.reduce(function(s,i){return s+(CO2_WEIGHTS[i.rule_id]||0.05);},0);",
    "  return {score:score,grade:g.grade,label:g.label,credits:g.credits,cert:g.cert,co2:Math.round(co2*1000)/1000,issues:issues};",
    "}",
    "",
    "function runAudit(){",
    "  var code=document.getElementById('code').value;",
    "  var btn=document.getElementById('runBtn');",
    "  btn.disabled=true; btn.textContent='Scanning...';",
    "  fetch('/audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code})})",
    "    .then(function(res){ if(!res.ok) throw new Error('Audit failed'); return res.json(); })",
    "    .then(function(r){ renderResults(r,code); })",
    "    .catch(function(err){ document.getElementById('results').innerHTML='<div class=\"placeholder\"><p style=\"color:#e05c5c\">'+err.message+'</p></div>'; })",
    "    .finally(function(){ btn.disabled=false; btn.textContent='Run Audit \\u25B6'; });",
    "}",
    "",
    "function renderResults(r,code){",
    "  var gc=GRADE_COLORS[r.grade]||'#00e887';",
    "  var cc=CERT_COLORS[r.certification]||'#7bd4a0';",
    "  var circ=2*Math.PI*38;",
    "  var offset=circ*(1-r.score/100);",
    "  var issueHtml=r.issues.length===0",
    "    ? '<p style=\"color:#4a7a4a;font-size:12px\">&#10003; No issues found!</p>'",
    "    : r.issues.map(function(iss){",
    "        var ic=IMPACT_COLORS[iss.impact]||'#7bd4a0';",
    "        var pts=iss.kind==='bonus'?'+'+iss.penalty:(iss.penalty<0?String(iss.penalty):'-'+iss.penalty);",
    "        var pc=iss.kind==='bonus'?'#00e887':'#e05c5c';",
    "        return \"<div class='issue'><div class='issue-header'><div class='impact-dot' style='background:\"+ic+\"'></div><span class='issue-name'>\"+iss.issue+\"</span>\"+",
    "               (iss.line?\"<span class='issue-line'>Line \"+iss.line+\"</span>\":\"\")+",
    "               \"<span class='penalty' style='color:\"+pc+\"'>\"+pts+\"pts</span></div><div class='issue-tip'>\"+iss.suggestion+\"</div></div>\";",
    "      }).join('');",
    "  document.getElementById('results').innerHTML =",
    "    \"<div class='score-row'>\"+",
    "    \"<svg class='score-dial' viewBox='0 0 90 90'>\"+",
    "    \"<circle cx='45' cy='45' r='38' fill='none' stroke='#1a3a1a' stroke-width='6'/>\"+",
    "    \"<circle cx='45' cy='45' r='38' fill='none' stroke='\"+gc+\"' stroke-width='6' stroke-linecap='round'\"+",
    "    \" stroke-dasharray='\"+circ+\"' stroke-dashoffset='\"+offset+\"' transform='rotate(-90 45 45)'/>\"+",
    "    \"<text x='45' y='49' text-anchor='middle' font-size='20' font-weight='700' fill='\"+gc+\"' font-family='JetBrains Mono'>\"+r.score+\"</text>\"+",
    "    \"</svg>\"+",
    "    \"<div>\"+",
    "    \"<div class='grade-badge' style='background:\"+gc+\"20;color:\"+gc+\"'>\"+r.grade+\"</div>\"+",
    "    \"<p style='font-size:11px;color:#4a7a4a;margin-top:6px'>\"+r.label+\"</p>\"+",
    "    \"</div></div>\"+",
    "    \"<div class='stat-row'>\"+",
    "    \"<div class='stat'><div class='stat-val' style='color:\"+gc+\"'>\"+r.score+\"</div><div class='stat-label'>SCORE</div></div>\"+",
    "    \"<div class='stat'><div class='stat-val'>+\"+r.credits+\"</div><div class='stat-label'>CREDITS</div></div>\"+",
    "    \"<div class='stat'><div class='stat-val' style='font-size:18px'>\"+r.co2_saved_grams+\"g</div><div class='stat-label'>CO&#8322; SAVED</div></div>\"+",
    "    \"</div>\"+",
    "    \"<div class='cert-banner' style='border-color:\"+cc+\"50;background:\"+cc+\"10;color:\"+cc+\"'>&#10022; \"+r.certification.toUpperCase()+\" CERTIFICATION</div>\"+",
    "    \"<div class='issues-title'>Issues Found (\"+r.issues.length+\")</div>\"+",
    "    issueHtml+",
    "    \"<div class='powered'>Powered by BrowserPod &mdash; running in your browser</div>\";",
    "}",
    "</script>",
    "</body></html>"
  ].join("\n"));
});

// ── POST /badge ───────────────────────────────────────────────────────────────
app.post("/badge", function(req, res) {
  var b = req.body;
  if (b.score === undefined || !b.grade) return res.status(400).json({ error: "Missing fields" });
  var id = Math.random().toString(36).slice(2, 10);
  badges.set(id, { score:b.score, grade:b.grade, credits:b.credits, co2_saved_grams:b.co2_saved_grams, certification:b.certification, created_at:new Date().toISOString() });
  res.json({ id:id, badge_url:"/badge/"+id });
});

// ── GET /badge/:id ────────────────────────────────────────────────────────────
app.get("/badge/:id", function(req, res) {
  var d = badges.get(req.params.id);
  if (!d) return res.status(404).send("<h2>Badge not found.</h2>");
  var gc={A:"#00e887",B:"#7bd4a0",C:"#f5c542",D:"#e05c5c"};
  var cc={Platinum:"#e2e8f0",Gold:"#f5c542",Silver:"#b0b8c1",Bronze:"#cd7f32",None:"#e05c5c"};
  var col=gc[d.grade]||"#00e887", ccol=cc[d.certification]||"#7bd4a0";
  var iss=new Date(d.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  res.setHeader("Content-Type","text/html");
  res.send([
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Green Code Badge</title>",
    "<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}",
    ".card{max-width:420px;width:100%;background:#0a1a0a;border:1px solid "+col+"40;border-radius:16px;padding:36px}",
    ".hdr{display:flex;align-items:center;gap:12px;margin-bottom:28px}.ttl{font-size:18px;font-weight:700;color:#00e887}.sub{font-size:11px;color:#4a7a4a;margin-top:3px;letter-spacing:1px}",
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}",
    ".stat{background:#060e06;border:1px solid #1a3a1a;border-radius:10px;padding:16px;text-align:center}",
    ".sv{font-size:28px;font-weight:700;color:"+col+"}.sl{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:4px}",
    ".cert{display:inline-flex;align-items:center;gap:8px;background:"+ccol+"18;border:1px solid "+ccol+"50;border-radius:20px;padding:6px 16px;margin-bottom:20px;font-size:12px;font-weight:700;color:"+ccol+";letter-spacing:1px}",
    ".foot{font-size:10px;color:#2a5a2a;text-align:center;padding-top:16px;border-top:1px solid #1a3a1a}",
    "</style></head><body><div class='card'>",
    "<div class='hdr'><div style='font-size:32px'>&#127807;</div><div><div class='ttl'>Green Software Certified</div><div class='sub'>GREEN CODE</div></div></div>",
    "<div class='cert'>&#10022; "+d.certification.toUpperCase()+" CERTIFICATION</div>",
    "<div class='grid'>",
    "<div class='stat'><div class='sv'>"+d.score+"</div><div class='sl'>SCORE</div></div>",
    "<div class='stat'><div class='sv'>"+d.grade+"</div><div class='sl'>GRADE</div></div>",
    "<div class='stat'><div class='sv'>+"+d.credits+"</div><div class='sl'>CREDITS</div></div>",
    "<div class='stat'><div class='sv' style='font-size:20px'>"+d.co2_saved_grams+"g</div><div class='sl'>CO2 SAVED</div></div>",
    "</div><div class='foot'>Issued "+iss+" &middot; Powered by BrowserPod</div>",
    "</div></body></html>"
  ].join("\n"));
});

// ── POST /certificate ─────────────────────────────────────────────────────────
app.post("/certificate", function(req, res) {
  var b = req.body;
  if (!b.summary) return res.status(400).json({ error: "Missing summary" });
  var id = Math.random().toString(36).slice(2, 10);
  certificates.set(id, { projectName:b.projectName||"Unnamed", summary:b.summary, top_issues:b.top_issues||[], files:b.files||[], created_at:new Date().toISOString() });
  res.json({ id:id, cert_url:"/certificate/"+id });
});

// ── GET /certificate/:id ──────────────────────────────────────────────────────
app.get("/certificate/:id", function(req, res) {
  var d = certificates.get(req.params.id);
  if (!d) return res.status(404).send("<h2>Certificate not found.</h2>");
  var cc={Platinum:"#e2e8f0",Gold:"#f5c542",Silver:"#b0b8c1",Bronze:"#cd7f32",None:"#e05c5c"};
  var gc={A:"#00e887",B:"#7bd4a0",C:"#f5c542",D:"#e05c5c"};
  var col=cc[d.summary.certification]||"#b0b8c1", gcol=gc[d.summary.grade]||"#00e887";
  var iss=new Date(d.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  var ir=d.top_issues.map(function(i){return "<tr><td>"+i.rule_id.replace(/_/g," ")+"</td><td style='text-align:right;color:"+gcol+";font-weight:700'>"+i.count+"</td></tr>";}).join("");
  var fr=d.files.slice(0,25).map(function(f){var c=gc[f.grade]||"#7bd4a0";return "<tr><td style='word-break:break-all'>"+f.path+"</td><td style='text-align:center;color:"+c+";font-weight:700'>"+(f.score||"-")+"</td><td style='text-align:center;color:"+c+";font-weight:700'>"+(f.grade||"-")+"</td><td style='text-align:center'>"+f.issues+"</td></tr>";}).join("");
  res.setHeader("Content-Type","text/html");
  res.send([
    "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Green Code Certificate - "+d.projectName+"</title>",
    "<style>*{box-sizing:border-box;margin:0;padding:0}@media print{.np{display:none!important}}",
    "body{background:#060e06;color:#c8e8c8;font-family:'JetBrains Mono',monospace;padding:32px 16px}",
    ".page{max-width:860px;margin:0 auto}",
    ".hdr{text-align:center;padding:40px 24px 32px;border:2px solid "+col+"60;border-radius:16px;background:#0a1a0a;margin-bottom:24px}",
    ".cl{display:inline-flex;align-items:center;gap:10px;background:"+col+"18;border:1px solid "+col+"60;border-radius:24px;padding:8px 24px;margin:14px 0;font-size:14px;font-weight:700;color:"+col+";letter-spacing:2px}",
    ".pn{font-size:28px;font-weight:700;color:#e0f0e0;margin-top:8px;word-break:break-word}.is{font-size:11px;color:#4a7a4a;margin-top:8px}",
    ".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:24px}",
    ".stat{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:20px;text-align:center}",
    ".sv{font-size:30px;font-weight:700;color:"+gcol+"}.sl{font-size:9px;color:#4a7a4a;letter-spacing:2px;margin-top:6px}",
    ".sec{background:#0a1a0a;border:1px solid #1a3a1a;border-radius:12px;padding:24px;margin-bottom:18px}",
    "h3{font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#4a7a4a;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1a3a1a}",
    "table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;font-size:9px;letter-spacing:2px;color:#4a7a4a;padding:8px 10px;border-bottom:1px solid #1a3a1a}",
    "td{padding:8px 10px;border-bottom:1px solid #0f2a0f;color:#c8e8c8}",
    ".pb{display:block;width:100%;padding:14px;background:"+col+"18;border:2px solid "+col+"50;border-radius:10px;color:"+col+";font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;margin-top:20px}",
    ".ft{text-align:center;font-size:10px;color:#2a4a2a;margin-top:24px;padding-top:14px;border-top:1px solid #1a3a1a;line-height:1.8}",
    "</style></head><body><div class='page'>",
    "<div class='hdr'><div style='font-size:52px'>&#127807;</div>",
    "<div style='font-size:10px;color:#4a7a4a;letter-spacing:4px'>GREEN CODE</div>",
    "<div class='cl'>&#10022; "+d.summary.certification.toUpperCase()+" CERTIFICATION</div>",
    "<div class='pn'>"+d.projectName+"</div><div class='is'>Issued "+iss+"</div></div>",
    "<div class='stats'>",
    "<div class='stat'><div class='sv'>"+d.summary.overall_score+"</div><div class='sl'>SCORE</div></div>",
    "<div class='stat'><div class='sv' style='color:"+gcol+"'>"+d.summary.grade+"</div><div class='sl'>GRADE</div></div>",
    "<div class='stat'><div class='sv'>+"+d.summary.credits+"</div><div class='sl'>CREDITS</div></div>",
    "<div class='stat'><div class='sv'>"+d.summary.audited_files+"</div><div class='sl'>FILES AUDITED</div></div>",
    "<div class='stat'><div class='sv' style='font-size:22px'>"+d.summary.co2_saved_grams+"g</div><div class='sl'>CO2 SAVED</div></div>",
    "</div>",
    "<div class='sec'><h3>Certification Note</h3><p style='font-size:13px;color:#a0c8a0;line-height:1.7'>"+d.summary.certification_note+"</p></div>",
    (ir?"<div class='sec'><h3>Top Issues</h3><table><thead><tr><th>Rule</th><th style='text-align:right'>Count</th></tr></thead><tbody>"+ir+"</tbody></table></div>":""),
    (fr?"<div class='sec'><h3>Files ("+d.files.length+")</h3><table><thead><tr><th>Path</th><th style='text-align:center'>Score</th><th style='text-align:center'>Grade</th><th style='text-align:center'>Issues</th></tr></thead><tbody>"+fr+"</tbody></table></div>":""),
    "<button class='pb np' onclick='window.print()'>Print / Save as PDF</button>",
    "<div class='ft'>Green Code &copy; 2026 &middot; AI in the Box Hackathon, University of Leeds<br>Powered by <strong style='color:#7bd4a0'>BrowserPod</strong> by Leaning Technologies</div>",
    "</div></body></html>"
  ].join("\n"));
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", function(_req, res) {
  res.json({ status:"ok", runtime:"browserpod" });
});

app.listen(3000, function() {
  console.log("[Green Code pod-server] listening on port 3000");
});
