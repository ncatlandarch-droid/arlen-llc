/**
 * Arlan LLC — Printful Product Pipeline
 * 
 * Creates the full merch line on Printful:
 * - A Logo Tee (Bella+Canvas 3001)
 * - A Logo Hoodie (Gildan 18500)
 * - Mascot Tee (Bella+Canvas 3001)
 * - Mascot Hoodie (Gildan 18500)
 * - A Logo Dad Hat (Yupoong 6245CM)
 * - A Logo Snapback (Yupoong 6089M)
 * 
 * USAGE:
 *   node scripts/printful-setup.mjs              # Create all products
 *   node scripts/printful-setup.mjs --lookup 71 Black   # Lookup variant IDs
 *   node scripts/printful-setup.mjs --verify      # Check existing products
 */

const PRINTFUL_KEY = process.env.PRINTFUL_API_KEY;
if (!PRINTFUL_KEY) { console.error('ERROR: Set PRINTFUL_API_KEY env var'); process.exit(1); }

// ═══════════════════════════════════════════════════════════════
// ARLAN LLC CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const STORE_ID = '18232014';  // Think! Apparel (core store with API access)
// NOTE: Arlan QuickStore (ID: 18310664) cannot use the API directly.
// Products are created here in Think! Apparel, then copied to Arlan QuickStore
// via Printful Dashboard → My Products → ⋮ → Copy to Store → Arlan
const SITE_URL = 'https://arlanpro.com';
const DESIGNS_PATH = '/printful-designs';

// Pre-confirmed variant IDs (Black, S through 2XL)
const TEE_BLACK   = [4016, 4017, 4018, 4019, 4020];     // Bella+Canvas 3001
const HOODIE_BLACK = [5530, 5531, 5532, 5533, 5534];    // Gildan 18500

// We'll look these up dynamically if needed
let CAP_DAD_BLACK = [];    // Yupoong 6245CM — need to look up
let CAP_SNAP_BLACK = [];   // Yupoong 6089M — need to look up

// ── PRODUCT LINEUP ──────────────────────────────────────────────
const PRODUCTS = [
  // ── A LOGO LINE ──
  {
    name: 'Arlan "A" Logo Tee',
    variants: TEE_BLACK,
    placement: 'front',
    design: 'arlan-a-logo.png',
    price: '32.00',
    thumb: '/assets/images/merch-logo-tee.png',
  },
  {
    name: 'Arlan "A" Logo Hoodie',
    variants: HOODIE_BLACK,
    placement: 'front',
    design: 'arlan-a-logo.png',
    price: '52.00',
    thumb: '/assets/images/merch-logo-hoodie.png',
  },

  // ── MASCOT LINE ──
  {
    name: 'Arlan Mascot Tee',
    variants: TEE_BLACK,
    placement: 'front',
    design: 'arlan-mascot.png',
    price: '35.00',
    thumb: '/assets/images/merch-tee.png',
  },
  {
    name: 'Arlan Mascot Hoodie',
    variants: HOODIE_BLACK,
    placement: 'front',
    design: 'arlan-mascot.png',
    price: '55.00',
    thumb: '/assets/images/merch-hoodie.png',
  },
];

// Caps added after variant lookup
const CAP_PRODUCTS = [
  {
    name: 'Arlan "A" Dad Hat',
    catalogId: 206,  // Yupoong 6245CM
    placement: 'embroidery_front_large',
    design: 'arlan-icon-original.png',
    price: '28.00',
    thumb: '/assets/images/merch-logo-hat.png',
    threadColors: ['#F5A623', '#0D4F4F'],  // Gold A on teal threads
  },
  {
    name: 'Arlan Snapback',
    catalogId: 352,  // Yupoong 6089M
    placement: 'embroidery_front_large',
    design: 'arlan-icon-original.png',
    price: '30.00',
    thumb: '/assets/images/merch-hat.png',
    threadColors: ['#F5A623', '#0D4F4F'],
  },
];

// ═══════════════════════════════════════════════════════════════

// ── API Helper ──────────────────────────────────────────────────
async function pf(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${PRINTFUL_KEY}`,
      'Content-Type': 'application/json',
      'X-PF-Store-Id': STORE_ID,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.printful.com${endpoint}`, opts);
  return res.json();
}

