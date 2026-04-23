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

export type ProductCategory = "Semua" | "Espresso" | "Manual Brew" | "Non Coffee" | "Makanan";

export type Product = {
  id: string;
  name: string;
  category: Exclude<ProductCategory, "Semua">;
  description: string;
  price: number;
  stock: number;
  sku: string;
  soldToday: number;
  status: "Aktif" | "Hampir Habis";
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
  role: "Owner" | "Supervisor" | "Kasir" | "Barista";
  access: "Penuh" | "Operasional" | "Kasir";
  shift: string;
  phone: string;
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
    id: "caramel-macchiato",
    name: "Caramel Macchiato",
    category: "Espresso",
    description: "Espresso, susu steamed, dan caramel drizzle.",
    price: 34000,
    stock: 42,
    sku: "CB-ESP-014",
    soldToday: 38,
    status: "Aktif",
  },
  {
    id: "flat-white",
    name: "Flat White",
    category: "Espresso",
    description: "Body creamy dengan roast cokelat kacang.",
    price: 30000,
    stock: 35,
    sku: "CB-ESP-003",
    soldToday: 31,
    status: "Aktif",
  },
  {
    id: "v60-kintamani",
    name: "V60 Kintamani",
    category: "Manual Brew",
    description: "Profil citrus floral dengan body ringan.",
    price: 36000,
    stock: 16,
    sku: "CB-MBR-011",
    soldToday: 14,
    status: "Aktif",
  },
  {
    id: "aren-latte",
    name: "Aren Latte",
    category: "Non Coffee",
    description: "Latte susu aren dengan tekstur lembut.",
    price: 32000,
    stock: 28,
    sku: "CB-NCF-008",
    soldToday: 23,
    status: "Aktif",
  },
  {
    id: "matcha-cloud",
    name: "Matcha Cloud",
    category: "Non Coffee",
    description: "Matcha creamy dengan foam vanilla tipis.",
    price: 33000,
    stock: 10,
    sku: "CB-NCF-004",
    soldToday: 19,
    status: "Hampir Habis",
  },
  {
    id: "beef-burger-chips",
    name: "Beef Burger & Chips",
    category: "Makanan",
    description: "Burger signature dengan kentang renyah.",
    price: 52000,
    stock: 18,
    sku: "CB-FOD-021",
    soldToday: 27,
    status: "Aktif",
  },
  {
    id: "croissant-almond",
    name: "Croissant Almond",
    category: "Makanan",
    description: "Butter croissant dengan taburan almond panggang.",
    price: 28000,
    stock: 9,
    sku: "CB-FOD-017",
    soldToday: 21,
    status: "Hampir Habis",
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    category: "Espresso",
    description: "Espresso blend, susu, dan condensed milk.",
    price: 34000,
    stock: 24,
    sku: "CB-ESP-019",
    soldToday: 25,
    status: "Aktif",
  },
];

export const staffMembers: StaffMember[] = [
  {
    id: "stf-001",
    name: "Aa Nden",
    role: "Owner",
    access: "Penuh",
    shift: "09.00 - 18.00",
    phone: "0812-1122-3344",
    status: "Online",
  },
  {
    id: "stf-002",
    name: "Nabila Putri",
    role: "Supervisor",
    access: "Operasional",
    shift: "08.00 - 17.00",
    phone: "0813-8877-1100",
    status: "Online",
  },
  {
    id: "stf-003",
    name: "Raka Aditama",
    role: "Kasir",
    access: "Kasir",
    shift: "07.00 - 15.00",
    phone: "0819-4433-2211",
    status: "Istirahat",
  },
  {
    id: "stf-004",
    name: "Salsa Maharani",
    role: "Barista",
    access: "Operasional",
    shift: "10.00 - 19.00",
    phone: "0821-6655-7788",
    status: "Online",
  },
  {
    id: "stf-005",
    name: "Bima Prakoso",
    role: "Kasir",
    access: "Kasir",
    shift: "13.00 - 21.00",
    phone: "0822-9090-1212",
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
};

export const cashierSnapshot = {
  activeCashiers: 3,
  activeTime: "23.42",
  highlightedTable: "Counter A",
};
