// FRIDAY v2 — Dashboard Briefing Widget
// Lädt vault_briefing.json und rendert Daten direkt ins Dashboard
(()=>{
  async function loadAndRender(){
    let data=null;
    try{
      const r=await fetch('./vault_briefing.json?_='+Date.now(),{cache:'no-store'});
      if(r.ok)data=await r.json();
    }catch{}

    if(!data)return;

    // 1. Hero-Text mit Datum + Summary
    const hero=document.querySelector('#heroText');
    if(hero&&data.summary){
      hero.textContent=data.summary.slice(0,120);
    }

    // 2. Crypto-Preise in eigenes Element rendern (oder erstellen)
    renderCryptoWidget(data.crypto);

    // 3. Projekte anzeigen
    renderProjectsWidget(data.projects);

    // 4. Datum in Statusbar
    const dateEl=document.querySelector('#currentDate,.orbit-date,[data-date]');
    if(dateEl&&data.date)dateEl.textContent=data.date;
  }

  function renderCryptoWidget(crypto){
    if(!crypto)return;
    let el=document.querySelector('#orbitCryptoWidget');
    if(!el){
      // Widget dynamisch erstellen und ins Dashboard einfügen
      el=document.createElement('div');
      el.id='orbitCryptoWidget';
      el.style.cssText=`
        position:fixed;
        bottom:24px;
        right:24px;
        background:linear-gradient(135deg,rgba(3,17,23,.92),rgba(0,20,30,.88));
        border:1px solid rgba(0,229,255,.25);
        border-radius:14px;
        padding:14px 20px;
        font-family:ui-monospace,Consolas,monospace;
        font-size:11px;
        color:#a0d8ef;
        letter-spacing:.05em;
        backdrop-filter:blur(12px);
        z-index:999;
        min-width:180px;
        box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(0,229,255,.1);
      `;
      document.body.appendChild(el);
    }

    const btc=crypto.btc_eur;
    const sol=crypto.sol_eur;
    const fmtBtc=btc?`${btc.toLocaleString('de-DE')} €`:'–';
    const fmtSol=sol?`${sol.toLocaleString('de-DE',{minimumFractionDigits:2})} €`:'–';

    el.innerHTML=`
      <div style="color:rgba(0,229,255,.5);letter-spacing:.2em;font-size:9px;margin-bottom:8px">MARKTDATEN · LIVE</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;gap:20px;align-items:center">
          <span style="color:rgba(255,255,255,.5)">₿ BTC</span>
          <span style="color:#f7931a;font-weight:600;font-size:13px">${fmtBtc}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:20px;align-items:center">
          <span style="color:rgba(255,255,255,.5)">◎ SOL</span>
          <span style="color:#9945ff;font-weight:600;font-size:13px">${fmtSol}</span>
        </div>
      </div>
      <div style="color:rgba(255,255,255,.2);font-size:8px;margin-top:8px;text-align:right">via CoinGecko · ORBIT</div>
    `;
  }

  function renderProjectsWidget(projects){
    if(!projects||!projects.length)return;
    let el=document.querySelector('#orbitProjectsWidget');
    if(!el){
      el=document.createElement('div');
      el.id='orbitProjectsWidget';
      el.style.cssText=`
        position:fixed;
        bottom:24px;
        left:24px;
        background:linear-gradient(135deg,rgba(3,17,23,.92),rgba(10,15,20,.88));
        border:1px solid rgba(255,47,33,.2);
        border-radius:14px;
        padding:14px 20px;
        font-family:ui-monospace,Consolas,monospace;
        font-size:11px;
        color:#f1e5da;
        letter-spacing:.04em;
        backdrop-filter:blur(12px);
        z-index:999;
        min-width:200px;
        max-width:260px;
        box-shadow:0 8px 32px rgba(0,0,0,.4);
      `;
      document.body.appendChild(el);
    }

    const clean=projects.map(p=>
      p.replace(/Medizinische Chronik|HWS,BWS,LWS|HWS|BWS|LWS/g,'')
       .replace(/\s*-\s*/g,' ').replace(/\s+/g,' ').trim()
    ).filter(p=>p.length>3).slice(0,5);

    el.innerHTML=`
      <div style="color:rgba(255,47,33,.5);letter-spacing:.2em;font-size:9px;margin-bottom:8px">AKTIVE BEREICHE</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${clean.map(p=>`
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:4px;height:4px;border-radius:50%;background:rgba(255,47,33,.6);flex-shrink:0"></span>
            <span style="color:#d6a95c;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Beim DOMContentLoaded und nach Boot laden
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',loadAndRender);
  }else{
    loadAndRender();
  }

  // Auch nach 5s laden (nach Boot-Sequence)
  setTimeout(loadAndRender,5000);

  window.ORBITDashboard={loadAndRender};
})();
