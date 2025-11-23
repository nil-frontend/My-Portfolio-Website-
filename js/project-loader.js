// console.log("t")
// 13/11/2025
// https://docs.google.com/spreadsheets/d/14P1DtYJ53opsDNh_IJT4HaK_TEOv_ca97VPcmc-BjA8/edit?gid=22235903#gid=22235903
// projects-loader.js
// https://docs.google.com/spreadsheets/d/1q4wpFrsbYbd3pDU2k8RKkiCTt0A-CGwG/edit?usp=sharing&ouid=110147846712567429914&rtpof=true&sd=true
// Fetches a published Google Sheet and renders portfolio cards into #portfolioContainer
// CHANGE: replace SPREADSHEET_ID with your sheet id
// const SPREADSHEET_ID = '14P1DtYJ53opsDNh_IJT4HaK_TEOv_ca97VPcmc-BjA8';
// const SHEET_NAME = 'projects_extended'; // optional: 'Sheet1' or leave empty to use default
const SPREADSHEET_ID = '1q4wpFrsbYbd3pDU2k8RKkiCTt0A-CGwG';
const SHEET_NAME = 'projects_details'; // optional: 'Sheet1' or leave empty to use default

// --- Helper: fetch Google Sheet published as gviz JSON and return array of objects
async function fetchSheetAsObjects(spreadsheetId, sheetName = '') {
  const base = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?`;
  const params = new URLSearchParams({ tq: 'select *', tqx: 'out:json' });
  if (sheetName) params.set('sheet', sheetName);
  const url = base + params.toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sheet: ' + res.status);
  const text = await res.text();

  // response is wrapped in google.visualization.Query.setResponse(...)
  const jsonStr = text.replace(/^[^\(]*\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonStr);

  const cols = (data.table.cols || []).map(c => (c.label || c.id || '').toString().trim());
  const rows = data.table.rows || [];

  const objects = rows.map(r => {
    const obj = {};
    (r.c || []).forEach((cell, i) => {
      obj[cols[i] || `col${i}`] = cell ? cell.v : '';
    });
    return obj;
  });

  return objects;
}

// --- Helper: escape text to avoid HTML injection
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Render a single portfolio card node
function createCardNode(project) {
  const id = project.id || '';
  const title = project.title || '';
  const description = project.description || '';
  // prefer image url from sheet, fallback to placeholder
  const image = project.image || project.img || 'portfolio pic/Optimized-pic/portfolio1 done.jpg';
  const externalUrl = project.external_url || project.url || '#';

  const card = document.createElement('div');
  const cardLinkBtn = document.getElementsByClassName(".ProjectLink")
  card.className = 'portfolio-box';
  card.dataset.id = id;

  // inner HTML: matches your original structure (img + .portfolio-layer)
  card.innerHTML = `
    <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" onerror="this.style.opacity=.6;this.src='portfolio pic/Optimized-pic/portfolio1 done.jpg';">
    <div class="portfolio-layer">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(description)}</p>
      <a class="ProjectLink" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer" aria-label="external-link"><i class='bx bx-link-external'></i></a>
    </div>
  `;

  // click card -> navigate to pretty URL /projects/{id}
  // card.addEventListener('click', (e) => {
  //   // if the user clicked the inner external link, let it open externalUrl
  //   if (e.target.closest('a')) return;
  //   if (id) {
  //     window.location.href = '/projects/' + encodeURIComponent(id);
  //   } else {
  //     // no id: maybe open external url as fallback
  //     if (externalUrl && externalUrl !== '#') window.open(externalUrl, '_blank', 'noopener');
  //   }
  // });

  const linkBtn = card.querySelector("a");

  // Disable card click
  card.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Make <a> open the project page
  if (linkBtn) {
    linkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (id) {
        window.location.href = "/projects/" + encodeURIComponent(id);
      }
    });
  }


  return card;
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



// --- Main init: fetch sheet and render cards
async function initPortfolio() {
    // console.log("object")
  const container = document.getElementById('portfolioContainer');
  if (!container) return;

  container.innerHTML = '<p>Loading projects…</p>';
  try {
    const projects = await fetchSheetAsObjects(SPREADSHEET_ID, SHEET_NAME);
    // console.log(projects)
    if (!projects || projects.length === 0) {
      container.innerHTML = '<p>No projects found in the sheet.</p>';
      return;
    }
    const projectDataReStructured = dataReStructure(projects);
    // const projectDataReStructured = projects;
    // console.log(projectDataReStructured)
    // clear container then append a card for each project
    container.innerHTML = '';
    projectDataReStructured.forEach(proj => {
      const card = createCardNode(proj);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load projects:', err);
    container.innerHTML = `<p>Failed to load projects: ${escapeHtml(err.message || err)}</p>`;
  }
}
// console.log("hjjjh")
// run after DOM is parsed (script is loaded with defer in HTML)
initPortfolio();