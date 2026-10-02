export type QualityGrade = 'genuine' | 'oem' | 'aftermarket' | 'economy';

export interface CarBrand {
  id: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  logo: string;
  heroImage: string;
  description: string;
  bottomDescription?: string;
  country: string;
  foundedYear: number;
  modelsCount?: number;
  officialRepresentative?: string;
  popularCategorySlugs?: string[];
  faq: { q: string; a: string }[];
  seo?: SeoEntityDraft;
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

export interface CategoryChild {
  id: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  icon?: string;
  iconUrl?: string;
  imageUrl?: string;
  description?: string;
  bottomDescription?: string;
  seo?: SeoEntityDraft;
  subcategories?: CategoryChild[];
}

export interface Category {
  id: string;
  nameFa: string;
  nameEn: string;
  slug: string;
  icon: string;
  iconUrl?: string;
  imageUrl?: string;
  description: string;
  bottomDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  parentId?: string;
  subcategories?: CategoryChild[];
  seo?: SeoEntityDraft;
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

export interface ImageSeoMeta {
  alt: string;
  title?: string;
  caption?: string;
  description?: string;
}

export interface SeoEntityDraft {
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  schemaType?: string;
  cornerstone?: boolean;
  breadcrumbTitle?: string;
  hreflang?: Array<{ lang: string; url: string }>;
  images?: Record<string, ImageSeoMeta>;
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
  /** Brand of the vehicle(s) this part is intended for. */
  vehicleBrandIds?: string[];
  /** Model IDs explicitly linked to this product. */
  vehicleModelIds?: string[];
  /** Vehicle manufacturing / assembly company, e.g. Kerman Motor. */
  vehicleManufacturerCompany?: string;
  /** Part manufacturing company, e.g. Bosch / Valeo / OEM supplier. */
  partManufacturerCompany?: string;
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
  seo?: SeoEntityDraft;
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
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountAmount?: number;
  shippingFee: number;
  total: number;
  trackingPostCode?: string;
  paymentStatus?: string;
  paymentReference?: string;
  paidAt?: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  articleCount?: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  categoryId?: string;
  readTimeMinutes: number;
  author: string;
  date: string;
  imageUrl: string;
  relatedModelIds: string[];
  relatedProductIds: string[];
  faq: { q: string; a: string }[];
  seo?: SeoEntityDraft;
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

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'refund';
  points: number; // positive for earned/bonus, negative for redeemed
  description: string;
  orderNumber?: string;
  date: string;
  balanceAfter: number;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerToman: number; // e.g. 0.0001 (1 pt per 10,000 Tomans)
  tomanPerPoint: number; // e.g. 1,000 Tomans discount per point redeemed
  minimumRedeemPoints: number; // e.g. 50 points
  maxRedeemPercent: number; // max percentage of order subtotal payable by points, e.g. 50%
  signupBonusPoints: number; // e.g. 50 bonus points on registration
  firstOrderBonusPoints: number; // e.g. 100 bonus points on first order
}

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
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  provider: 'saman' | 'mellat' | 'zarinpal' | 'parsian' | 'cod';
  isActive: boolean;
  merchantId: string;
  terminalId?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  merchantKey?: string;
  terminalKey?: string;
  endpoint?: string;
  paymentUrl?: string;
  callbackUrl?: string;
  additionalConfig?: Record<string, string>;
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

export type HeaderMenuKind =
  | 'link'
  | 'categories'
  | 'brands'
  | 'category'
  | 'brand'
  | 'model'
  | 'page'
  | 'product'
  | 'article'
  | 'system'
  | 'custom';

export type MenuSourceType =
  | 'system'
  | 'page'
  | 'product'
  | 'category'
  | 'article'
  | 'brand'
  | 'model'
  | 'custom';

export interface MenuMegaConfig {
  enabled: boolean;
  columns?: number;
  width?: 'boxed' | 'full';
  bannerImageUrl?: string;
  bannerTitle?: string;
  bannerLink?: string;
}

export interface MenuItem {
  id: string;
  title: string;
  link: string;
  badge?: string;
  kind?: HeaderMenuKind;
  isVisible?: boolean;
  openInNewTab?: boolean;
  parentId?: string;

  /** WordPress-like menu builder source binding. */
  sourceType?: MenuSourceType;
  sourceId?: string;
  originalTitle?: string;