// ── Variant Lookup ──────────────────────────────────────────────
async function lookupVariants(catalogProductId, color = 'Black') {
  let variants = [];
  let url = `https://api.printful.com/v2/catalog-products/${catalogProductId}/catalog-variants?limit=100`;
  let page = 0;
  while (url && page < 10) {
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${PRINTFUL_KEY}` } });
    const d = await r.json();
    variants = variants.concat(d.data || []);
    url = d._links?.next?.href || null;
    page++;
  }
  const filtered = variants.filter(v => v.color === color);
  console.log(`\nFound ${filtered.length} "${color}" variants for catalog product ${catalogProductId}:\n`);
  filtered.forEach(v => console.log(`  ${v.id} | ${v.size} | ${v.color}`));
  console.log(`\nCopy-paste: [${filtered.map(v => v.id).join(', ')}]`);
  return filtered;
}

// ── Design Upload ───────────────────────────────────────────────
async function uploadDesign(file) {
  const r = await pf('/files', 'POST', {
    type: 'default',
    url: `${SITE_URL}${DESIGNS_PATH}/${file}`,
    filename: file,
  });
  if (r.code === 200) {
    console.log(`    Uploaded: ${file} (ID: ${r.result.id})`);
    return r.result.id;
  } else {
    console.log(`    Upload failed: ${r.error?.message || JSON.stringify(r).substring(0, 200)}`);
    return null;
  }
}

// ── Create Product ──────────────────────────────────────────────
async function createProduct(prod, existingNames) {
  process.stdout.write(`  ${prod.name}...`);

  if (existingNames.includes(prod.name)) {
    console.log(' SKIP (already exists)');
    return 'skipped';
  }

  try {
    const fileId = await uploadDesign(prod.design);
    if (!fileId) { console.log(' FAIL (upload)'); return 'failed'; }

    // Wait for Printful to process the file
    await new Promise(r => setTimeout(r, 3000));

    const syncVariants = prod.variants.map(vid => {
      const file = { type: prod.placement, id: fileId };
      const variant = { variant_id: vid, retail_price: prod.price, files: [file] };
      if (prod.threadColors) {
        variant.options = [{ id: 'thread_colors_front_large', value: prod.threadColors }];
      }
      return variant;
    });

    const res = await pf('/store/products', 'POST', {
      sync_product: { name: prod.name, thumbnail: `${SITE_URL}${prod.thumb}` },
      sync_variants: syncVariants,
    });

    if (res.code === 200) {
      console.log(` OK (${prod.variants.length} variants)`);
      return 'created';
    } else {
      console.log(` FAIL: ${res.error?.message || JSON.stringify(res).substring(0, 150)}`);
      return 'failed';
    }
  } catch (err) {
    console.log(` FAIL: ${err.message}`);
    return 'failed';
  }
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  // Handle --lookup flag
  if (process.argv[2] === '--lookup') {
    const catId = process.argv[3] || '71';
    const color = process.argv[4] || 'Black';
    await lookupVariants(catId, color);
    return;
  }

  // Handle --verify flag
  if (process.argv[2] === '--verify') {
    const verify = await pf('/store/products');
    if (verify.result) {
      console.log(`\n${verify.result.length} products in store:\n`);
      verify.result.forEach(p => console.log(`  [${p.id}] ${p.name} - ${p.variants} variant(s)`));
    }
    return;
  }

  console.log('\n========================================');
  console.log('  ARLAN LLC - Printful Product Pipeline  ');
  console.log('========================================\n');

  // Verify store
  console.log('[1/5] Verifying store connection...');
  const stores = await pf('/stores');
  const store = (stores.result || []).find(s => String(s.id) === STORE_ID);
  console.log(`  Store: ${store ? store.name : 'NOT FOUND'} (${STORE_ID})\n`);
  if (!store) { console.error('ERROR: Store not found.'); process.exit(1); }

  // Check existing products
  console.log('[2/5] Checking existing products...');
  const existing = await pf('/store/products');
  const existingNames = (existing.result || []).map(p => p.name);
  console.log(`  ${existingNames.length} products already in store\n`);

  // Look up cap variants dynamically
  console.log('[3/5] Looking up cap variant IDs...');
  for (const cap of CAP_PRODUCTS) {
    const variants = await lookupVariants(cap.catalogId, 'Black');
    if (variants.length > 0) {
      cap.variants = variants.map(v => v.id);
      PRODUCTS.push(cap);
      console.log(`  Added ${cap.name} with ${cap.variants.length} variant(s)\n`);
    } else {
      console.log(`  WARNING: No Black variants found for ${cap.name} (catalog ${cap.catalogId})\n`);
    }
  }

  // Create products
  console.log(`[4/5] Creating ${PRODUCTS.length} products...\n`);
  let created = 0, failed = 0, skipped = 0;

  for (const prod of PRODUCTS) {
    const result = await createProduct(prod, existingNames);
    if (result === 'created') created++;
    else if (result === 'failed') failed++;
    else if (result === 'skipped') skipped++;

    // Rate limiting — wait between products
    await new Promise(r => setTimeout(r, 2000));
  }

  // Verify
  console.log('\n[5/5] Verifying...');
  await new Promise(r => setTimeout(r, 3000));
  const verify = await pf('/store/products');
  if (verify.result) {
    console.log(`\n  ${verify.result.length} products in store:\n`);
    verify.result.forEach(p => console.log(`    [${p.id}] ${p.name} - ${p.variants} variant(s)`));
  }

  console.log(`\n========================================`);
  console.log(`  Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);
  console.log(`  Store: Think! Apparel (${STORE_ID})`);
  console.log(`========================================\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
