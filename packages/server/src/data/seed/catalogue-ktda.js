// Synthetic KTDA catalogue (P-5). Product taxonomy from Compliance section 2.3:
// "Value-added teas, bulk teas, contract packaging, forward contracts; retail and bulk"
// (KTDA CUS-002, CAT-002, PRJ-002). No KTDA product data was supplied, so every row below
// is invented for the prototype and marked synthetic.

const VENDORS = [
  { id: 101, name: 'KTDA Kangaita Factory', sellerType: 'Factory', county: 'Kirinyaga', rating: 4.7, active: true },
  { id: 102, name: 'KTDA Michimikuru Factory', sellerType: 'Factory', county: 'Meru', rating: 4.5, active: true },
];

const CATEGORIES = [
  { id: 11, name: 'Value-added teas', parentCategoryId: 0, displayOrder: 1, description: 'Packed, blended and flavoured teas ready for retail.' },
  { id: 12, name: 'Bulk teas', parentCategoryId: 0, displayOrder: 2, description: 'Made tea in bulk grades for trade buyers.' },
  { id: 13, name: 'Contract packaging', parentCategoryId: 0, displayOrder: 3, description: 'Pack your own brand at a KTDA facility.' },
  { id: 14, name: 'Forward contracts', parentCategoryId: 0, displayOrder: 4, description: 'Agreed volumes delivered on a schedule.' },
  { id: 111, name: 'Black tea', parentCategoryId: 11, displayOrder: 1 },
  { id: 112, name: 'Green tea', parentCategoryId: 11, displayOrder: 2 },
  { id: 113, name: 'Purple and speciality tea', parentCategoryId: 11, displayOrder: 3 },
];

const p = (id, name, sku, price, categoryIds, vendorId, extra = {}) => ({
  id,
  name,
  sku,
  price,
  oldPrice: extra.oldPrice ?? 0,
  categoryIds,
  vendorId,
  shortDescription: extra.shortDescription ?? '',
  fullDescription: extra.fullDescription ?? '',
  unit: extra.unit ?? 'kg',
  packSize: extra.packSize ?? null,
  currency: 'USD',
  stockQuantity: extra.stockQuantity ?? 240,
  orderMinimumQuantity: extra.orderMinimumQuantity ?? 1,
  orderMaximumQuantity: extra.orderMaximumQuantity ?? 1000,
  callForPrice: extra.callForPrice ?? false,
  specifications: extra.specifications ?? {},
  tierPrices: extra.tierPrices ?? [],
  isShipEnabled: extra.isShipEnabled ?? true,
  weightKg: extra.weightKg ?? 1,
  origin: extra.origin ?? 'Kenya',
  picture: extra.picture ?? { kind: 'tea', tone: 'green' },
  ...extra.rest,
});

