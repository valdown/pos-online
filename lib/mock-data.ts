export type DashboardStat = {
  title: string;
  value: string;
  delta: string;
  description: string;
  icon: "wallet" | "badge-check" | "receipt" | "package";
};

export type RevenuePoint = {
  day: string;
  revenue: number;
};

export type PopularItem = {
  name: string;
  orders: number;
  share: number;
};

export type ProductCategory = string;

export type Product = {
  id: string;
  name: string;
  category: Exclude<ProductCategory, "Semua">;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  imagePath: string | null;
  deletedAt?: string | null;
};

export type CashierInvoiceItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CashierInvoice = {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CashierInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashierName: string;
  paymentMethod: "cash" | "debit" | "qris";
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  access: "Penuh" | "Operasional" | "Kasir";
  status: "Online" | "Istirahat" | "Off";
};

export type NotificationFeedItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  channel: "Telegram" | "Sistem";
  tone: "neutral" | "success" | "warning";
};

export type NotificationSettings = {
  telegramEnabled: boolean;
  botToken: string;
  chatId: string;
  digestFrequency: "Real-time" | "Per 2 Jam" | "Harian";
  lowStockAlert: boolean;
  cashierSummary: boolean;
  refundAlert: boolean;
};

export type PaymentMethodId = import("@/lib/payment-methods").PaymentMethodId;
export type PaymentMethodSetting = import("@/lib/payment-methods").PaymentMethodSetting;

export type AppSettings = {
  storeName: string;
  branchName: string;
  taxRate: number;
  serviceFee: number;
  storePhone: string;
  receiptFooter: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  openingCash: number;
  autoPrintReceipt: boolean;
  paymentMethods: PaymentMethodSetting[];
  menuCategories: string[];
};

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kasir", label: "POS Kasir" },
  { href: "/invoice-kasir", label: "Invoice Kasir" },
  { href: "/produk", label: "Produk" },
  { href: "/staf", label: "Staf" },
  { href: "/notifikasi", label: "Notifikasi" },
  { href: "/pengaturan", label: "Pengaturan" },
] as const;

export const dashboardStats: DashboardStat[] = [
  {
    title: "Total Pendapatan",
    value: "Rp 18.420.000",
    delta: "+12,4%",
    description: "naik dibanding minggu lalu",
    icon: "wallet",
  },
  {
    title: "Pesanan Selesai",
    value: "312",
    delta: "+28 order",
    description: "dengan SLA tersaji 6 menit",
    icon: "badge-check",
  },
  {
    title: "AOV",
    value: "Rp 58.900",
    delta: "+8,1%",
    description: "ditopang paket pastry pagi",
    icon: "receipt",
  },
  {
    title: "Total Item Terjual",
    value: "1.284",
    delta: "+94 item",
    description: "espresso blend dan toast dominan",
    icon: "package",
  },
];

export const revenueSeries: RevenuePoint[] = [
  { day: "Sen", revenue: 2200000 },
  { day: "Sel", revenue: 2850000 },
  { day: "Rab", revenue: 2560000 },
  { day: "Kam", revenue: 3150000 },
  { day: "Jum", revenue: 3380000 },
  { day: "Sab", revenue: 4020000 },
  { day: "Min", revenue: 3260000 },
];

export const popularItems: PopularItem[] = [
  { name: "Caramel Macchiato", orders: 124, share: 31 },
  { name: "Beef Burger & Chips", orders: 96, share: 24 },
  { name: "Bumi Latte", orders: 82, share: 20 },
  { name: "Kapal Pesiar", orders: 58, share: 14 },
  { name: "Croissant Almond", orders: 44, share: 11 },
];

export const productCategories: ProductCategory[] = [
  "Semua",
  "Espresso",
  "Manual Brew",
  "Non Coffee",
  "Makanan",
];

