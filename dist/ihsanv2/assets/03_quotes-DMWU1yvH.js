import{j as e,d as f,T as g,c as h,r as m,C as j,x as _,V as Z,b as w,B as R,n as E,H,J as W,g as J,h as X,k as K,t as q,I as ee,q as I,y as $,u as te,a as P,M as ae,F as se,G as oe,P as ne}from"./index-DIkfPh3b.js";import{u as re,D as ie}from"./useLineItems-Cof3QIP6.js";import{a as le,e as de,b as ce,c as pe,d as L,q as B,Q as O,v as me,s as xe,o as ge,D as he,n as ue,f as be}from"./quotes-CctzNwRn.js";import{u as fe}from"./useFormState-DJ2mK2MJ.js";import{u as ye}from"./useImageUpload-CGiWJxGA.js";import{I as ve,u as je}from"./ImageDropZone-C7PG3Cw3.js";import{O as ke}from"./OrderPickerModal-DhKTLncr.js";import{T as C,V as Ne}from"./VatSettingsModal-DQQiKWlz.js";import{S as F}from"./SegmentedControl-9p_1TsW4.js";import{C as Te}from"./Combobox-Cd6bFMTR.js";import{A as Ee}from"./ActionMenu-CIm6PifZ.js";import{M as we}from"./MoneyText-D6_m1qS4.js";import{n as $e,E as Ae}from"./text-BLuk6ncF.js";import{n as ze}from"./schemas-Dv9Bo3LE.js";import{u as Se}from"./useToggleMap-CTQXVpTn.js";import{h as c,o as De}from"./printDocument-BoQennCr.js";import{D as Ce}from"./DateRangeButton-CsSKfoAM.js";import{P as Me}from"./PageHeader-BRr-JoOV.js";import{S as Re}from"./SearchButton-x39jmRQC.js";import"./MoneyInput-D90whk8g.js";import"./NumberInput-b_JTZI-t.js";import"./Select-BO6NJfpA.js";import"./array-Bz9kpOAi.js";import"./lineItems-CLqY_ZRG.js";import"./useAutoFocus-Bq35Xec3.js";const Ie=[{value:"TRY",label:"₺ TRY",tone:"emerald"},{value:"EUR",label:"€ EUR",tone:"blue"},{value:"USD",label:"$ USD",tone:"indigo"}],M=({title:t,children:a})=>e.jsxs("section",{className:h("p-4 rounded-sm border space-y-3",g.border,g.surfaceMuted),children:[e.jsx("h4",{className:h("pb-2 border-b",g.border,g.sectionTitle),children:t}),a]});function Le({form:t,bind:a,setField:s,customerNames:i,onImageFiles:p,uploading:n}){const l=t.type==="proposal";return e.jsxs(e.Fragment,{children:[e.jsxs(M,{title:"Genel Bilgiler",children:[e.jsx(F,{options:Ie,value:t.currency,onChange:r=>s("currency",r),size:"sm",ariaLabel:"Para birimi"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(f,{label:"Belge No",placeholder:"TK-001",...a("teklifNo")}),e.jsx(f,{label:"Tarih",type:"date",...a("date")})]}),e.jsx(f,{label:"Proje / Başlık",placeholder:"Mutfak Dolabı, Yatak Odası...",...a("teklifName")}),e.jsx(Te,{label:"Müşteri",placeholder:"Müşteri seçiniz...",options:i,value:t.customerName,onChange:r=>s("customerName",r)}),e.jsx(f,{label:"Geçerlilik Tarihi",type:"date",...a("validityDate")})]}),e.jsx(M,{title:"Şartlar",children:l?e.jsx(C,{label:"Not",rows:5,placeholder:"Teklif koşulları, notlar...",...a("note")}):e.jsxs(e.Fragment,{children:[e.jsx(f,{label:"Ödeme Şekli",placeholder:"Ödeme koşulları...",...a("paymentMethod")}),e.jsx(C,{label:"Teslim Tarihi",rows:2,...a("deliveryDate")}),e.jsx(C,{label:"Ambalaj",rows:2,...a("packaging")}),e.jsx(f,{label:"Montaj",...a("assembly")}),e.jsx(f,{label:"KDV",...a("vat")}),e.jsx(f,{label:"Ek Not",placeholder:"Ek notlar...",...a("validityNote")})]})}),l&&e.jsxs(M,{title:"Görseller",children:[e.jsx(ve,{multiple:!0,images:t.images,uploading:n,onFiles:p,onRemove:r=>s("images",u=>u.filter((d,b)=>b!==r))}),e.jsx("p",{className:g.muted,children:"Tıklayın, sürükleyin veya yapıştırın (Ctrl+V)."})]})]})}function Be({isOpen:t,...a}){return t?e.jsx(Fe,{...a}):null}function Fe({quote:t,customers:a,defaultVat:s,onDefaultVatChange:i,onClose:p}){const{form:n,setField:l,bind:r,isDirty:u}=fe(t?le(t):de()),[d,b]=m.useState(null),[A,k]=m.useState(!1),z=m.useCallback(o=>l("items",o),[l]),S=m.useCallback(()=>ce(s),[s]),N=re(n.items,z,S),D=m.useMemo(()=>a.map(o=>o.name).filter(Boolean),[a]),{upload:x,uploading:T}=ye(j.quotes,pe),V=m.useCallback(async o=>{const v=await x(o);v.length&&l("images",G=>[...G,...v])},[x,l]);je(V,n.type==="proposal");const Q=m.useMemo(()=>[{key:"description",label:"AÇIKLAMA",type:"text",minWidth:"14rem",placeholder:"Ürün veya hizmet adı...",mobile:"full"},{key:"quantity",label:"MİKTAR",type:"number",width:"6rem",decimals:_.quantity,tone:"blue",mobile:"half"},{key:"price",label:"B.FİYAT",type:"money",width:"9rem",tone:"amber",mobile:"half"},{key:"vat",label:"KDV",type:"select",width:"6rem",numeric:!0,mobile:"half",options:Z.map(o=>({value:o,label:`%${o}`})),optionLabel:o=>`%${o}`},{key:"total",label:"TUTAR",type:"computed",width:"9rem",tone:"emerald",mobile:"footer",compute:o=>w(L(o),n.currency)}],[n.currency]),U=o=>{if(!o.items.length)return E("Bu siparişte ürün bulunmuyor.");N.append(ge(o,s)),b(null)},Y=async()=>{const o=me(n);if(o)return E(o);if(H())return E("Görseller yükleniyor, lütfen bekleyin.");k(!0);try{const v=await W(xe(n),j.quotes);t?await J(j.quotes,t.id,v):await X(j.quotes,v),p()}catch(v){K(v),k(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx(ie,{isOpen:!0,onClose:p,title:t?"BELGEYİ DÜZENLE":"YENİ BELGE",icon:"document",headerExtra:e.jsx(F,{options:O,value:n.type,onChange:o=>l("type",o),size:"sm",ariaLabel:"Belge türü"}),aside:e.jsx(Le,{form:n,bind:r,setField:l,customerNames:D,onImageFiles:V,uploading:T}),columns:Q,lineItems:N,currency:n.currency,total:B(n.items).grandTotal,onSave:Y,saving:A,dirty:u,toolbarExtras:e.jsxs(e.Fragment,{children:[e.jsx(R,{tone:"indigo",size:"md",icon:"clipboard",onClick:()=>b("order"),children:"SİPARİŞ EKLE"}),e.jsx(R,{tone:"purple",size:"md",icon:"percent",onClick:()=>b("vat"),children:"KDV AYARLA"})]})}),e.jsx(ke,{isOpen:d==="order",onClose:()=>b(null),customers:a,onSelect:U}),e.jsx(Ne,{isOpen:d==="vat",onClose:()=>b(null),defaultVat:s,onApplyToAll:o=>N.setAll("vat",o),onSetDefault:o=>{i(o),E(`Varsayılan KDV %${o} olarak ayarlandı`)}})]})}function Ve({quote:t,expanded:a,onToggle:s,actions:i}){const p=O.find(r=>r.value===t.type),n=q(p.tone),l=[{key:"print",label:"Yazdır",icon:"print",tone:"accent",onClick:()=>i.print(t)},{key:"edit",label:"Düzenle",icon:"edit",tone:"blue",onClick:()=>i.openEdit(t)},{key:"delete",label:"Sil",icon:"delete",tone:"red",onClick:()=>i.remove(t)}];return e.jsxs("article",{className:h("rounded-sm border-l-4 shadow-sm",n.border,n.soft),children:[e.jsxs("div",{className:"flex items-center gap-2 md:gap-4 px-3 md:px-4 py-3",children:[e.jsxs("button",{type:"button",onClick:s,"aria-expanded":a,className:"flex items-center gap-3 min-w-0 flex-1 text-left",children:[e.jsx("span",{className:h("p-2 rounded-sm shrink-0",a?h(n.solid):"text-slate-400"),children:e.jsx(ee,{name:a?"chevronUp":"chevronDown"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h3",{className:"text-base font-black uppercase tracking-tight truncate text-slate-800 dark:text-zinc-100",children:t.customerName||"—"}),e.jsxs("p",{className:"text-xs font-mono uppercase text-slate-500 dark:text-zinc-400 truncate",children:[t.teklifName||"BAŞLIKSIZ"," · ",I(t.date)]})]})]}),e.jsx("span",{className:"hidden sm:flex w-28 shrink-0 justify-center",children:e.jsx("span",{className:h("px-2.5 py-1 text-xs font-bold font-mono rounded-sm border-2",n.border),children:p.label})}),e.jsx(we,{value:B(t.items).grandTotal,currency:t.currency,tone:t.type==="contract"?"red":"emerald",className:"inline-block shrink-0 sm:w-44 text-right text-sm md:text-base font-black"}),e.jsx(Ee,{actions:l})]}),a&&e.jsx("div",{className:h("mx-2 md:ml-14 md:mr-4 mb-3 p-2 rounded-sm border overflow-x-auto custom-scrollbar-thin",g.border,g.surface),children:e.jsxs("table",{className:h("w-full text-left text-xs text-slate-600 dark:text-zinc-300",g.number),children:[e.jsx("thead",{children:e.jsxs("tr",{className:h("border-b-2 uppercase text-slate-500 dark:text-zinc-400",g.border),children:[e.jsx("th",{className:"pb-2 px-2 font-bold",children:"Açıklama"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"Miktar"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"B.Fiyat"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"KDV"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"Tutar"})]})}),e.jsx("tbody",{children:t.items.map((r,u)=>e.jsxs("tr",{className:"border-b border-slate-100 dark:border-zinc-700 last:border-0",children:[e.jsx("td",{className:"py-2 px-2 font-bold text-slate-800 dark:text-zinc-100 min-w-[10rem]",children:r.description}),e.jsx("td",{className:"py-2 px-2 text-right",children:$(r.quantity)}),e.jsx("td",{className:"py-2 px-2 text-right whitespace-nowrap",children:w(r.price,t.currency)}),e.jsxs("td",{className:"py-2 px-2 text-right",children:["%",$(r.vat)]}),e.jsx("td",{className:h("py-2 px-2 text-right whitespace-nowrap font-black",g.accentText),children:w(L(r),t.currency)})]},u))})]})})]})}const Pe="https://imgur.com/dM24v7h.png",y="#be185d",Ke=`
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; min-height: 297mm; margin: 0; padding: 0; }
  body { font-family: 'Helvetica', sans-serif; color: #333; padding: 10mm 15mm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
  .bg-watermark { position: fixed; inset: 0; z-index: -1; }
  .bg-watermark img { width: 100%; height: 100%; object-fit: cover; }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; min-height: 277mm; }
  .doc-head { display: flex; justify-content: flex-end; margin-bottom: 40px; border-bottom: 2px solid #fce7f3; padding-bottom: 10px; }
  .doc-box { text-align: right; background: #fff; padding: 10px; border-radius: 16px; }
  .doc-box h2 { font-size: 30px; font-weight: bold; color: ${y}; margin: 0; }
  .doc-meta td { border: none; padding: 2px; font-size: 12px; }
  .doc-meta td:first-child { font-weight: bold; color: #831843; }
  .to-label { font-size: 10px; font-weight: bold; color: ${y}; }
  .to-name { font-size: 18px; font-weight: bold; margin-bottom: 30px; }
  table.items { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px; }
  table.items th { border-bottom: 2px solid ${y}; color: ${y}; padding: 8px 4px; text-align: left; font-weight: bold; text-transform: uppercase; }
  table.items td { border-bottom: 1px solid #fce7f3; padding: 8px 4px; vertical-align: top; }
  .r { text-align: right; } .c { text-align: center; }
  .totals { margin-left: auto; width: 300px; padding: 10px; }
  .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10pt; }
  .grand-total { font-size: 14pt; font-weight: bold; color: ${y}; border-top: 2px solid ${y}; padding-top: 8px; margin-top: 4px; }
  .terms { margin-top: 20%; font-size: 10pt; line-height: 1.5; }
  .signs { display: flex; justify-content: space-between; gap: 20px; margin: 50px 0; }
  .sign { width: 48%; }
  .sign-title { color: ${y}; font-weight: bold; font-size: 11pt; margin-bottom: 10px; }
  .sign-box { border: 2px dashed ${y}; min-height: 150px; font-size: 10pt; line-height: 1.6; padding: 10px; box-sizing: border-box; }
  .images { margin-top: auto; padding-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .images img { max-width: 45%; max-height: 200px; object-fit: contain; border: 1px solid #fce7f3; background: white; padding: 3px; }
  .note { margin-top: 20px; font-size: 11px; white-space: pre-wrap; }
  .footer { margin-top: auto; border-top: 1px solid #fce7f3; padding-top: 10px; font-size: 9px; color: #9d174d; text-align: center; font-weight: bold; }
`,Oe=(t,a=null)=>{const s=t.type==="contract",i=d=>w(d,t.currency),p=B(t.items),n=c`
      <table class="items">
        <thead><tr><th style="width:45%">Açıklama</th><th class="c">Miktar</th><th class="r">Birim Fiyat</th><th class="c">KDV %</th><th class="r">Tutar</th></tr></thead>
        <tbody>${t.items.map(d=>c`
          <tr>
            <td>${d.description}</td>
            <td class="c">${$(d.quantity)}</td>
            <td class="r">${i(d.price)}</td>
            <td class="c">%${$(d.vat)}</td>
            <td class="r"><strong>${i(L(d))}</strong></td>
          </tr>`)}
        </tbody>
      </table>`,l=c`
      <div class="totals" ${s?c`style="page-break-after:always;"`:""}>
        <div class="total-row"><span>Ara Toplam:</span><span>${i(p.subtotal)}</span></div>
        <div class="total-row"><span>Toplam KDV:</span><span>${i(p.totalVat)}</span></div>
        <div class="total-row grand-total"><span>Genel Toplam:</span><span>${i(p.grandTotal)}</span></div>
      </div>`,r=c`
      <div class="terms">
        <p><strong>Ödeme Şekli:</strong> ${t.paymentMethod||he}</p>
        <p><strong>Teslim Tarihi:</strong> ${t.deliveryDate}</p>
        <p><strong>Ambalaj:</strong> ${t.packaging}</p>
        <p><strong>Montaj ve Nakliye:</strong> ${t.assembly}</p>
        <p><strong>KDV:</strong> ${t.vat}</p>
        <p><strong>Not:</strong> Fiyat Teklifi ${I(t.validityDate)} tarihine kadar geçerlidir.</p>
        ${t.validityNote?c`<p><strong>Ek Not:</strong> ${t.validityNote}</p>`:""}
      </div>
      <div class="signs">
        <div class="sign"><div class="sign-title">FİRMA KAŞE / İMZA</div><div class="sign-box"></div></div>
        <div class="sign"><div class="sign-title">MÜŞTERİ BİLGİLERİ VE İMZA</div>
          <div class="sign-box">${a?c`
            ${a.company?c`<div><strong>Firma:</strong> ${a.company}</div>`:""}
            ${a.address?c`<div><strong>Adres:</strong> ${a.address}</div>`:""}
            ${a.phone?c`<div><strong>Tel:</strong> ${a.phone}</div>`:""}
            ${a.vkn?c`<div><strong>Vergi No:</strong> ${a.vkn}</div>`:""}`:""}
          </div>
        </div>
      </div>`,u=c`
      <div class="bg-watermark"><img src="${Pe}" alt="" /></div>
      <div class="content">
        <div class="doc-head">
          <div class="doc-box">
            <h2>${s?"Sözleşme Formu":"Teklif Formu"}</h2>
            <table class="doc-meta">
              <tr><td>${s?"Sözleşme No:":"Teklif No:"}</td><td class="r">#${t.teklifNo}</td></tr>
              <tr><td>Tarih:</td><td class="r">${I(t.date)}</td></tr>
            </table>
          </div>
        </div>
        <div class="to-label">SAYIN</div>
        <div class="to-name">${t.customerName}</div>
        ${n}
        ${l}
        ${s?r:t.note?c`<div class="note"><strong>NOT:</strong><br/>${t.note}</div>`:""}
        ${t.images.length?c`<div class="images">${t.images.map(d=>c`<img src="${d}" alt="" />`)}</div>`:""}
        <div class="footer">ERCELEBILER AHSAP - Profesyonel Çözümler</div>
      </div>`;return De({title:`${s?"Sözleşme":"Teklif"} - ${t.teklifNo}`,css:Ke,body:u,delay:1e3})};function Qe(){const t=te(),a=P(j.quotes,{normalize:ue}),s=P(j.customers,{normalize:ze,orderField:"name",direction:"asc"}),[i,p]=m.useState("all"),[n,l]=m.useState(""),[r,u]=m.useState({start:"",end:""}),[d,b]=m.useState(ae),[A,k]=m.useState({open:!1,quote:null}),z=Se(),S=m.useMemo(()=>be(a.data,{type:i,needle:$e(n),dateRange:r}),[a.data,i,n,r]),N=x=>s.data.find(T=>T.name===x)||null,D={openNew:()=>k({open:!0,quote:null}),openEdit:x=>k({open:!0,quote:x}),closeEditor:()=>k({open:!1,quote:null}),print:x=>Oe(x,N(x.customerName))||E("Açılır pencere engellendi."),remove:async x=>{if(!(!t.isAdmin||!se("Silmek istediğinize emin misiniz?")))try{await oe(j.quotes,x.id)}catch(T){K(T)}}};return{loading:a.loading||s.loading,error:a.error||s.error,total:a.data.length,visible:S,customers:s.data,type:i,setType:p,search:n,setSearch:l,dateRange:r,setDateRange:u,defaultVat:d,setDefaultVat:b,editor:A,expanded:z,actions:D}}const Ue=[{value:"all",label:"TÜMÜ",tone:"neutral"},{value:"proposal",label:"TEKLİF",tone:"indigo"},{value:"contract",label:"SÖZLEŞME",tone:"red"}];function ut(){const t=Qe(),{actions:a}=t;return t.loading?e.jsx(ne,{}):e.jsxs("div",{className:g.page,children:[e.jsxs(Me,{icon:"document",title:"Teklif & Sözleşme",subtitle:`Kayıtlı belge: ${t.total}`,children:[e.jsx(Re,{value:t.search,onChange:t.setSearch,placeholder:"BELGE / MÜŞTERİ ARA..."}),e.jsx(Ce,{value:t.dateRange,onChange:t.setDateRange}),e.jsx(F,{options:Ue,value:t.type,onChange:t.setType,size:"md",ariaLabel:"Belge türü filtresi",className:"sm:w-80"}),e.jsx(R,{icon:"add",onClick:a.openNew,children:"YENİ BELGE"})]}),t.error&&e.jsxs("p",{className:"text-sm text-red-600",children:["Veri yüklenemedi: ",t.error.message]}),e.jsxs("div",{className:"space-y-2",children:[t.visible.length===0&&e.jsx(Ae,{icon:"document",title:"Kayıt bulunamadı"}),t.visible.map(s=>e.jsx(Ve,{quote:s,actions:a,expanded:t.expanded.isOn(s.id),onToggle:()=>t.expanded.toggle(s.id)},s.id))]}),e.jsx(Be,{isOpen:t.editor.open,quote:t.editor.quote,customers:t.customers,defaultVat:t.defaultVat,onDefaultVatChange:t.setDefaultVat,onClose:a.closeEditor})]})}export{ut as default};
