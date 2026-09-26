export type QualityGrade = 'genuine' | 'oem' | 'aftermarket' | 'economy';

export interface CarBrand {
  id: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  logo: string;
  heroImage: string;
  description: string;
  country: string;
  foundedYear: number;
  modelsCount?: number;
  officialRepresentative?: string;
  popularCategorySlugs?: string[];
  faq: { q: string; a: string }[];
}

export interface VehicleModel {
  id: string;
  brandId: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  imageUrl: string;
  yearFrom: number; // e.g. 1400 or 2021
  yearTo: number;   // e.g. 1403 or 2024 (or 0 for current)
  bodyType: 'سدان' | 'کراس‌اوور' | 'شاسی‌بلند' | 'پیکاپ' | 'هاچ‌بک';
  engineSummary: string;
  transmissionSummary: string;
  description: string;
  specifications: {
    engineCode: string;
    displacement: string;
    horsepower: string;
    torque: string;
    transmission: string;
    fuelConsumption: string;
  };
  commonIssues?: string[];
  maintenanceTips?: string[];
  faq: { q: string; a: string }[];
}

export interface VehicleTrim {
  id: string;
  modelId: string;
  nameFa: string;
  year: number;
  engine: string;
  engineCode: string;
  transmission: string;
  displacement: string;
}

export interface Category {
  id: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  icon: string;
  description: string;
  parentId?: string;
  subcategories?: {
    id: string;
    nameFa: string;
    nameEn: string;
    slug: string;
  }[];
}

export interface VehicleFitment {
  id: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  yearFrom: number;
  yearTo: number;
  engine: string;
  engineCode?: string;
  transmission?: string;
  notes?: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  oemNumber: string;
  partNumber: string;
  nameFa: string;
  nameEn: string;
  categorySlug: string;
  subcategorySlug?: string;
  brandManufacturer: string; // e.g. Chery Genuine, Valeo, Bosch, Gates, Febi, KMC Original
  grade: QualityGrade;
  price: number;
  discountPrice?: number;
  stock: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  images: string[];
  rating: number;
  reviewsCount: number;
  weightKg: number;
  dimensionsCm: string;
  countryOfOrigin: string;
  warrantyMonths: number;
  warrantyDescription: string;
  placement: string; // e.g. 'جلوبندی - سمت راست و چپ', 'سیستم خنک‌کننده موتور'
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isMaintenancePart?: boolean; // فیلترها و سرویس دوره‌ای
  
  shortDescription?: string; // توضیحات کوتاه و نکات کلیدی
  description: string;
  technicalSpecs: Record<string, string>;
  symptomsOfFailure: string[]; // علائم خرابی
  replacementInterval: string;  // زمان و دوره تعویض
  installationTips: string[];   // نکات مهم نصب
  genuineVsFakeNotes: string;   // تفاوت نمونه اصلی و فیک
  
  fitments: VehicleFitment[];
  complementPartIds?: string[]; // Cross-sell: مثلا واترپمپ -> ترموستات، ضدیخ
  relatedPartIds?: string[];
}

export interface GarageCar {
  id: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  year: number;
  engine: string;
  transmission?: string;
  customLabel: string; // 'خودروی من', 'خودروی همسر', 'خودروی دوم'
  imageUrl?: string;
  addedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVehicle?: GarageCar | null;
}

export interface OrderItem {
  productId: string;
  productName: string;
  oemNumber: string;
  price: number;
  quantity: number;
  image: string;
  grade: QualityGrade;
  vehicleInfo?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'paid'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'payment_failed'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  statusTitle: string;
  items: OrderItem[];
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    province: string;
    city: string;
    postalCode: string;
    address: string;
    notes?: string;
  };
  shippingMethod: {
    id: string;
    title: string;
    cost: number;
    estimatedDelivery: string;
  };
  paymentMethod: {
    id: string;
    title: string;
  };
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  trackingPostCode?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  readTimeMinutes: number;
  author: string;
  date: string;
  imageUrl: string;
  relatedModelIds: string[];
  relatedProductIds: string[];
  faq: { q: string; a: string }[];
}

