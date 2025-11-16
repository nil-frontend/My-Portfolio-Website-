// projects.js - selected + list + pushState navigation
const CONFIG = {
  SPREADSHEET_ID: "14P1DtYJ53opsDNh_IJT4HaK_TEOv_ca97VPcmc-BjA8", // <-- replace
  SHEET_NAME: "projects_extended"
};

/* ---------- small helpers ---------- */
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
function normalizeKey(k){ return String(k||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^\w_]/g,'').replace(/_+/g,'_').replace(/^_+|_+$/g,''); }
function fixImageUrl(url){ if(!url) return ''; if(/^https?:\/\//i.test(url)) return url; return window.location.origin.replace(/\/$/,'') + '/' + String(url).replace(/^\//,''); }

/* ---------- get id from pretty path or ?id= fallback ---------- */
function getIdFromPath(){
  const path = window.location.pathname.replace(/\/+$/,'');
  const parts = path.split('/');
  const last = parts[parts.length - 1];
  if(!last || last.toLowerCase()==='projects' || last.toLowerCase()==='projects.html'){
    const qp = new URLSearchParams(window.location.search).get('id');
    return qp ? decodeURIComponent(qp) : null;
  }
  return decodeURIComponent(last);
}

/* ---------- fetch GViz JSON (client-side) ---------- */
async function fetchGviz(spreadsheetId, sheetName=''){
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?`;
  const params = new URLSearchParams({ tq:'select *', tqx:'out:json' });
  if(sheetName) params.set('sheet', sheetName);
  const url = base + params.toString();
  const res = await fetch(url, { redirect:'follow' });
  if(!res.ok) throw new Error('Network error ' + res.status);
  if(res.url && res.url.includes('accounts.google.com')) throw new Error('Sheet must be published and public.');
  const text = await res.text();
  if(!/google\.visualization\.Query\.setResponse\(/.test(text)) throw new Error('Unexpected sheet response');
  const jsonStr = text.replace(/^[^\(]*\(/,'').replace(/\);?$/,'');
  const data = JSON.parse(jsonStr);
  return data.table;
}

/* ---------- CSV fallback ---------- */
async function fetchCsv(id, sheetName=''){
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/export?format=csv` + (sheetName ? '&sheet=' + encodeURIComponent(sheetName) : '');
  const res = await fetch(url, { redirect:'follow' });
  if(!res.ok) throw new Error('CSV fetch failed ' + res.status);
  const txt = await res.text();
  const lines = txt.trim().split(/\r?\n/).filter(Boolean);
  if(!lines.length) return [];
  const headers = lines.shift().split(',').map(h=>normalizeKey(h));
  return lines.map(line => {
    const cols = line.split(',').map(c=>c.trim());
    const o = {};
    headers.forEach((h,i)=> o[h] = cols[i] !== undefined ? cols[i] : '');
    return o;
  });
}

/* ---------- normalize table (handles header-in-first-row or table.cols) ---------- */
function normalizeTable(table){
  if(!table || !Array.isArray(table.rows)) return [];
  const rawCols = Array.isArray(table.cols) ? table.cols.map(c=> (c && (c.label || c.id)) || '') : [];
  const hasLabels = rawCols.some(x => x && String(x).trim() !== '');
  let headers=[], dataRows=[];
  if(hasLabels){
    headers = rawCols.map(h => normalizeKey(h||''));
    dataRows = table.rows || [];
  } else {
    if(!table.rows || table.rows.length===0) return [];
    const headerCells = table.rows[0].c || [];
    headers = headerCells.map(c => normalizeKey((c && c.v) || ''));
    dataRows = (table.rows || []).slice(1);
  }
  return dataRows.map(row => {
    const obj = {};
    const cells = row.c || [];
    for(let i=0;i<headers.length;i++){
      const key = headers[i] || ('col'+i);
      const cell = cells[i];
      obj[key] = (cell && cell.v !== undefined) ? cell.v : '';
    }
    return obj;
  });
}

// ✅ dataReStructure() — FIXES YOUR EXACT RESPONSE
function dataReStructure(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length < 2) return [];

  const headerRow = rawRows[0];               // row 0 contains keys a,b,c,d...
  const headerMap = {};

  // Build map:  a → "id", b → "title", c → "description", ...
  for (const letter in headerRow) {
    headerMap[letter] = headerRow[letter];    // "id", "title", ...
  }

  const output = [];

  // Convert remaining rows into proper objects
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row) continue;

    const obj = {};

    for (const letter in headerMap) {
      const keyName = headerMap[letter];      // e.g. "id"
      const value = row[letter];

      obj[keyName] = value !== undefined ? value : "";
    }

    output.push(obj);
  }

  return output;
}


