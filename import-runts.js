const fs = require('fs');
const readline = require('readline');
const https = require('https');
const path = require('path');

// 1. Legge .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERRORE: Manca NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local!");
  process.exit(1);
}

const host = SUPABASE_URL.replace('https://', '').replace('/', '');

// Invia i dati direttamente alle REST API di Supabase
function postBatch(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: host,
      path: '/rest/v1/runts_import',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

// Parser CSV robusto
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Mappatura consentita per la tabella 'runts_import'
const ALLOWED_COLUMNS = new Set([
  'codice_fiscale', 
  'denominazione', 
  'sezione_runts', 
  'comune', 
  'provincia', 
  'legale_rappresentante'
]);

async function start() {
  const csvFilePath = path.join(process.cwd(), 'runts_nazionale_clean.csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ ERRORE: Non trovo il file ${csvFilePath} nella root del progetto!`);
    process.exit(1);
  }

  console.log('🚀 Avvio importazione rapida di 150.544 associazioni...');

  const fileStream = fs.createReadStream(csvFilePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = [];
  let batch = [];
  let totalInserted = 0;
  let lineIndex = 0;
  const BATCH_SIZE = 2500;

  for await (const line of rl) {
    const cleanLine = line.replace(/\r/g, '').trim();
    if (!cleanLine) continue;

    const columns = parseCSVLine(cleanLine);

    if (lineIndex === 0) {
      // Pulizia profonda delle intestazioni
      headers = columns.map(h => h.replace(/^["']|["']$/g, '').trim());
      console.log('📋 Colonne individuate nel CSV:', headers);
      lineIndex++;
      continue;
    }

    const rowObj = {};
    headers.forEach((header, idx) => {
      // Consideriamo solo le colonne valide per il DB
      if (header && ALLOWED_COLUMNS.has(header)) {
        let val = columns[idx] ? columns[idx].replace(/^["']|["']$/g, '').trim() : null;
        if (val === '' || val === 'nan' || val === 'NULL' || val === 'None') val = null;
        rowObj[header] = val;
      }
    });

    batch.push(rowObj);
    lineIndex++;

    if (batch.length >= BATCH_SIZE) {
      try {
        await postBatch(batch);
        totalInserted += batch.length;
        console.log(`⏳ Caricati ${totalInserted.toLocaleString('it-IT')} / 150.544 record...`);
        batch = [];
      } catch (err) {
        console.error(`❌ Errore durante l'invio del batch:`, err.message);
        process.exit(1);
      }
    }
  }

  if (batch.length > 0) {
    try {
      await postBatch(batch);
      totalInserted += batch.length;
      console.log(`⏳ Caricati ${totalInserted.toLocaleString('it-IT')} / 150.544 record...`);
    } catch (err) {
      console.error(`❌ Errore nell'ultimo blocco:`, err.message);
    }
  }

  console.log(`\n🎉 COMPLETATO! Totale caricato sul database: ${totalInserted.toLocaleString('it-IT')} associazioni.`);
}

start();