import{o as s}from"./index-BsNd3ASA.js";import{e as x}from"./text-CQ7Spirr.js";const A=(t,o,n)=>{if(o===n||o<0||n<0||o>=t.length||n>=t.length)return t;const e=[...t],[r]=e.splice(o,1);return e.splice(n,0,r),e},z=(t,o)=>t.filter((n,e)=>e!==o),O=(t,o,n)=>t.map((e,r)=>r===o?n:e),P=(t,o,n)=>t.map((e,r)=>r===o?{...e,...n}:e),a=Symbol("rawHtml"),l=t=>({[a]:String(t??"")}),m=t=>t==null||t===!1?"":Array.isArray(t)?t.map(m).join(""):typeof t=="object"&&a in t?t[a]:x(t),p=(t,...o)=>l(t.reduce((n,e,r)=>n+e+(r<o.length?m(o[r]):""),"")),c="#4f46e5",w="#059669",u="#dc2626",S=`
  @page { size: A4; margin: 5mm; }
  body { font-family: 'Helvetica', sans-serif; color: #000; font-size: 10px; margin-top: 100px; }
  .header { position: absolute; top: 0; left: 0; right: 0; height: 90px; display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; }
  .company-info h1 { font-size: 16pt; font-weight: bold; margin: 0 0 5px 0; color: ${c}; }
  .company-info p { margin: 0; font-size: 9pt; color: #333; }
  .report-info { text-align: right; }
  .report-info h2 { font-size: 14pt; margin: 0 0 5px 0; color: ${c}; }
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
  .neg { color: ${u}; }
  .balance-container { margin-top: 20px; text-align: right; font-size: 12pt; border-top: 2px solid #000; padding-top: 10px; page-break-inside: avoid; }
`,T=({title:t,customerName:o,subtitle:n})=>p`
  <div class="header">
    <div class="company-info">
      <h1>${s.printName}</h1>
      ${s.addressLines.map(e=>p`<p>${e}</p>`)}
      <p>${s.phones}</p>
    </div>
    <div class="report-info">
      <h2>${t}</h2>
      <p>Sayın: <strong>${o}</strong></p>
      <p>${n}</p>
    </div>
  </div>`,k=({title:t,css:o,body:n,delay:e=500})=>{const r=window.open("","","height=800,width=1000");if(!r)return!1;const f=p`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t}</title><style>${l(o)}</style></head><body>${n}</body></html>`;r.document.write(f[a]),r.document.close();const g=Array.from(r.document.images||[]),h=Promise.all(g.map(i=>i.complete?null:new Promise(d=>{i.onload=d,i.onerror=d}))),b=new Promise(i=>setTimeout(i,8e3));return Promise.race([h,b]).then(()=>setTimeout(()=>{r.focus(),r.print()},e)),!0};export{c as B,S,z as a,p as h,A as m,k as o,P as p,O as r,T as s};
