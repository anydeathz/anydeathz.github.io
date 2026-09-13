import{j as e,d as b,T as x,c as u,r as m,C as v,x as G,V as _,b as A,B as R,n as E,G as Z,H,g as W,h as J,k as P,t as X,I as q,q as I,y as z,u as ee,a as V,A as te,E as ae,F as se,P as oe}from"./index-CF0oWuC-.js";import{u as ne,D as ie}from"./useLineItems-CK_Gl4SI.js";import{a as re,e as le,b as de,c as ce,d as L,q as B,Q as K,v as pe,s as me,o as xe,D as ge,n as he,f as ue}from"./quotes-DJj7XnkT.js";import{u as be,A as fe}from"./ActionMenu-v7ZOrBuM.js";import{u as ye}from"./useImageUpload-DqKiZpgq.js";import{I as ve,u as je}from"./ImageDropZone-Hwc7iRJd.js";import{T as C,O as ke,V as Ne}from"./VatSettingsModal-DUdhoKs_.js";import{S as F}from"./SegmentedControl-DDuu3m5g.js";import{C as Te}from"./Combobox-Hk9VFCbp.js";import{M as Ee}from"./MoneyText-ByuCTs3m.js";import{n as we,E as $e}from"./text-_cwgYZKX.js";import{n as Ae}from"./schemas-DukccXgc.js";import{u as ze}from"./useToggleMap-wkQBvkJU.js";import{h as c,o as Se}from"./printDocument-D1Pg6eOg.js";import{D as De}from"./DateRangeButton-CXxXiIs-.js";import{P as Ce}from"./PageHeader-GST2rQWf.js";import{S as Me}from"./SearchButton-BZo7DnN5.js";import"./useMediaQuery-BwvImtMh.js";import"./MoneyInput-Dc_SdHay.js";import"./NumberInput-I-cP-DWV.js";import"./Select-BCGdGxVg.js";import"./lineItems-BK5zVfBy.js";const Re=[{value:"TRY",label:"₺ TRY",tone:"emerald"},{value:"EUR",label:"€ EUR",tone:"blue"},{value:"USD",label:"$ USD",tone:"indigo"}],M=({title:t,children:a})=>e.jsxs("section",{className:u("p-4 rounded-sm border space-y-3",x.border,x.surfaceMuted),children:[e.jsx("h4",{className:u("pb-2 border-b",x.border,x.sectionTitle),children:t}),a]});function Ie({form:t,bind:a,setField:s,customerNames:l,onImageFiles:p,uploading:n}){const d=t.type==="proposal";return e.jsxs(e.Fragment,{children:[e.jsxs(M,{title:"Genel Bilgiler",children:[e.jsx(F,{options:Re,value:t.currency,onChange:i=>s("currency",i),size:"sm",ariaLabel:"Para birimi"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(b,{label:"Belge No",placeholder:"TK-001",...a("teklifNo")}),e.jsx(b,{label:"Tarih",type:"date",...a("date")})]}),e.jsx(b,{label:"Proje / Başlık",placeholder:"Mutfak Dolabı, Yatak Odası...",...a("teklifName")}),e.jsx(Te,{label:"Müşteri",placeholder:"Müşteri seçiniz...",options:l,value:t.customerName,onChange:i=>s("customerName",i)}),e.jsx(b,{label:"Geçerlilik Tarihi",type:"date",...a("validityDate")})]}),e.jsx(M,{title:"Şartlar",children:d?e.jsx(C,{label:"Not",rows:5,placeholder:"Teklif koşulları, notlar...",...a("note")}):e.jsxs(e.Fragment,{children:[e.jsx(b,{label:"Ödeme Şekli",placeholder:"Ödeme koşulları...",...a("paymentMethod")}),e.jsx(C,{label:"Teslim Tarihi",rows:2,...a("deliveryDate")}),e.jsx(C,{label:"Ambalaj",rows:2,...a("packaging")}),e.jsx(b,{label:"Montaj",...a("assembly")}),e.jsx(b,{label:"KDV",...a("vat")}),e.jsx(b,{label:"Ek Not",placeholder:"Ek notlar...",...a("validityNote")})]})}),d&&e.jsxs(M,{title:"Görseller",children:[e.jsx(ve,{multiple:!0,images:t.images,uploading:n,onFiles:p,onRemove:i=>s("images",g=>g.filter((r,k)=>k!==i))}),e.jsx("p",{className:x.muted,children:"Tıklayın, sürükleyin veya yapıştırın (Ctrl+V)."})]})]})}function Le({isOpen:t,...a}){return t?e.jsx(Be,{...a}):null}function Be({quote:t,customers:a,defaultVat:s,onDefaultVatChange:l,onClose:p}){const{form:n,setField:d,bind:i}=be(t?re(t):le()),[g,r]=m.useState(null),[k,w]=m.useState(!1),N=m.useCallback(o=>d("items",o),[d]),S=m.useCallback(()=>de(s),[s]),T=ne(n.items,N,S),D=m.useMemo(()=>a.map(o=>o.name).filter(Boolean),[a]),{upload:$,uploading:h}=ye(v.quotes,ce),j=m.useCallback(async o=>{const y=await $(o);y.length&&d("images",Y=>[...Y,...y])},[$,d]);je(j,n.type==="proposal");const O=m.useMemo(()=>[{key:"description",label:"AÇIKLAMA",type:"text",minWidth:"14rem",placeholder:"Ürün veya hizmet adı...",mobile:"full"},{key:"quantity",label:"MİKTAR",type:"number",width:"6rem",decimals:G.quantity,tone:"blue",mobile:"half"},{key:"price",label:"B.FİYAT",type:"money",width:"9rem",tone:"amber",mobile:"half"},{key:"vat",label:"KDV",type:"select",width:"6rem",numeric:!0,mobile:"half",options:_.map(o=>({value:o,label:`%${o}`})),optionLabel:o=>`%${o}`},{key:"total",label:"TUTAR",type:"computed",width:"9rem",tone:"emerald",mobile:"footer",compute:o=>A(L(o),n.currency)}],[n.currency]),Q=o=>{if(!o.items.length)return E("Bu siparişte ürün bulunmuyor.");T.append(xe(o,s)),r(null)},U=async()=>{const o=pe(n);if(o)return E(o);if(Z())return E("Görseller yükleniyor, lütfen bekleyin.");w(!0);try{const y=await H(me(n),v.quotes);t?await W(v.quotes,t.id,y):await J(v.quotes,y),p()}catch(y){P(y),w(!1)}};return e.jsxs(e.Fragment,{children:[e.jsx(ie,{isOpen:!0,onClose:p,title:t?"BELGEYİ DÜZENLE":"YENİ BELGE",icon:"document",headerExtra:e.jsx(F,{options:K,value:n.type,onChange:o=>d("type",o),size:"sm",ariaLabel:"Belge türü"}),aside:e.jsx(Ie,{form:n,bind:i,setField:d,customerNames:D,onImageFiles:j,uploading:h}),columns:O,lineItems:T,currency:n.currency,total:B(n.items).grandTotal,onSave:U,saving:k,toolbarExtras:e.jsxs(e.Fragment,{children:[e.jsx(R,{tone:"indigo",size:"md",icon:"clipboard",onClick:()=>r("order"),children:"SİPARİŞ EKLE"}),e.jsx(R,{tone:"purple",size:"md",icon:"percent",onClick:()=>r("vat"),children:"KDV AYARLA"})]})}),e.jsx(ke,{isOpen:g==="order",onClose:()=>r(null),customers:a,onSelect:Q}),e.jsx(Ne,{isOpen:g==="vat",onClose:()=>r(null),defaultVat:s,onApplyToAll:o=>T.setAll("vat",o),onSetDefault:o=>{l(o),E(`Varsayılan KDV %${o} olarak ayarlandı`)}})]})}function Fe({quote:t,expanded:a,onToggle:s,actions:l}){const p=K.find(i=>i.value===t.type),n=X(p.tone),d=[{key:"print",label:"Yazdır",icon:"print",tone:"accent",onClick:()=>l.print(t)},{key:"edit",label:"Düzenle",icon:"edit",tone:"blue",onClick:()=>l.openEdit(t)},{key:"delete",label:"Sil",icon:"delete",tone:"red",onClick:()=>l.remove(t)}];return e.jsxs("article",{className:u("rounded-sm border-l-4 shadow-sm",n.border,n.soft),children:[e.jsxs("div",{className:"flex items-center gap-2 md:gap-4 px-3 md:px-4 py-3",children:[e.jsxs("button",{type:"button",onClick:s,"aria-expanded":a,className:"flex items-center gap-3 min-w-0 flex-1 text-left",children:[e.jsx("span",{className:u("p-2 rounded-sm shrink-0",a?u(n.solid):"text-slate-400"),children:e.jsx(q,{name:a?"chevronUp":"chevronDown"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h3",{className:"text-base font-black uppercase tracking-tight truncate text-slate-800 dark:text-zinc-100",children:t.customerName||"—"}),e.jsxs("p",{className:"text-xs font-mono uppercase text-slate-500 dark:text-zinc-400 truncate",children:[t.teklifName||"BAŞLIKSIZ"," · ",I(t.date)]})]})]}),e.jsx("span",{className:"hidden sm:flex w-28 shrink-0 justify-center",children:e.jsx("span",{className:u("px-2.5 py-1 text-xs font-bold font-mono rounded-sm border-2",n.border),children:p.label})}),e.jsx(Ee,{value:B(t.items).grandTotal,currency:t.currency,tone:t.type==="contract"?"red":"emerald",className:"inline-block shrink-0 sm:w-44 text-right text-sm md:text-base font-black"}),e.jsx(fe,{actions:d})]}),a&&e.jsx("div",{className:u("mx-2 md:ml-14 md:mr-4 mb-3 p-2 rounded-sm border overflow-x-auto custom-scrollbar-thin",x.border,x.surface),children:e.jsxs("table",{className:u("w-full text-left text-xs text-slate-600 dark:text-zinc-300",x.number),children:[e.jsx("thead",{children:e.jsxs("tr",{className:u("border-b-2 uppercase text-slate-500 dark:text-zinc-400",x.border),children:[e.jsx("th",{className:"pb-2 px-2 font-bold",children:"Açıklama"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"Miktar"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"B.Fiyat"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"KDV"}),e.jsx("th",{className:"pb-2 px-2 text-right font-bold",children:"Tutar"})]})}),e.jsx("tbody",{children:t.items.map((i,g)=>e.jsxs("tr",{className:"border-b border-slate-100 dark:border-zinc-700 last:border-0",children:[e.jsx("td",{className:"py-2 px-2 font-bold text-slate-800 dark:text-zinc-100 min-w-[10rem]",children:i.description}),e.jsx("td",{className:"py-2 px-2 text-right",children:z(i.quantity)}),e.jsx("td",{className:"py-2 px-2 text-right whitespace-nowrap",children:A(i.price,t.currency)}),e.jsxs("td",{className:"py-2 px-2 text-right",children:["%",z(i.vat)]}),e.jsx("td",{className:u("py-2 px-2 text-right whitespace-nowrap font-black",x.accentText),children:A(L(i),t.currency)})]},g))})]})})]})}const Ve="https://imgur.com/dM24v7h.png",f="#be185d",Pe=`
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; min-height: 297mm; margin: 0; padding: 0; }
  body { font-family: 'Helvetica', sans-serif; color: #333; padding: 10mm 15mm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
  .bg-watermark { position: fixed; inset: 0; z-index: -1; }
  .bg-watermark img { width: 100%; height: 100%; object-fit: cover; }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; min-height: 277mm; }
  .doc-head { display: flex; justify-content: flex-end; margin-bottom: 40px; border-bottom: 2px solid #fce7f3; padding-bottom: 10px; }
  .doc-box { text-align: right; background: #fff; padding: 10px; border-radius: 16px; }
  .doc-box h2 { font-size: 30px; font-weight: bold; color: ${f}; margin: 0; }
  .doc-meta td { border: none; padding: 2px; font-size: 12px; }
  .doc-meta td:first-child { font-weight: bold; color: #831843; }
  .to-label { font-size: 10px; font-weight: bold; color: ${f}; }
  .to-name { font-size: 18px; font-weight: bold; margin-bottom: 30px; }
  table.items { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px; }
  table.items th { border-bottom: 2px solid ${f}; color: ${f}; padding: 8px 4px; text-align: left; font-weight: bold; text-transform: uppercase; }
  table.items td { border-bottom: 1px solid #fce7f3; padding: 8px 4px; vertical-align: top; }
  .r { text-align: right; } .c { text-align: center; }
  .totals { margin-left: auto; width: 300px; padding: 10px; }
  .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10pt; }
  .grand-total { font-size: 14pt; font-weight: bold; color: ${f}; border-top: 2px solid ${f}; padding-top: 8px; margin-top: 4px; }
  .terms { margin-top: 20%; font-size: 10pt; line-height: 1.5; }
  .signs { display: flex; justify-content: space-between; gap: 20px; margin: 50px 0; }
  .sign { width: 48%; }
  .sign-title { color: ${f}; font-weight: bold; font-size: 11pt; margin-bottom: 10px; }
  .sign-box { border: 2px dashed ${f}; min-height: 150px; font-size: 10pt; line-height: 1.6; padding: 10px; box-sizing: border-box; }
  .images { margin-top: auto; padding-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .images img { max-width: 45%; max-height: 200px; object-fit: contain; border: 1px solid #fce7f3; background: white; padding: 3px; }
  .note { margin-top: 20px; font-size: 11px; white-space: pre-wrap; }
  .footer { margin-top: auto; border-top: 1px solid #fce7f3; padding-top: 10px; font-size: 9px; color: #9d174d; text-align: center; font-weight: bold; }
`,Ke=(t,a=null)=>{const s=t.type==="contract",l=r=>A(r,t.currency),p=B(t.items),n=c`
      <table class="items">
        <thead><tr><th style="width:45%">Açıklama</th><th class="c">Miktar</th><th class="r">Birim Fiyat</th><th class="c">KDV %</th><th class="r">Tutar</th></tr></thead>
        <tbody>${t.items.map(r=>c`
          <tr>
            <td>${r.description}</td>
            <td class="c">${z(r.quantity)}</td>
            <td class="r">${l(r.price)}</td>
            <td class="c">%${z(r.vat)}</td>
            <td class="r"><strong>${l(L(r))}</strong></td>
          </tr>`)}
        </tbody>
      </table>`,d=c`
      <div class="totals" ${s?c`style="page-break-after:always;"`:""}>
        <div class="total-row"><span>Ara Toplam:</span><span>${l(p.subtotal)}</span></div>
        <div class="total-row"><span>Toplam KDV:</span><span>${l(p.totalVat)}</span></div>
        <div class="total-row grand-total"><span>Genel Toplam:</span><span>${l(p.grandTotal)}</span></div>
      </div>`,i=c`
      <div class="terms">
        <p><strong>Ödeme Şekli:</strong> ${t.paymentMethod||ge}</p>
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
      </div>`,g=c`
      <div class="bg-watermark"><img src="${Ve}" alt="" /></div>
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
        ${d}
        ${s?i:t.note?c`<div class="note"><strong>NOT:</strong><br/>${t.note}</div>`:""}
        ${t.images.length?c`<div class="images">${t.images.map(r=>c`<img src="${r}" alt="" />`)}</div>`:""}
        <div class="footer">ERCELEBILER AHSAP - Profesyonel Çözümler</div>
      </div>`;return Se({title:`${s?"Sözleşme":"Teklif"} - ${t.teklifNo}`,css:Pe,body:g,delay:1e3})};function Oe(){const t=ee(),a=V(v.quotes,{normalize:he}),s=V(v.customers,{normalize:Ae,orderField:"name",direction:"asc"}),[l,p]=m.useState("all"),[n,d]=m.useState(""),[i,g]=m.useState({start:"",end:""}),[r,k]=m.useState(te),[w,N]=m.useState({open:!1,quote:null}),S=ze(),T=m.useMemo(()=>ue(a.data,{type:l,needle:we(n),dateRange:i}),[a.data,l,n,i]),D=h=>s.data.find(j=>j.name===h)||null,$={openNew:()=>N({open:!0,quote:null}),openEdit:h=>N({open:!0,quote:h}),closeEditor:()=>N({open:!1,quote:null}),print:h=>Ke(h,D(h.customerName))||E("Açılır pencere engellendi."),remove:async h=>{if(!(!t.isAdmin||!ae("Silmek istediğinize emin misiniz?")))try{await se(v.quotes,h.id)}catch(j){P(j)}}};return{loading:a.loading||s.loading,error:a.error||s.error,total:a.data.length,visible:T,customers:s.data,type:l,setType:p,search:n,setSearch:d,dateRange:i,setDateRange:g,defaultVat:r,setDefaultVat:k,editor:w,expanded:S,actions:$}}const Qe=[{value:"all",label:"TÜMÜ",tone:"neutral"},{value:"proposal",label:"TEKLİF",tone:"indigo"},{value:"contract",label:"SÖZLEŞME",tone:"red"}];function mt(){const t=Oe(),{actions:a}=t;return t.loading?e.jsx(oe,{}):e.jsxs("div",{className:x.page,children:[e.jsxs(Ce,{icon:"document",title:"Teklif & Sözleşme",subtitle:`Kayıtlı belge: ${t.total}`,children:[e.jsx(Me,{value:t.search,onChange:t.setSearch,placeholder:"BELGE / MÜŞTERİ ARA..."}),e.jsx(De,{value:t.dateRange,onChange:t.setDateRange}),e.jsx(F,{options:Qe,value:t.type,onChange:t.setType,size:"md",ariaLabel:"Belge türü filtresi",className:"sm:w-80"}),e.jsx(R,{icon:"add",onClick:a.openNew,children:"YENİ BELGE"})]}),t.error&&e.jsxs("p",{className:"text-sm text-red-600",children:["Veri yüklenemedi: ",t.error.message]}),e.jsxs("div",{className:"space-y-2",children:[t.visible.length===0&&e.jsx($e,{icon:"document",title:"Kayıt bulunamadı"}),t.visible.map(s=>e.jsx(Fe,{quote:s,actions:a,expanded:t.expanded.isOn(s.id),onToggle:()=>t.expanded.toggle(s.id)},s.id))]}),e.jsx(Le,{isOpen:t.editor.open,quote:t.editor.quote,customers:t.customers,defaultVat:t.defaultVat,onDefaultVatChange:t.setDefaultVat,onClose:a.closeEditor})]})}export{mt as default};
