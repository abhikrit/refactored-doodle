// Synthetic Malawi Post catalogue (P-5). Taxonomy from Compliance section 2.3:
// "SME goods marketplace plus postal, financial and e-government services"
// (MPC FR-026, FR-100, FR-336, FR-089). Tables 8 and 13 (services) and Table 10 (return
// shipping) were NOT provided - decision T-MISS - so those rows are placeholders, not content.

const VENDORS = [
  { id: 201, name: 'Chikondi Crafts', sellerType: 'SME', district: 'Lilongwe', rating: 4.6, tier: 'Silver', active: true },
  { id: 202, name: 'Mzuzu Coffee Growers', sellerType: 'SME', district: 'Mzuzu', rating: 4.8, tier: 'Gold', active: true },
  { id: 203, name: 'Blantyre Home Store', sellerType: 'SME', district: 'Blantyre', rating: 4.2, tier: 'Bronze', active: true },
  { id: 204, name: 'Malawi Post', sellerType: 'Client', district: 'Lilongwe', rating: 4.4, tier: 'Client', active: true },
];

const CATEGORIES = [
  { id: 21, name: 'Food and drink', parentCategoryId: 0, displayOrder: 1 },
  { id: 22, name: 'Crafts and home', parentCategoryId: 0, displayOrder: 2 },
  { id: 23, name: 'Electronics', parentCategoryId: 0, displayOrder: 3 },
  { id: 24, name: 'Postal services', parentCategoryId: 0, displayOrder: 4, description: 'Services sold through the post office counter and online.' },
  { id: 25, name: 'Financial services', parentCategoryId: 0, displayOrder: 5, description: 'Partner financial products (FIN pack).' },
  { id: 26, name: 'Government services', parentCategoryId: 0, displayOrder: 6, description: 'e-Government service catalogue (EGV pack).' },
  { id: 211, name: 'Coffee and tea', parentCategoryId: 21, displayOrder: 1 },
  { id: 212, name: 'Store cupboard', parentCategoryId: 21, displayOrder: 2 },
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
  unit: extra.unit ?? 'item',
  packSize: extra.packSize ?? null,
  currency: 'MWK',
  stockQuantity: extra.stockQuantity ?? 60,
  orderMinimumQuantity: extra.orderMinimumQuantity ?? 1,
  orderMaximumQuantity: extra.orderMaximumQuantity ?? 50,
  callForPrice: extra.callForPrice ?? false,
  specifications: extra.specifications ?? {},
  tierPrices: extra.tierPrices ?? [],
  isShipEnabled: extra.isShipEnabled ?? true,
  weightKg: extra.weightKg ?? 1,
  pickupOnly: extra.pickupOnly ?? false,
  isService: extra.isService ?? false,
  placeholder: extra.placeholder ?? null,
  picture: extra.picture ?? { kind: 'box', tone: 'red' },
  ...extra.rest,
});

