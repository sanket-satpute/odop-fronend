#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://odop-backend.onrender.com";
const PASSWORD = "123456789";
const RECORDS_PER_MODEL = 10;
const RUN_TAG = (process.env.SEED_TAG || Date.now().toString(36)).toLowerCase();
const RUN_OFFSET = Date.now() % 1000;

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const baseUrl = (process.env.ODOP_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

const imageUrl = (kind, index, width = 800, height = 600) =>
  `https://picsum.photos/seed/odop-${kind}-${index}/${width}/${height}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const headers = options.headers || {};
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText} -> ${url}\n${text}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
};

const safeJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extractId = (obj, keys) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return String(obj[key]);
    }
  }
  return undefined;
};

const createMany = async (label, factory, createFn) => {
  const created = [];
  const failures = [];

  for (let i = 1; i <= RECORDS_PER_MODEL; i += 1) {
    const payload = factory(i);
    if (isDryRun) {
      created.push({ __dryRun: true, ...payload });
      continue;
    }
    try {
      const result = await createFn(payload, i);
      created.push(result);
      await sleep(80);
    } catch (error) {
      failures.push({ index: i, error: error.message, payload });
    }
  }

  console.log(`${label}: created=${created.length}, failed=${failures.length}`);
  if (failures.length > 0) {
    failures.slice(0, 3).forEach((f) => {
      console.log(`  - ${label}#${f.index}: ${f.error.split("\n")[0]}`);
    });
  }
  return { created, failures };
};

const createAdmin = (admin) =>
  request("/odop/admin/create_account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(admin),
  });

const createCustomer = (customer) =>
  request("/odop/customer/create_account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });

const createVendor = (vendor) =>
  request("/odop/vendor/create_account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vendor),
  });

const createCategory = (category, options = {}) =>
  request("/odop/category/save_category", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(category),
  });

const createCart = (cart, options = {}) =>
  request("/odop/cart/save_cart", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(cart),
  });

const createOrder = (order, options = {}) =>
  request("/odop/order/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(order),
  });

const createContact = (contact, options = {}) =>
  request("/odop/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(contact),
  });

const authenticate = async (email, password, role) => {
  const data = await request("/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password, role }),
  });
  if (!data?.jwt) throw new Error(`Authentication failed for role=${role}, email=${email}`);
  return data.jwt;
};

const authenticateAny = async (role, emailCandidates, password) => {
  for (const email of emailCandidates) {
    try {
      return await authenticate(email, password, role);
    } catch {
      // Try next candidate
    }
  }
  throw new Error(`Authentication failed for role=${role}. Tried: ${emailCandidates.join(", ")}`);
};

