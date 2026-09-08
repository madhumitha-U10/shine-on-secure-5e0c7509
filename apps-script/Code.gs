/**
 * NammaSpot — Google Apps Script backend (free tier).
 *
 * Paste this whole file into the Apps Script project, then
 * Deploy > Manage deployments > Edit > New version > Deploy.
 *
 * API shape used by the website:
 *
 *   GET  ?action=sellers | products | categories | customers | enquiries | reviews
 *        -> { success: true, data: [ ...rows ] }
 *
 *   POST { action: "addSeller" | "addProduct" | "addCustomer" | "addEnquiry" | "addReview",
 *          data: { ...columnName: value } }
 *        -> { success: true }
 *
 *   POST { action: "update", table: "sellers" | "products" | "reviews" | ...,
 *          data: { <idColumn>: "<id>", ...fieldsToChange } }
 *        -> { success: true, updated: 1 }
 *
 * Optional write protection: add a Script Property named WRITE_TOKEN
 * (Project Settings > Script Properties). When set, every POST must include
 * the same value as "token". Leave it unset to keep writes open.
 *
 * Sheet tabs (row 1 = headers): Sellers, Products, Categories, Customers,
 * Enquiries, Reviews.
 */

const SHEET_ID = "1BkvFG1ROC3RSayx1BJkPqqsXleX4GwJIG8Wk5QWPbkQ";

const TABLES = {
  sellers: "Sellers",
  products: "Products",
  categories: "Categories",
  customers: "Customers",
  enquiries: "Enquiries",
  reviews: "Reviews",
};

const WRITE_ACTIONS = {
  addSeller: "Sellers",
  addProduct: "Products",
  addCustomer: "Customers",
  addEnquiry: "Enquiries",
  addReview: "Reviews",
};

/** Candidate id columns per table, in priority order. */
const ID_COLUMNS = {
  sellers: ["sellerId", "id"],
  products: ["productId", "id"],
  categories: ["categoryId", "id"],
  customers: ["customerId", "id"],
  enquiries: ["enquiryId", "id"],
  reviews: ["reviewId", "id"],
};

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function sheet_(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function rows_(name) {
  const sh = sheet_(name);
  if (!sh) throw new Error("Missing sheet tab: " + name);
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  return values
    .filter(function (r) {
      return String(r[0]).length > 0;
    })
    .map(function (r) {
      const obj = {};
      headers.forEach(function (h, i) {
        if (String(h).length) obj[String(h)] = r[i];
      });
      return obj;
    });
}

function tokenOk_(body) {
  const expected = PropertiesService.getScriptProperties().getProperty("WRITE_TOKEN");
  if (!expected) return true; // no token configured -> writes stay open
  return String(body.token || "") === expected;
}

function doGet(e) {
  const action = ((e && e.parameter && e.parameter.action) || "sellers").toString();
  const tab = TABLES[action];
  if (!tab) return json_({ success: false, error: "Invalid action" });
  try {
    return json_({ success: true, data: rows_(tab) });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

function appendRow_(tab, data) {
  const sh = sheet_(tab);
  if (!sh) return json_({ success: false, error: "Missing sheet tab: " + tab });

  const headers = sh.getDataRange().getValues()[0];
  const row = headers.map(function (h) {
    const key = String(h);
    return data[key] !== undefined ? data[key] : "";
  });
  sh.appendRow(row);
  return json_({ success: true });
}

/**
 * Update one existing row in place, matched by its id column.
 * Only the columns present in `data` are touched; everything else is left alone.
 */
function updateRow_(tableKey, data) {
  const tab = TABLES[tableKey];
  if (!tab) return json_({ success: false, error: "Invalid table" });

  const sh = sheet_(tab);
  if (!sh) return json_({ success: false, error: "Missing sheet tab: " + tab });

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return json_({ success: false, error: "No rows to update" });

  const headers = values[0].map(function (h) {
    return String(h);
  });

  // Pick the id column that both the sheet and the request agree on.
  const candidates = ID_COLUMNS[tableKey] || ["id"];
  let idCol = "";
  for (let i = 0; i < candidates.length; i++) {
    if (data[candidates[i]] !== undefined && headers.indexOf(candidates[i]) !== -1) {
      idCol = candidates[i];
      break;
    }
  }
  if (!idCol) return json_({ success: false, error: "Missing id column for " + tableKey });

  const idIndex = headers.indexOf(idCol);
  const wantedId = String(data[idCol]);

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idIndex]) !== wantedId) continue;

    const rowNumber = r + 1;
    headers.forEach(function (h, c) {
      if (!h || h === idCol) return;
      if (data[h] === undefined) return;
      sh.getRange(rowNumber, c + 1).setValue(data[h]);
    });
    if (headers.indexOf("updatedAt") !== -1 && data["updatedAt"] === undefined) {
      sh.getRange(rowNumber, headers.indexOf("updatedAt") + 1).setValue(new Date());
    }
    return json_({ success: true, updated: 1 });
  }

  return json_({ success: false, error: "Row not found: " + wantedId });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lockErr) {
    return json_({ success: false, error: "Backend busy, please retry" });
  }

  try {
    const body = JSON.parse(e.postData.contents);

    if (!tokenOk_(body)) return json_({ success: false, error: "Unauthorized" });

    if (body.action === "update") {
      return updateRow_(String(body.table || ""), body.data || {});
    }

    const tab = WRITE_ACTIONS[body.action];
    if (!tab) return json_({ success: false, error: "Invalid action" });

    return appendRow_(tab, body.data || {});
  } catch (err) {
    return json_({ success: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