/* ---------- render selected project (top) ---------- */
function renderSelected(project){
  const sel = document.getElementById('selectedContainer');
  if(!project){
    sel.innerHTML = '<div class="empty">Project not found.</div>';
    return;
  }
  const mainBody = document.querySelector("body")
  const tagsHtml = (project.tags||'').split(',').map(t=>t.trim()).filter(Boolean).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
  const imageSrc = project.image ? (project.image.startsWith('http') ? project.image : fixImageUrl(project.image)) : '';
// console.log(project)
  const embedLink = project.embedLink? project.embedLink : "https://www.youtube-nocookie.com/embed/FWfxb3Qh2L0?si=xfXFvvZvE9zfXlv9?controls=0&autoplay=1&mute=1";
  const projectLiveLink =project.liveLink? project.liveLink : "https://github.com/nil-frontend";

  if (imageSrc) {
    const opacity = 0.5; // 0 to 1
    mainBody.style.background = `
  linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})),
  url("${escapeHtml(imageSrc)}")`;
    mainBody.style.backgroundRepeat = "round";
  }
// social links of projects


  sel.innerHTML = `
    <div class="project-card">
      <div class="project-media">
        ${
          //<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(project.title)}" onerror="this.src='https://via.placeholder.com/800x480?text=No+image'">
          ``}
        <iframe width="100%" height="100%" src="${escapeHtml(embedLink)}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>
      <div class="project-body">
        <div class="project-title">${escapeHtml(project.title)}</div>
        <div class="project-meta">${escapeHtml(project.category||'')} · ${escapeHtml(project.level||'')} · ${escapeHtml(project.date||'')}</div>
        <div class="project-desc">${escapeHtml(project.long_description || project.description || '')}</div>
        <div class="project-tags">${tagsHtml}</div>
        <div class="project-actions">
          <a class="btn" id="openProjectBtn">${escapeHtml(project.external_url ? 'Open Project' : 'No link')}</a>
          ${project.external_url ? `<a class="btn secondary" href="${escapeHtml(project.external_url)}" target="_blank" rel="noopener">External Link</a>` : ''}
          </div>
          <div class="social-media">
                    ${project.fbLink ? `<a href="${project.fbLink}" target="_blank"> <i class='bx bxl-facebook'> </i> </a>`:''}
                    ${project.xLink ? `<a href="${project.xLink}" target="_blank"> <i class='bx bxl-twitter' > </i></a>`:''}
                    ${project.ytLink ? `<a href="${project.ytLink}" target="_blank"> <i class='bx bxl-youtube'></i></a>`:`<a href="https://www.youtube.com/@NiLTheDeveloper" target="_blank"> <i class='bx bxl-youtube'></i></a>`}
                    ${project.instaLink ? `<a href="${project.instaLink}" target="_blank"> <i class='bx bxl-instagram' > </i></a>`:`<a href="https://instagram.com/nil___003_?igshid=MzRlODBiNWFlZA==" target="_blank"> <i class='bx bxl-instagram' > </i></a>`}
                    ${project.linkedinLink ? `<a href="${project.linkedinLink}" target="_blank"> <i class='bx bxl-linkedin' > </i></a>`:`<a href="https://www.linkedin.com/in/nilkantha-dwibedi-58a687279" target="_blank"> <i class='bx bxl-linkedin' > </i></a>`}
                    ${project.githubLink ? `<a href="${project.githubLink}" target="_blank"> <i class='bx bxl-github' > </i></a>`:`<a href="https://github.com/nil-frontend" target="_blank"> <i class='bx bxl-github' > </i></a>`}
                    ${project.codePenLink ? `<a href="${project.codePenLink}" target="_blank"> <i class='bx bxl-codepen' > </i></a>`:''}
                    <a href="mailto:feedbacknil@gmail.com" target="_blank"> <i class='bx bxl-gmail' > </i></a>
          </div>
      </div>
    </div>
  `;

  const openBtn = document.getElementById('openProjectBtn');
  if(openBtn){
    openBtn.addEventListener('click', ()=> {
      if(projectLiveLink) window.open(projectLiveLink, '_blank', 'noopener');
    });
  }
}