const createProduct = async (product, index, options = {}) => {
  const formData = new FormData();
  formData.append(
    "product",
    new Blob([JSON.stringify(product)], { type: "application/json" }),
    `product-${index}.json`
  );

  const imgRes = await fetch(imageUrl("product-file", index, 1200, 900));
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch dummy image for product ${index}`);
  }
  const imageBlob = await imgRes.blob();
  formData.append("file", imageBlob, `product-${index}.jpg`);

  return request("/odop/product/save_product", {
    method: "POST",
    headers: { ...(options.headers || {}) },
    body: formData,
  });
};

const pick = (arr, i) => arr[(i - 1) % arr.length];

const main = async () => {
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Dry run: ${isDryRun}`);
  console.log(`Password for all created users: ${PASSWORD}`);
  console.log(`Run tag: ${RUN_TAG}`);

  const adminsResult = await createMany(
    "Admin",
    (i) => ({
      fullName: `Admin User ${i}`,
      emailAddress: `admin${i}-${RUN_TAG}@odop.demo`,
      password: PASSWORD,
      contactNumber: Number(`9001001${String(i).padStart(2, "0")}`),
      positionAndRole: i % 2 === 0 ? "SUPER_ADMIN" : "CONTENT_ADMIN",
      authorizationKey: `AUTHKEY-ODOP-${String(i).padStart(3, "0")}`,
    }),
    createAdmin
  );

  const customersResult = await createMany(
    "Customer",
    (i) => ({
      fullName: `Customer ${i}`,
      emailAddress: `customer${i}-${RUN_TAG}@odop.demo`,
      password: PASSWORD,
      contactNumber: Number(`930${String(RUN_OFFSET).padStart(3, "0")}${String(i).padStart(4, "0")}`),
      address: `${i} MG Road`,
      city: "Lucknow",
      state: "Uttar Pradesh",
      pinCode: "226001",
    }),
    createCustomer
  );

  const vendorsResult = await createMany(
    "Vendor",
    (i) => ({
      shopkeeperName: `Vendor Owner ${i}`,
      shoppeeName: `ODOP Shop ${i}`,
      emailAddress: `vendor${i}-${RUN_TAG}@odop.demo`,
      password: PASSWORD,
      contactNumber: Number(`9203003${String(i).padStart(2, "0")}`),
      shoppeeAddress: `${i} Heritage Market`,
      locationDistrict: i % 2 === 0 ? "Varanasi" : "Lucknow",
      locationState: "Uttar Pradesh",
      pinCode: "221001",
      businessRegistryNumber: `BRN-ODOP-${String(i).padStart(4, "0")}`,
      returnPolicy: "7-day return on damaged items",
      termsAndServiceAgreement: "Accepted",
      profilePictureUrl: imageUrl("vendor-profile", i, 500, 500),
      websiteUrl: `https://example.com/vendors/${i}`,
      deliveryAvailable: true,
      deliveryCharges: 40 + i,
      freeDeliveryAbove: 999,
      vendorType: i % 3 === 0 ? "large" : i % 2 === 0 ? "medium" : "small",
      shopDescription: `Authentic ODOP seller ${i}`,
      productCategories: "Handicraft,Textile,Food",
    }),
    createVendor
  );

  let adminToken = "";
  let customerToken = "";
  let vendorToken = "";
  if (!isDryRun) {
    adminToken = await authenticateAny(
      "admin",
      [`admin1-${RUN_TAG}@odop.demo`, "admin1@odop.demo", "admin@odop.com"],
      PASSWORD
    );
    customerToken = await authenticateAny(
      "customer",
      [`customer1-${RUN_TAG}@odop.demo`, "customer1@odop.demo", "customer1@odop.com"],
      PASSWORD
    );
    vendorToken = await authenticateAny(
      "vendor",
      [`vendor1-${RUN_TAG}@odop.demo`, "vendor1@odop.demo", "vendor1@odop.com"],
      PASSWORD
    );
  }

  const categoriesResult = await createMany(
    "ProductCategory",
    (i) => ({
      categoryName: `Category ${i}`,
      categoryDescription: `ODOP category description ${i}`,
      categoryImageURL: imageUrl("category", i, 900, 600),
    }),
    (payload) =>
      createCategory(payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
  );

  const categoryIds = categoriesResult.created
    .map((c) => extractId(c, ["prodCategoryID", "categoryId", "id"]))
    .filter(Boolean);
  const vendorIds = vendorsResult.created
    .map((v) => extractId(v, ["vendorId", "id"]))
    .filter(Boolean);
  const customerIds = customersResult.created
    .map((c) => extractId(c, ["customerId", "id"]))
    .filter(Boolean);

  const productsResult = await createMany(
    "Product",
    (i) => ({
      productName: `ODOP Product ${i}`,
      productDescription: `Demo product ${i} for seed data`,
      categoryId: pick(categoryIds, i) || undefined,
      subCategory: i % 2 === 0 ? "Premium" : "Classic",
      price: 199 + i * 10,
      productQuantity: 20 + i,
      productImageURL: imageUrl("product-link", i, 1200, 900),
      discount: i % 4 === 0 ? 10 : 5,
      promotionEnabled: true,
      specification: "Handmade, eco-friendly",
      warranty: "No warranty",
      rating: 4.2,
      vendorId: pick(vendorIds, i) || undefined,
      originDistrict: i % 2 === 0 ? "Varanasi" : "Lucknow",
      originState: "Uttar Pradesh",
      originPinCode: "221001",
      localName: `स्थानीय उत्पाद ${i}`,
      giTagNumber: `GI-ODOP-${String(i).padStart(4, "0")}`,
      giTagCertified: i % 2 === 0,
      giTagCertificateUrl: imageUrl("gi-certificate", i, 1000, 700),
      originStory: `Traditional craft story ${i}`,
      craftType: i % 3 === 0 ? "handicraft" : "handloom",
      madeBy: `Artisan ${i}`,
      materialsUsed: "Cotton, natural dyes",
      tags: ["odop", "handmade", `product-${i}`],
      popularityScore: 50 + i,
      totalSold: 100 + i * 5,
      stockStatus: "IN_STOCK",
      approvalStatus: "APPROVED",
      isActive: true,
    }),
    (payload, index) =>
      createProduct(payload, index, {
        headers: { Authorization: `Bearer ${vendorToken}` },
      })
  );

  const productIds = productsResult.created
    .map((p) => extractId(p, ["productId", "id"]))
    .filter(Boolean);

  await createMany(
    "Cart",
    (i) => ({
      customerId: pick(customerIds, i) || undefined,
      vendorId: pick(vendorIds, i) || undefined,
      productId: pick(productIds, i) || undefined,
      approval: true,
      time: new Date().toISOString(),
      quantity: (i % 3) + 1,
    }),
    (payload) =>
      createCart(payload, {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
  );

  await createMany(
    "Order",
    (i) => {
      const productId = pick(productIds, i) || "";
      const vendorId = pick(vendorIds, i) || "";
      const amount = 499 + i * 25;
      return {
        orderStatus: i % 2 === 0 ? "processing" : "pending",
        orderItems: [
          {
            productId,
            productName: `ODOP Product ${i}`,
            productImageURL: imageUrl("order-item", i, 640, 480),
            quantity: 1,
            unitPrice: amount,
            discount: 0,
            totalPrice: amount,
          },
        ],
        totalAmount: amount,
        finalAmount: amount + 40,
        deliveryCharges: 40,
        couponApplied: false,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        shippingAddress: `${i} Civil Lines, Lucknow`,
        shippingDistrict: "Lucknow",
        shippingState: "Uttar Pradesh",
        shippingPinCode: "226001",
        shippingContactNumber: Number(`9304004${String(i).padStart(2, "0")}`),
        customerNotes: "Please deliver during daytime.",
        customerId: pick(customerIds, i) || undefined,
        vendorId,
      };
    },
    (payload) =>
      createOrder(payload, {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
  );

  await createMany(
    "ContactMessage",
    (i) => ({
      fullName: `Inquiry User ${i}`,
      emailAddress: `inquiry${i}-${RUN_TAG}@odop.demo`,
      subject: `Support request ${i}`,
      message: `Hello, this is test contact message ${i}.`,
      status: "NEW",
    }),
    (payload) =>
      createContact(payload, {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
  );

  console.log("");
  console.log("Done.");
  console.log("Non-persistent/utility models skipped for DB insert:");
  console.log("- AuthResponse");
  console.log("- DataState, LoadingState, PaginatedResponse, ApiResponse, FilterOptions");
  console.log("- BaseComponent");
  console.log("- ProdOrder (embedded in Order)");
  console.log("- CartObj (view/helper object)");
};

main().catch((error) => {
  console.error("Seeding failed.");
  console.error(error.message || error);
  process.exit(1);
});