  /** Optional presentation overrides. */
  cssClass?: string;
  icon?: string;
  megaMenu?: MenuMegaConfig;
}

export interface PopularPartsBrandItem {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  subtitle?: string;
  isVisible?: boolean;
}

export interface ProductAttributeDefinition {
  id: string;
  nameFa: string;
  category: string;
  defaultValue?: string;
}

export type SliderDevice = 'desktop' | 'tablet' | 'mobile';
export type SliderElementKey = 'tag' | 'title' | 'subtitle' | 'button';

export interface SliderElementPosition {
  x: number; // percentage from left
  y: number; // percentage from top
  width?: number; // percentage of canvas width
  height?: number; // optional percentage of canvas height
  fontSizePx?: number;
  wrap?: 'wrap' | 'nowrap';
}

export interface SliderDeviceLayout {
  tag?: SliderElementPosition;
  title?: SliderElementPosition;
  subtitle?: SliderElementPosition;
  button?: SliderElementPosition;
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
  titleColor?: string;
  subtitleColor?: string;
  bgColor?: string;
  overlayOpacity?: number; // 0 to 100
  gradientOverlay?: boolean;
  textAlignment?: 'right' | 'center' | 'left';
  buttonBgColor?: string;
  buttonTextColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  responsiveLayout?: {
    desktop?: SliderDeviceLayout;
    tablet?: SliderDeviceLayout;
    mobile?: SliderDeviceLayout;
  };
  inheritTabletFromDesktop?: boolean;
  inheritMobileFromDesktop?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadiusPx?: number;
  paddingPx?: number;
  fontSizePx?: number;
  imageRadiusPx?: number;
  imageMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'repeat-x' | 'repeat-y' | 'original';
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

export interface FooterLink {
  id: string;
  title: string;
  url: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterFeatureItem {
  id: string;
  title: string;
  description: string;
  desc?: string;
  icon?: string;
}

export interface FooterBadgeItem {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  htmlCode?: string;
}

export interface TrustBadgeItem {
  id: string;
  title: string;
  imageUrl?: string;
  htmlCode?: string;
  link?: string;
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
  primaryHover?: string;
  accentGlowColor?: string; // red highlight/glow under buttons and hover states
  themeMode?: 'dark' | 'light' | 'slate' | 'navy' | 'custom';
  layoutPreset?: 'classic' | 'catalog-pro' | 'showroom' | 'marketplace-rtl';
  siteBgColor?: string;
  cardBgColor?: string;
  headerBgColor?: string;
  footerBgColor?: string;
  textColor?: string;
  fontFamily: 'Vazirmatn' | 'Noto Sans Arabic' | 'Rubik' | 'Alexandria' | 'Cairo';
  fontSize: 'compact' | 'normal' | 'large' | 'xlarge';
  /** Base font size applied across the storefront. Admin can tune this precisely. */
  baseFontSizePx?: number;
  /** Mobile catalog preferences. */
  mobileProductColumns?: 1 | 2;
  mobileFooterColumns?: 1 | 2;
  relatedProductsCount?: number;
  /** Mobile header logo placement and size. */
  mobileLogoAlign?: 'left' | 'center' | 'right';
  mobileLogoWidthPx?: number;
  borderRadius?: 'sharp' | 'normal' | 'rounded' | 'full';
  themeRadiusPx?: number;
  headerStyle?: 'light' | 'dark' | 'primary';
  containerWidth?: 'normal' | 'wide';
  currencyUnit?: 'rial';
  freeShippingThreshold: number;
  expressShippingFee: number;
  postShippingFee: number;
  tipaxShippingFee: number;
  enableGuestCheckout: boolean;
  enableStockAlerts: boolean;
  navigationMenus?: MenuItem[];
  headerMenus?: MenuItem[];
  popularPartsBrands?: PopularPartsBrandItem[];
  productAttributes?: ProductAttributeDefinition[];
  // Branding & Assets
  logoUrl?: string;
  faviconUrl?: string;
  sliders?: SliderItem[];
  // Homepage hero-slider behavior.
  heroSliderAutoplayMs?: number;
  heroSliderNavigation?: 'dots' | 'arrows' | 'both' | 'none';
  heroSliderAnimation?: 'fade' | 'slide' | 'zoom';
  heroSliderPauseOnHover?: boolean;
  heroSliderLoop?: boolean;

  // Marketplace footer layout / typography.
  footerGridColumnsDesktop?: number;
  footerGridColumnsTablet?: number;
  footerGridColumnsMobile?: number;
  footerGridRowsDesktop?: number;
  footerGridRowsTablet?: number;
  footerGridRowsMobile?: number;
  footerLogoUrl?: string;
  footerLogoWidthPx?: number;
  footerHeadingFontSizePx?: number;
  footerTextFontSizePx?: number;
  footerPaddingTopPx?: number;
  footerPaddingBottomPx?: number;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerContactTitle?: string;
  footerContactSubtitle?: string;
  footerNewsletterPlaceholder?: string;

  // Official Invoice and Tax Information
  sellerName?: string;
  sellerEconomicCode?: string;
  sellerNationalId?: string;
  sellerRegistrationNo?: string;
  sellerPostalCode?: string;
  sellerPhone?: string;
  sellerAddress?: string;
  // Footer Customization & Trust Badges
  footerAboutTitle?: string;
  footerAboutText?: string;
  footerShowFeatures?: boolean;
  footerFeatures?: FooterFeatureItem[];
  footerColumns?: FooterColumn[];
  footerCopyright?: string;
  footerCopyrightText?: string;
  footerBottomLinks?: FooterLink[];
  footerBottomAlign?: 'right' | 'center' | 'left';
  footerShowBadges?: boolean;
  footerBadges?: FooterBadgeItem[];
  footerCustomHtml?: string;
  footerEnamadHtml?: string;
  footerBankBadgesHtml?: string;
  footerTrustBadges?: TrustBadgeItem[];
  // Global SEO Settings
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImageUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  enableIndexRobots?: boolean;
  // Loyalty Points Program
  loyaltySettings?: LoyaltySettings;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  username: string;
  currentUser?: AdminUser;
  isMustChangePassword: boolean;
}

// Page Builder & Editable Sections
export interface PageSectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  badge?: string;
  link?: string;
  buttonText?: string;
  isVisible?: boolean;
  order: number;
  /** Optional free-position layout for visual banner composition. */
  responsiveLayout?: {
    desktop?: SliderDeviceLayout;
    tablet?: SliderDeviceLayout;
    mobile?: SliderDeviceLayout;
  };
  inheritTabletFromDesktop?: boolean;
  inheritMobileFromDesktop?: boolean;