export const ktdaCatalogue = {
  vendors: VENDORS,
  categories: CATEGORIES,
  products: [
    p(1001, 'Kangaita Black Tea BP1 - 500 g retail pack', 'KTDA-VB-BP1-500', 7.4, [11, 111], 101, {
      shortDescription: 'Broken Pekoe 1 from the Kangaita factory, packed for retail in 500 g bags.',
      fullDescription: 'A bright, brisk black tea grown at 2,100 m. Packed in a foil-lined 500 g bag with a one-way valve.',
      unit: 'pack', packSize: '500 g', weightKg: 0.55,
      specifications: { Grade: 'BP1', Altitude: '2,100 m', 'Harvest month': 'March', 'Shelf life': '24 months' },
      tierPrices: [{ quantity: 24, price: 6.9 }, { quantity: 120, price: 6.4 }],
    }),
    p(1002, 'Kangaita Black Tea PD - 1 kg catering pack', 'KTDA-VB-PD-1000', 11.8, [11, 111], 101, {
      shortDescription: 'Pekoe Dust for catering and vending, 1 kg.',
      unit: 'pack', packSize: '1 kg', weightKg: 1.05,
      specifications: { Grade: 'PD', 'Cup character': 'Strong, coloury', 'Shelf life': '24 months' },
      tierPrices: [{ quantity: 12, price: 11.1 }, { quantity: 60, price: 10.4 }],
    }),
    p(1003, 'Michimikuru Green Tea Sencha style - 250 g', 'KTDA-VG-SEN-250', 9.2, [11, 112], 102, {
      shortDescription: 'Steamed green tea, light and grassy, 250 g.',
      unit: 'pack', packSize: '250 g', weightKg: 0.28,
      specifications: { Grade: 'Sencha style', Processing: 'Steamed', 'Shelf life': '18 months' },
      picture: { kind: 'tea', tone: 'lightgreen' },
    }),
    p(1004, 'Purple Tea whole leaf - 100 g gift tin', 'KTDA-VP-WL-100', 14.5, [11, 113], 102, {
      shortDescription: 'Kenyan purple tea in a gift tin, 100 g.',
      unit: 'tin', packSize: '100 g', weightKg: 0.2, oldPrice: 16.9,
      specifications: { Cultivar: 'TRFK 306/1', Antioxidant: 'Anthocyanin rich', 'Shelf life': '18 months' },
      picture: { kind: 'tea', tone: 'purple' },
    }),
    p(1005, 'Masala Chai blend - 500 g', 'KTDA-VB-CHAI-500', 8.6, [11, 111], 101, {
      shortDescription: 'Black tea blended with cardamom, ginger, cinnamon and clove.',
      unit: 'pack', packSize: '500 g', weightKg: 0.55,
      specifications: { Grade: 'Blend', Spices: 'Cardamom, ginger, cinnamon, clove' },
    }),
    p(1006, 'Made tea BP1 - 20 kg paper sack', 'KTDA-BT-BP1-20', 96, [12], 101, {
      shortDescription: 'Bulk BP1 in a 20 kg multiwall paper sack, ex-factory.',
      unit: 'sack', packSize: '20 kg', weightKg: 20.4, orderMinimumQuantity: 5,
      specifications: { Grade: 'BP1', Packing: '20 kg multiwall sack', Incoterm: 'EXW Kangaita' },
      tierPrices: [{ quantity: 25, price: 92 }, { quantity: 100, price: 88 }],
      picture: { kind: 'sack', tone: 'brown' },
    }),
    p(1007, 'Made tea PF1 - 50 kg tea chest', 'KTDA-BT-PF1-50', 228, [12], 102, {
      shortDescription: 'Pekoe Fannings 1 in a 50 kg tea chest for export.',
      unit: 'chest', packSize: '50 kg', weightKg: 51, orderMinimumQuantity: 2,
      specifications: { Grade: 'PF1', Packing: '50 kg tea chest', Incoterm: 'FOB Mombasa' },
      tierPrices: [{ quantity: 10, price: 219 }, { quantity: 40, price: 210 }],
      picture: { kind: 'sack', tone: 'brown' },
    }),
    p(1008, 'Made tea Dust 1 - bulk, price on request', 'KTDA-BT-D1-BULK', 0, [12], 102, {
      shortDescription: 'Dust 1 in container loads. Request a quotation for current volumes.',
      callForPrice: true, unit: 'tonne', weightKg: 1000, orderMinimumQuantity: 1,
      specifications: { Grade: 'D1', Packing: 'Container load', Incoterm: 'FOB Mombasa' },
      picture: { kind: 'sack', tone: 'grey' },
    }),
    p(1009, 'Contract packaging - own brand retail bags', 'KTDA-CP-RETAIL', 0, [13], 101, {
      shortDescription: 'Your brand packed at a KTDA facility. Minimum run and artwork approval apply.',
      callForPrice: true, unit: 'run', isShipEnabled: false, weightKg: 0,
      specifications: { 'Minimum run': 'Not stated in source', 'Artwork approval': 'Required', Lead: 'Not stated in source' },
      picture: { kind: 'service', tone: 'green' },
    }),
    p(1010, 'Forward contract - BP1 quarterly schedule', 'KTDA-FC-BP1-Q', 0, [14], 101, {
      shortDescription: 'Agreed quarterly volumes of BP1 delivered on a schedule, under a signed contract.',
      callForPrice: true, unit: 'contract', isShipEnabled: false, weightKg: 0,
      specifications: { Term: 'Quarterly', 'Price basis': 'Not stated in source', Signature: 'Electronic (ORD-017)' },
      picture: { kind: 'service', tone: 'gold' },
    }),
    p(1011, 'Kangaita Black Tea BP1 - 100 g sample', 'KTDA-VB-BP1-100', 2.4, [11, 111], 101, {
      shortDescription: 'Sample pack for new buyers (ORD-027 sample orders).',
      unit: 'pack', packSize: '100 g', weightKg: 0.12, orderMaximumQuantity: 5,
      specifications: { Grade: 'BP1', Purpose: 'Sample' },
    }),
    p(1012, 'Michimikuru Green Tea - 1 kg catering', 'KTDA-VG-CAT-1000', 17.4, [11, 112], 102, {
      shortDescription: 'Catering green tea, 1 kg.',
      unit: 'pack', packSize: '1 kg', weightKg: 1.05,
      specifications: { Grade: 'Catering', Processing: 'Steamed' },
      picture: { kind: 'tea', tone: 'lightgreen' },
    }),
  ],
  priceLists: [
    {
      id: 1,
      name: 'Bulk buyer price list 2026',
      strategy: 'MinimalPrice',
      customerRoles: ['BulkBuyer'],
      items: [
        { productId: 1006, manualPrice: 89 },
        { productId: 1007, manualPrice: 214 },
      ],
      note: 'Native 5.00 price list (decision PRICE-500). A tier price found afterwards replaces the price-list price - the CAT chapter owns the rule where both apply.',
    },
  ],
  placeholders: [
    'KTDA brand guidelines were not provided (REQ-KTDA-UX-002) - theme colours are placeholders',
    'Product data, prices and factory list are synthetic (P-5); the seller model is open (gap KG-01)',
    'Contract packaging minimum run and forward-contract price basis are not stated in source',
  ],
};