/* ---------- render bottom grid (other projects) ---------- */
function renderAllProjectsGrid(allProjects, currentId){
  const container = document.getElementById('allProjectsContainer');
  container.innerHTML = '';
  if(!Array.isArray(allProjects) || !allProjects.length){
    container.innerHTML = '<div class="empty">No projects found.</div>';
    return;
  }

  allProjects.forEach(p => {
    // build small card; exclude current from clickable or show as disabled
    const isCurrent = String(p.id||'').toLowerCase() === String(currentId||'').toLowerCase();
    const img = p.image ? (p.image.startsWith('http') ? p.image : fixImageUrl(p.image)) : '';

    const box = document.createElement('div');
    box.className = 'portfolio-box';
    if(isCurrent) box.style.opacity = '0.7';
    if(isCurrent) box.style.border = 'solid #0ef';
    

    box.innerHTML = `
      <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}">
      <div class="portfolio-layer">
        <h4>${escapeHtml(p.title)}</h4>
        <div class="lilCrdDes">
            <p>${escapeHtml(p.description)}</p>
            <a class="link-btn" href="${escapeHtml(p.external_url || '#')}">Open</a>
        </div>
      </div>
    `;

    // clicking the card background does nothing
    box.addEventListener('click', (e) => { e.stopPropagation(); });

    // the small link button should change current id (pushState) and render
    const linkBtn = box.querySelector('a.link-btn');
    if(linkBtn){
      linkBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if(isCurrent) return;
        const newId = p.id;
        // update URL to /projects/{id}
        const newUrl = '/projects/' + encodeURIComponent(newId);
        history.pushState({ id: newId }, '', newUrl);
        // render selected project at top
        renderSelected(p);
        // scroll to top of selected section
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // re-render grid to mark new current
        renderAllProjectsGrid(allProjects, newId);
      });
    }

    container.appendChild(box);
  });
}

/* ---------- main flow: load sheet, init UI, handle popstate ---------- */
(async function main(){
  const projectIdFromUrl = getIdFromPath();
  const selContainer = document.getElementById('selectedContainer');
  const allContainer = document.getElementById('allProjectsContainer');
  selContainer.innerHTML = '<div class="empty">Loading project…</div>';
  allContainer.innerHTML = '<div class="empty">Loading projects…</div>';

  if(!CONFIG.SPREADSHEET_ID){
    selContainer.innerHTML = '<div class="empty">No spreadsheet configured.</div>';
    return;
  }

  try {
    // fetch sheet
    const table = await fetchGviz(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME).catch(()=>null);
    let projectsP = [];
    if(table) projectsP = normalizeTable(table);
    else {
      // try CSV fallback
      projectsP = await fetchCsv(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME);
    }
    let projects = dataReStructure(projectsP);
    // ensure id fields are strings and normalized
    projects = projects.map(p=>{
      p.id = String(p.id || p.ID || p.a || '').trim();
      // if images are relative, keep as is; fixImageUrl when rendering
      return p;
    });

    // find selected: prefer URL id, else first project
    const initialId = projectIdFromUrl || (projects[0] && projects[0].id) || null;
    const selected = projects.find(p => String(p.id||'').toLowerCase() === String(initialId||'').toLowerCase()) || projects[0] || null;

    // render
    renderSelected(selected);
    renderAllProjectsGrid(projects, selected ? selected.id : null);

    // push initial state if there's an id (so back works)
    if(selected && projectIdFromUrl && projectIdFromUrl.toLowerCase() !== selected.id.toLowerCase()){
      // if URL had id but not matched (rare), update to matched id
      history.replaceState({ id: selected.id }, '', '/projects/' + encodeURIComponent(selected.id));
    } else if(selected && !projectIdFromUrl){
      history.replaceState({ id: selected.id }, '', '/projects/' + encodeURIComponent(selected.id));
    }

    // handle back/forward
    window.addEventListener('popstate', (ev) => {
      const stateId = (ev.state && ev.state.id) || getIdFromPath();
      const found = projects.find(p => String(p.id||'').toLowerCase() === String(stateId||'').toLowerCase());
      if(found){
        renderSelected(found);
        renderAllProjectsGrid(projects, found.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

  } catch(err) {
    console.error(err);
    selContainer.innerHTML = '<div class="empty">Failed to load projects: ' + escapeHtml(String(err.message || err)) + '</div>';
    allContainer.innerHTML = '';
  }

  // back link: preserve history if exists
  const backLink = document.getElementById('backLink');
  if(backLink){
    backLink.addEventListener('click', function(e){
      if(window.history.length > 1){ e.preventDefault(); window.history.back(); }
    });
  }
})();