export const products: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Caramel Macchiato",
    category: "Espresso",
    description: "Espresso, susu steamed, dan caramel drizzle.",
    price: 34000,
    stock: 42,
    isActive: true,
    imagePath: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Flat White",
    category: "Espresso",
    description: "Body creamy dengan roast cokelat kacang.",
    price: 30000,
    stock: 35,
    isActive: true,
    imagePath: null,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "V60 Kintamani",
    category: "Manual Brew",
    description: "Profil citrus floral dengan body ringan.",
    price: 36000,
    stock: 16,
    isActive: true,
    imagePath: null,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Aren Latte",
    category: "Non Coffee",
    description: "Latte susu aren dengan tekstur lembut.",
    price: 32000,
    stock: 28,
    isActive: true,
    imagePath: null,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Matcha Cloud",
    category: "Non Coffee",
    description: "Matcha creamy dengan foam vanilla tipis.",
    price: 33000,
    stock: 10,
    isActive: true,
    imagePath: null,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Beef Burger & Chips",
    category: "Makanan",
    description: "Burger signature dengan kentang renyah.",
    price: 52000,
    stock: 18,
    isActive: true,
    imagePath: null,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    name: "Croissant Almond",
    category: "Makanan",
    description: "Butter croissant dengan taburan almond panggang.",
    price: 28000,
    stock: 9,
    isActive: true,
    imagePath: null,
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    name: "Spanish Latte",
    category: "Espresso",
    description: "Espresso blend, susu, dan condensed milk.",
    price: 34000,
    stock: 24,
    isActive: true,
    imagePath: null,
  },
];

export const staffMembers: StaffMember[] = [
  {
    id: "stf-001",
    name: "Aa Nden",
    role: "Owner",
    access: "Penuh",
    status: "Online",
  },
  {
    id: "stf-002",
    name: "Nabila Putri",
    role: "Supervisor",
    access: "Operasional",
    status: "Online",
  },
  {
    id: "stf-003",
    name: "Raka Aditama",
    role: "Kasir",
    access: "Kasir",
    status: "Istirahat",
  },
  {
    id: "stf-004",
    name: "Salsa Maharani",
    role: "Barista",
    access: "Operasional",
    status: "Online",
  },
  {
    id: "stf-005",
    name: "Bima Prakoso",
    role: "Kasir",
    access: "Kasir",
    status: "Off",
  },
];

export const notificationsFeed: NotificationFeedItem[] = [
  {
    id: "notif-001",
    title: "Stok Matcha Cloud menipis",
    message: "Sisa stok 10 porsi. Pertimbangkan reorder sebelum peak sore.",
    time: "5 menit lalu",
    channel: "Telegram",
    tone: "warning",
  },
  {
    id: "notif-002",
    title: "Kasir shift pagi ditutup",
    message: "Ringkasan transaksi Rp 6.480.000 berhasil dikirim ke grup owner.",
    time: "35 menit lalu",
    channel: "Telegram",
    tone: "success",
  },
  {
    id: "notif-003",
    title: "Printer struk status normal",
    message: "Perangkat front counter kembali terhubung setelah restart otomatis.",
    time: "1 jam lalu",
    channel: "Sistem",
    tone: "neutral",
  },
];

export const defaultNotificationSettings: NotificationSettings = {
  telegramEnabled: true,
  botToken: "placeholder-telegram-bot-token",
  chatId: "placeholder-chat-room-id",
  digestFrequency: "Real-time",
  lowStockAlert: true,
  cashierSummary: true,
  refundAlert: false,
};

export const defaultAppSettings: AppSettings = {
  storeName: "Coffee Bean Signature",
  branchName: "Cabang Setiabudi",
  taxRate: 11,
  serviceFee: 5,
  storePhone: "021-5550-7788",
  receiptFooter: "Terima kasih sudah menikmati racikan kami. Sampai jumpa lagi!",
  bankName: "Bank Central Asia",
  bankAccountName: "PT Coffee Bean Nusantara",
  bankAccountNumber: "112233445566",
  openingCash: 750000,
  autoPrintReceipt: true,
  paymentMethods: [
    { id: "cash", label: "Tunai", enabled: true },
    { id: "debit", label: "Debit", enabled: true },
    { id: "qris", label: "QRIS", enabled: true },
  ],
  menuCategories: ["Espresso", "Manual Brew", "Non Coffee", "Makanan"],
};

export const cashierSnapshot = {
  activeCashiers: 3,
  activeTime: "23.42",
  highlightedTable: "Counter A",
};