  /** Per-item visual controls used by the live/visual builder. */
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSizePx?: number;
  borderRadiusPx?: number;
  paddingPx?: number;
  imageRadiusPx?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
  imageFit?: 'cover' | 'contain';
  titleFontSizePx?: number;
  contentFontSizePx?: number;
  minHeightPx?: number;
  textAlign?: 'right' | 'center' | 'left';
  imageMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'repeat-x' | 'repeat-y' | 'original';
  titleColor?: string;
  subtitleColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  textAlignment?: 'right' | 'center' | 'left';
  widthPercent?: number;
  tabletWidthPercent?: number;
  mobileWidthPercent?: number;
  heightPx?: number;
  tabletHeightPx?: number;
  mobileHeightPx?: number;
}

export interface PageSection {
  id: string;
  /** Stable key used by system pages such as the marketplace home page. */
  sectionKey?: string;
  title: string;
  subtitle?: string;
  content?: string;
  badge?: string;
  imageUrl?: string;
  imageMode?: 'full' | 'cover' | 'contain' | 'side' | 'banner' | 'stretch' | 'original' | 'repeat' | 'repeat-x' | 'repeat-y';
  buttonText?: string;
  buttonLink?: string;
  isVisible: boolean;
  order: number;

  // Layout builder controls
  layout?: 'boxed' | 'full' | 'grid' | 'split' | 'cards';
  desktopColumns?: number;
  tabletColumns?: number;
  mobileColumns?: number;
  fullWidth?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadiusPx?: number;
  itemRadiusPx?: number;
  paddingTopPx?: number;
  paddingBottomPx?: number;
  paddingInlinePx?: number;
  gapPx?: number;
  minHeightPx?: number;
  contentAlign?: 'right' | 'center' | 'left';
  widthPercent?: number;
  tabletWidthPercent?: number;
  mobileWidthPercent?: number;
  maxWidthPx?: number;
  maxItems?: number;
  imageSizePx?: number;
  backgroundImageOpacity?: number;
  itemAspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  contentSource?: 'manual' | 'categories' | 'brands' | 'products' | 'articles';
  contentSourceLimit?: number;
  itemBackgroundColor?: string;
  itemTextColor?: string;
  itemBorderColor?: string;
  itemPaddingPx?: number;
  itemFontSizePx?: number;
  itemImageRadiusPx?: number;

  // Professional responsive/visual controls shared by all page-builder sections.
  marginTopPx?: number;
  marginBottomPx?: number;
  headingFontSizePx?: number;
  subtitleFontSizePx?: number;
  itemTitleFontSizePx?: number;
  itemContentFontSizePx?: number;
  itemImageWidthPx?: number;
  itemImageHeightPx?: number;
  itemImageFit?: 'cover' | 'contain';
  itemMinHeightPx?: number;
  itemTextAlign?: 'right' | 'center' | 'left';
  mobileDisplayMode?: 'grid' | 'scroll';
  mobileItemMinWidthPx?: number;
  layoutVariant?: 'default' | 'uniform' | 'mosaic' | 'compact';

  dealTimerAlign?: 'right' | 'center' | 'left';
  dealTimerFontSizePx?: number;
  dealTitleColor?: string;
  dealSubtitleColor?: string;
  dealTimerTextColor?: string;
  dealTimerBoxBgColor?: string;
  dealContentVerticalAlign?: 'start' | 'center' | 'end';

  finderWidthPx?: number;
  finderPaddingPx?: number;
  finderRadiusPx?: number;
  finderTitleFontSizePx?: number;
  finderTextFontSizePx?: number;
  finderLabelFontSizePx?: number;
  finderValueFontSizePx?: number;
  finderButtonFontSizePx?: number;
  finderBackgroundColor?: string;
  finderTextColor?: string;
  finderFieldBackgroundColor?: string;
  finderFieldTextColor?: string;
  finderButtonBackgroundColor?: string;
  finderButtonTextColor?: string;
  finderSide?: 'left' | 'right';

  /** Repeater content for testimonials, banners, feature cards and similar sections. */
  items?: PageSectionItem[];
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: PageSection[];
  isSystem?: boolean;
  updatedAt: string;
  seo?: SeoEntityDraft;
  builderConfigVersion?: number;
}
