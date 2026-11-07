import sharp from "sharp"; import fs from "node:fs";
const S="C:/Users/zuri/projects/sideeye/docs/screenshots/", O="sites/sideeye/static/console/";
const names={overview:"01-overview",alerts:"02-alerts",detail:"03-alert-detail-SE-001",agents:"04-agents",profile:"05-agent-profile-baseline",detections:"06-detections",policies:"07-policies",evidence:"08-evidence",integrations:"09-integrations",settings:"10-settings",approval:"20-popup-approval",contain:"22-popup-contain",toolchanged:"23-popup-tool-changed",policy:"24-popup-policy-preview",tray:"27-tray-popover-critical"};
for (const [k,f] of Object.entries(names)) for (const t of ["dark","light"]) { const i=sharp(S+`${f}-${t}.png`); const m=await i.metadata(); await i.resize({width:Math.min(m.width,1200)}).webp({quality:78}).toFile(O+`${k}-${t}.webp`); }
console.log(fs.readdirSync(O).length, "files", fs.readdirSync(O).reduce((a,f)=>a+fs.statSync(O+f).size,0)/1024|0, "KB");