export interface PartRequest {
  id: string;
  carBrand: string;
  carModel: string;
  year: string;
  partName: string;
  oemNumber?: string;
  vin?: string;
  phoneNumber: string;
  fullName: string;
  notes: string;
  imageAttached?: boolean;
  createdAt: string;
  status: 'در حال بررسی' | 'پاسخ داده شد' | 'ناموجود در گمرک';
}

export interface ActiveVehicleFilter {
  brandId: string;
  brandName?: string;
  modelId: string;
  modelName?: string;
  year?: number;
  engine?: string;
}

export type CustomerType = 'retail' | 'mechanic' | 'wholesale';

export interface CustomerUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  password?: string;
  email?: string;
  type: CustomerType;
  typeTitle: string;
  status: 'active' | 'blocked';
  registeredAt: string;
  totalOrders: number;
  totalSpent: number;
  vehicle?: string;
  address?: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  provider: 'saman' | 'mellat' | 'zarinpal' | 'parsian' | 'cod';
  isActive: boolean;
  merchantId: string;
  terminalId?: string;
  isSandbox: boolean;
  description: string;
}

export interface ApiIntegrationsConfig {
  smsProvider: 'kavenegar' | 'melipayamak' | 'ghasedak';
  smsApiKey: string;
  smsSenderNumber: string;
  smsNotifyOnOrder: boolean;
  smsNotifyOnStock: boolean;
  smsTrackingPattern: string;
  accountingSoftware: 'none' | 'sepidar' | 'heloo' | 'taraznegar';
  accountingApiKey: string;
  accountingAutoSyncStock: boolean;
  webhookUrl: string;
  webhookSecret: string;
}

export interface MenuItem {
  id: string;
  title: string;
  link: string;
  badge?: string;
}

export interface ProductAttributeDefinition {
  id: string;
  nameFa: string;
  category: string;
  defaultValue?: string;
}

export interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
  imageUrl: string;
  link: string;
  buttonText: string;
  isActive: boolean;
  order: number;
}

export type AdminRole = 'super_admin' | 'content_manager' | 'order_manager' | 'inventory_manager';

export interface AdminPermissions {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageArticles: boolean;
  canManageSliders: boolean;
  canManageSettings: boolean;
  canManageAdmins: boolean;
  canAccessSandbox: boolean;
  canManageVehicles: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: AdminRole;
  roleTitle: string;
  avatar?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  permissions: AdminPermissions;
}

export interface SiteSettings {
  siteTitle: string;
  siteSlogan: string;
  contactPhone: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  announcementText: string;
  primaryColor: string; // e.g. '#DC2626'
  fontFamily: 'Vazirmatn' | 'Noto Sans Arabic' | 'Rubik' | 'Alexandria' | 'Cairo';
  fontSize: 'compact' | 'normal' | 'large' | 'xlarge';
  freeShippingThreshold: number;
  expressShippingFee: number;
  postShippingFee: number;
  tipaxShippingFee: number;
  enableGuestCheckout: boolean;
  enableStockAlerts: boolean;
  navigationMenus?: MenuItem[];
  productAttributes?: ProductAttributeDefinition[];
  // Branding & Assets
  logoUrl?: string;
  faviconUrl?: string;
  sliders?: SliderItem[];
  // Official Invoice and Tax Information
  sellerName?: string;
  sellerEconomicCode?: string;
  sellerNationalId?: string;
  sellerRegistrationNo?: string;
  sellerPostalCode?: string;
  sellerPhone?: string;
  sellerAddress?: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  username: string;
  currentUser?: AdminUser;
  isMustChangePassword: boolean;
}

// Page Builder & Editable Sections
export interface PageSection {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  badge?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  isVisible: boolean;
  order: number;
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: PageSection[];
  isSystem?: boolean;
  updatedAt: string;
}
