import{o as s}from"./index-DIkfPh3b.js";import{e as x}from"./text-BLuk6ncF.js";const a=Symbol("rawHtml"),c=o=>({[a]:String(o??"")}),m=o=>o==null||o===!1?"":Array.isArray(o)?o.map(m).join(""):typeof o=="object"&&a in o?o[a]:x(o),p=(o,...e)=>c(o.reduce((r,n,t)=>r+n+(t<e.length?m(e[t]):""),"")),l="#4f46e5",w="#059669",y="#dc2626",z=`
  @page { size: A4; margin: 5mm; }
  body { font-family: 'Helvetica', sans-serif; color: #000; font-size: 10px; margin-top: 100px; }
  .header { position: absolute; top: 0; left: 0; right: 0; height: 90px; display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; }
  .company-info h1 { font-size: 16pt; font-weight: bold; margin: 0 0 5px 0; color: ${l}; }
  .company-info p { margin: 0; font-size: 9pt; color: #333; }
  .report-info { text-align: right; }
  .report-info h2 { font-size: 14pt; margin: 0 0 5px 0; color: ${l}; }
  .report-info p { margin: 2px 0; font-size: 9pt; }
  .transaction-block { margin-bottom: 20px; }
  .transaction-header { background-color: #e5e7eb; border: 1px solid #999; border-bottom: none; padding: 8px; font-size: 11pt; font-weight: bold; page-break-after: avoid; }
  .sep { color: #999; margin: 0 5px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #999; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background-color: #f3f4f6; border-bottom: 1px solid #999; padding: 5px; text-align: left; font-weight: bold; font-size: 9pt; }
  td { border-bottom: 1px solid #ccc; padding: 5px; vertical-align: top; font-size: 9pt; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .col-desc { white-space: normal; overflow-wrap: break-word; }
  .pos { color: ${w}; }
  .neg { color: ${y}; }
  .balance-container { margin-top: 20px; text-align: right; font-size: 12pt; border-top: 2px solid #000; padding-top: 10px; page-break-inside: avoid; }
`,A=({title:o,customerName:e,subtitle:r})=>p`
  <div class="header">
    <div class="company-info">
      <h1>${s.printName}</h1>
      ${s.addressLines.map(n=>p`<p>${n}</p>`)}
      <p>${s.phones}</p>
    </div>
    <div class="report-info">
      <h2>${o}</h2>
      <p>Sayın: <strong>${e}</strong></p>
      <p>${r}</p>
    </div>
  </div>`,O=({title:o,css:e,body:r,delay:n=500})=>{const t=window.open("","","height=800,width=1000");if(!t)return!1;const f=p`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${o}</title><style>${c(e)}</style></head><body>${r}</body></html>`;t.document.write(f[a]),t.document.close();const g=Array.from(t.document.images||[]),h=Promise.all(g.map(i=>i.complete?null:new Promise(d=>{i.onload=d,i.onerror=d}))),b=new Promise(i=>setTimeout(i,8e3));return Promise.race([h,b]).then(()=>setTimeout(()=>{t.focus(),t.print()},n)),!0};export{l as B,z as S,p as h,O as o,c as r,A as s};