export const mpcCatalogue = {
  vendors: VENDORS,
  categories: CATEGORIES,
  products: [
    p(2001, 'Mzuzu highland coffee - 500 g beans', 'MZC-COF-500', 18500, [21, 211], 202, {
      shortDescription: 'Washed arabica from the northern highlands, roasted medium.',
      fullDescription: 'Grown between 1,200 and 1,800 m, hand picked and washed. Roasted to order and packed with a degassing valve.',
      unit: 'pack', packSize: '500 g', weightKg: 0.55,
      specifications: { Process: 'Washed', Roast: 'Medium', Altitude: '1,200-1,800 m' },
      tierPrices: [{ quantity: 6, price: 17200 }, { quantity: 24, price: 16400 }],
      picture: { kind: 'coffee', tone: 'brown' },
    }),
    p(2002, 'Mzuzu highland coffee - ground, 250 g', 'MZC-COF-G250', 10500, [21, 211], 202, {
      shortDescription: 'Ground for filter brewing, 250 g.',
      unit: 'pack', packSize: '250 g', weightKg: 0.28,
      specifications: { Grind: 'Filter', Roast: 'Medium' },
      picture: { kind: 'coffee', tone: 'brown' },
    }),
    p(2003, 'Hand-woven sisal basket - medium', 'CHK-BSK-M', 24000, [22], 201, {
      shortDescription: 'Woven by hand from dyed sisal, about 30 cm across.',
      unit: 'item', weightKg: 0.9,
      specifications: { Material: 'Sisal', Diameter: '30 cm', Origin: 'Lilongwe' },
      picture: { kind: 'craft', tone: 'gold' },
    }),
    p(2004, 'Carved wooden serving bowl', 'CHK-BWL-L', 31000, [22], 201, {
      shortDescription: 'Carved from a single piece of mbawa, food safe oil finish.',
      unit: 'item', weightKg: 1.4, oldPrice: 36000,
      specifications: { Material: 'Mbawa hardwood', Finish: 'Food-safe oil' },
      picture: { kind: 'craft', tone: 'brown' },
    }),
    p(2005, 'Solar lantern with phone charging', 'BHS-SOL-01', 42000, [23], 203, {
      shortDescription: 'Three brightness levels, USB output, 8 hours on a full charge.',
      unit: 'item', weightKg: 0.6,
      specifications: { Battery: '2,000 mAh', Output: 'USB-A 5 V', Warranty: '12 months' },
      picture: { kind: 'electronics', tone: 'slate' },
    }),
    p(2006, 'Rechargeable LED torch', 'BHS-TRC-02', 12500, [23], 203, {
      shortDescription: 'Aluminium body, 400 lumen, USB-C charging.',
      unit: 'item', weightKg: 0.25,
      specifications: { Output: '400 lumen', Charging: 'USB-C' },
      picture: { kind: 'electronics', tone: 'slate' },
    }),
    p(2007, 'Maize flour 10 kg', 'BHS-MZF-10', 16500, [21, 212], 203, {
      shortDescription: 'Sifted maize flour, 10 kg bag. Pickup only because of weight.',
      unit: 'bag', packSize: '10 kg', weightKg: 10.2, pickupOnly: true,
      specifications: { Weight: '10 kg', 'Shelf life': '6 months' },
      picture: { kind: 'box', tone: 'gold' },
    }),
    p(2008, 'Groundnuts 2 kg', 'BHS-GRN-2', 8900, [21, 212], 203, {
      shortDescription: 'Shelled groundnuts, 2 kg.',
      unit: 'bag', packSize: '2 kg', weightKg: 2.1,
      picture: { kind: 'box', tone: 'gold' },
    }),
    p(2009, 'Domestic parcel - up to 5 kg', 'MP-PAR-5', 7500, [24], 204, {
      shortDescription: 'Send a parcel up to 5 kg to any Malawi Post outlet.',
      unit: 'service', isService: true, isShipEnabled: false, weightKg: 0,
      specifications: { 'Maximum weight': '5 kg', 'Service level': 'Standard', Tracking: 'S10 (LOG-020)' },
      picture: { kind: 'service', tone: 'red' },
    }),
    p(2010, 'PO box annual rental', 'MP-POB-12', 45000, [24], 204, {
      shortDescription: 'Twelve months of a post office box at your chosen outlet.',
      unit: 'service', isService: true, isShipEnabled: false, weightKg: 0,
      specifications: { Term: '12 months', Renewal: 'Annual' },
      picture: { kind: 'service', tone: 'red' },
    }),
    p(2011, 'Partner credit product', 'MP-FIN-CRD', 0, [25], 204, {
      shortDescription: 'Placeholder. Malawi Post Table 8 (financial and partner services) was not provided.',
      callForPrice: true, unit: 'service', isService: true, isShipEnabled: false, weightKg: 0,
      placeholder: 'Client content not supplied - decision T-MISS (FIN-005). Prototype shows a placeholder, not invented content.',
      picture: { kind: 'service', tone: 'slate' },
    }),
    p(2012, 'Government service application', 'MP-EGV-APP', 0, [26], 204, {
      shortDescription: 'Placeholder. Malawi Post Table 13 (e-government services) was not provided; EGV scope is also held by FG-06.',
      callForPrice: true, unit: 'service', isService: true, isShipEnabled: false, weightKg: 0,
      placeholder: 'Client content not supplied - decision T-MISS; scope held by FG-06 (EGV-001 to EGV-007).',
      picture: { kind: 'service', tone: 'slate' },
    }),
  ],
  priceLists: [
    {
      id: 1,
      name: 'Trade account price list 2026',
      strategy: 'MinimalPrice',
      customerRoles: ['BusinessBuyer'],
      items: [
        { productId: 2001, manualPrice: 16900 },
        { productId: 2007, manualPrice: 15400 },
      ],
      note: 'Native 5.00 price list (decision PRICE-500); per-currency fixed prices (CAT-042) remain a build.',
    },
  ],
  placeholders: [
    'Malawi Post branding is not stated in source - theme colours are placeholders',
    'Tables 8, 10 and 13 and the Complaints and ADR policy were not provided (T-MISS): the financial, return-shipping and e-government rows are placeholders',
    'Seller model is an inference (gap MG-02); product data and prices are synthetic (P-5)',
    'Postal operations scope (LOG-011, LOG-022 to LOG-024, LOG-032, TRK-003) is held by FG-06',
  ],
};
