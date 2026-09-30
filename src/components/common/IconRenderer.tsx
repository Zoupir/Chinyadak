import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconCatalogItem {
  name: string;
  className: string;
  label: string;
  group: string;
}

const ICON_NAMES = [
  'Home','Menu','Search','User','Users','ShoppingCart','ShoppingBag','Heart','Star','Settings','SlidersHorizontal',
  'Car','Truck','Bus','Bike','Gauge','Fuel','BatteryCharging','CircleGauge','Wrench','Hammer','Cog','Cogs','Settings2',
  'Package','PackageOpen','PackageCheck','Boxes','Box','Archive','Warehouse','Factory','Store','Building2','MapPin','Navigation',
  'Phone','PhoneCall','Mail','MessageCircle','Bell','Headphones','Shield','ShieldCheck','BadgeCheck','KeyRound','Lock','Unlock',
  'FileText','Files','BookOpen','Newspaper','ClipboardList','Receipt','FileCheck2','PenLine','Edit3','Type','Image','Images',
  'Layers','LayoutGrid','LayoutList','PanelsTopLeft','Columns3','Rows3','Grid3X3','PanelTop','PanelLeft','PanelRight',
  'ChevronDown','ChevronUp','ChevronLeft','ChevronRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ArrowRightLeft',
  'Plus','Minus','X','Check','CircleCheck','CircleX','Info','CircleHelp','AlertTriangle','CircleAlert',
  'Sparkles','Zap','Flame','Lightbulb','Sun','Moon','Cloud','Snowflake','Fan','Wind','Droplets','Thermometer',
  'Cpu','CircuitBoard','Cable','Radio','Wifi','Bluetooth','Usb','Plug','Power','Monitor','Smartphone','Laptop',
  'CircleDollarSign','CreditCard','WalletCards','Banknote','Percent','Tags','Tag','Gift','TicketPercent','ChartNoAxesCombined',
  'BarChart3','ChartPie','TrendingUp','Activity','Timer','Clock3','CalendarDays','History','RefreshCw','RotateCcw',
  'Filter','ListFilter','ListTree','Network','GitBranch','Workflow','Waypoints','Share2','ExternalLink','Link2',
  'Eye','EyeOff','MousePointerClick','Move','GripVertical','Maximize2','Minimize2','Expand','Shrink',
  'CircleDot','Disc3','Circle','Hexagon','Triangle','Square','Diamond','Octagon','Construction','TrafficCone'
] as const;

const GROUPS: Array<[string, string[]]> = [
  ['عمومی', ['Home','Menu','Search','User','Users','Settings','SlidersHorizontal','Plus','Check','Eye','MousePointerClick']],
  ['فروشگاه', ['ShoppingCart','ShoppingBag','Package','PackageOpen','PackageCheck','Boxes','Store','Warehouse','Tags','Gift','Percent','CreditCard']],
  ['خودرو و قطعات', ['Car','Truck','Bus','Bike','Gauge','Fuel','BatteryCharging','Wrench','Hammer','Cog','Cogs','Factory','Fan','Wind','Droplets','Thermometer']],
  ['برق و الکترونیک', ['Cpu','CircuitBoard','Cable','Radio','Wifi','Bluetooth','Usb','Plug','Power','Monitor','Smartphone']],
  ['محتوا', ['FileText','Files','BookOpen','Newspaper','ClipboardList','Receipt','PenLine','Edit3','Type','Image','Images']],
  ['چیدمان', ['Layers','LayoutGrid','LayoutList','PanelsTopLeft','Columns3','Rows3','Grid3X3','PanelTop','PanelLeft','PanelRight','Move','Maximize2']],
  ['ارتباط و اعتماد', ['Phone','PhoneCall','Mail','MessageCircle','Bell','Headphones','Shield','ShieldCheck','BadgeCheck','MapPin']],
  ['تحلیل و وضعیت', ['BarChart3','ChartPie','TrendingUp','Activity','Timer','Clock3','CalendarDays','History','RefreshCw','AlertTriangle','Info']]
];

const labels: Record<string,string> = {
  Home:'خانه', Menu:'منو', Search:'جستجو', User:'کاربر', Users:'کاربران', ShoppingCart:'سبد خرید', ShoppingBag:'خرید',
  Heart:'علاقه‌مندی', Star:'ستاره', Settings:'تنظیمات', Car:'خودرو', Truck:'کامیون', Gauge:'گیج', Fuel:'سوخت',
  BatteryCharging:'باتری', Wrench:'آچار', Cog:'چرخ‌دنده', Package:'بسته', Warehouse:'انبار', Factory:'کارخانه',
  Phone:'تلفن', Mail:'ایمیل', ShieldCheck:'تأیید/ضمانت', FileText:'برگه', BookOpen:'مقاله', Image:'تصویر',
  Layers:'لایه‌ها', LayoutGrid:'شبکه', Sparkles:'ویژه', Zap:'برق', Flame:'حرارت', Fan:'فن', Wind:'هوا',
  Droplets:'مایعات', Thermometer:'دما', Cpu:'پردازنده/ECU', CircuitBoard:'برد الکترونیکی', Cable:'کابل',
  CreditCard:'پرداخت', Percent:'تخفیف', BarChart3:'آمار', Filter:'فیلتر', ListTree:'درخت', Network:'شبکه',
  Eye:'نمایش', Move:'جابه‌جایی', MapPin:'موقعیت', Bell:'اعلان'
};

const kebab = (name:string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const ICON_CATALOG: IconCatalogItem[] = ICON_NAMES.map(name => ({
  name,
  className: `icon-${kebab(name)}`,
  label: labels[name] || name,
  group: GROUPS.find(([,names]) => names.includes(name as any))?.[0] || 'سایر'
}));

export const resolveIconName = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const direct = ICON_CATALOG.find(item => item.name === trimmed);
  if (direct) return direct.name;
  const byClass = ICON_CATALOG.find(item => item.className === trimmed || trimmed.split(/\s+/).includes(item.className));
  return byClass?.name;
};

export const iconClassFor = (name?: string): string => {
  const resolved = resolveIconName(name);
  return resolved ? ICON_CATALOG.find(item => item.name === resolved)?.className || '' : '';
};

interface IconRendererProps {
  icon?: string;
  className?: string;
  strokeWidth?: number;
  fallback?: React.ReactNode;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ icon, className = 'w-4 h-4', strokeWidth = 2, fallback = null }) => {
  const resolved = resolveIconName(icon);
  if (!resolved) return <>{fallback}</>;
  const Component = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[resolved];
  if (!Component) return <>{fallback}</>;
  return <Component className={className} strokeWidth={strokeWidth} />;
};
