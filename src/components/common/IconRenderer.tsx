import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconCatalogItem {
  name: string;
  className: string;
  label: string;
  group: string;
}

type SvgProps = React.SVGProps<SVGSVGElement> & { strokeWidth?: number };

const AutoSvg: React.FC<SvgProps & { children: React.ReactNode }> = ({ children, className, strokeWidth = 1.8, ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {children}
  </svg>
);

const CUSTOM_ICONS: Record<string, React.FC<SvgProps>> = {
  Engine: props => <AutoSvg {...props}><path d="M4 8h3l2-2h6l2 2h3v9h-3l-2 2H8l-2-2H4z"/><path d="M9 10h6v5H9z"/><path d="M2 10v5M20 10h2v4"/></AutoSvg>,
  Turbocharger: props => <AutoSvg {...props}><path d="M12 4a8 8 0 1 0 7.4 11H22v-5h-5v2a5 5 0 1 1-5-5c1.7 0 3.2.8 4.1 2"/><circle cx="12" cy="12" r="2.2"/><path d="M12 9V5M15 12h4M12 15v4M9 12H5"/></AutoSvg>,
  Piston: props => <AutoSvg {...props}><path d="M7 3h10v6H7zM8 6h8M9 9v4l3 2 3-2V9M12 15v6M9 21h6"/></AutoSvg>,
  Cylinder: props => <AutoSvg {...props}><ellipse cx="12" cy="5" rx="5" ry="2.5"/><path d="M7 5v13c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V5"/><ellipse cx="12" cy="18" rx="5" ry="2.5"/></AutoSvg>,
  SparkPlug: props => <AutoSvg {...props}><path d="M9 2h6v5H9zM8 7h8v4H8zM10 11v6h4v-6M10 14h4M12 17v4M12 21l2 1"/></AutoSvg>,
  Injector: props => <AutoSvg {...props}><path d="M9 2h6v4H9zM8 6h8v5l-2 3v4h-4v-4l-2-3zM11 18v3M13 18v3M10 22h4"/></AutoSvg>,
  OilFilter: props => <AutoSvg {...props}><ellipse cx="12" cy="5" rx="5" ry="2"/><path d="M7 5v14c0 1.1 2.2 2 5 2s5-.9 5-2V5M9 9h6M9 13h6M9 17h6"/></AutoSvg>,
  AirFilter: props => <AutoSvg {...props}><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 8l2 8 2-8 2 8 2-8 2 8"/></AutoSvg>,
  FuelFilter: props => <AutoSvg {...props}><path d="M8 4h8v3l2 3v8H6v-8l2-3zM9 11h6M9 14h6M10 18v3M14 18v3"/></AutoSvg>,
  BrakeDisc: props => <AutoSvg {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="6.5" r=".7"/><circle cx="17.5" cy="12" r=".7"/><circle cx="12" cy="17.5" r=".7"/><circle cx="6.5" cy="12" r=".7"/><path d="M18 7h3v8h-3"/></AutoSvg>,
  BrakePad: props => <AutoSvg {...props}><path d="M5 7c4-4 10-4 14 0v10H5z"/><path d="M8 9h8v6H8z"/></AutoSvg>,
  BrakeCaliper: props => <AutoSvg {...props}><path d="M5 7h11c2 0 3 1 3 3v6h-4v-3H9v4H5z"/><circle cx="12" cy="12" r="3"/></AutoSvg>,
  Clutch: props => <AutoSvg {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v5M20 12h-5M12 20v-5M4 12h5M6.3 6.3l3.5 3.5M17.7 6.3l-3.5 3.5M17.7 17.7l-3.5-3.5M6.3 17.7l3.5-3.5"/></AutoSvg>,
  Gearbox: props => <AutoSvg {...props}><path d="M4 8h4l2-3h5l2 3h3v9h-4l-2 2H8l-2-2H4z"/><circle cx="10" cy="12" r="2"/><circle cx="15.5" cy="12" r="1.5"/></AutoSvg>,
  Differential: props => <AutoSvg {...props}><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><path d="M2 12h5M17 12h5M12 7V3M9 16l-3 3M15 16l3 3"/></AutoSvg>,
  Driveshaft: props => <AutoSvg {...props}><path d="M4 7l3 3 10 4 3 3M7 10l-3 3M17 14l3-3"/><circle cx="5.5" cy="11.5" r="2"/><circle cx="18.5" cy="12.5" r="2"/></AutoSvg>,
  CVJoint: props => <AutoSvg {...props}><circle cx="9" cy="12" r="4"/><path d="M13 12h8M3 12h2M9 8V5M9 19v-3"/><circle cx="9" cy="12" r="1"/></AutoSvg>,
  WheelHub: props => <AutoSvg {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="6.5" r=".8"/><circle cx="17.2" cy="10.2" r=".8"/><circle cx="15.2" cy="16.5" r=".8"/><circle cx="8.8" cy="16.5" r=".8"/><circle cx="6.8" cy="10.2" r=".8"/></AutoSvg>,
  ShockAbsorber: props => <AutoSvg {...props}><path d="M9 2h6v4H9zM10 6h4v5h2v7h-2v4h-4v-4H8v-7h2zM8 13h8"/></AutoSvg>,
  CoilSpring: props => <AutoSvg {...props}><path d="M8 3h8M9 5c6 1 6 3 0 4s-6 3 0 4 6 3 0 4 0 4 6 4M8 21h8"/></AutoSvg>,
  ControlArm: props => <AutoSvg {...props}><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2.5"/><path d="M6.5 7.5L10.5 16M17.5 7.5L13.5 16M7 6h10"/></AutoSvg>,
  SteeringWheel: props => <AutoSvg {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M4.5 10h15M12 14v6M10.5 13L7 18M13.5 13l3.5 5"/></AutoSvg>,
  SteeringRack: props => <AutoSvg {...props}><rect x="5" y="9" width="14" height="6" rx="2"/><path d="M2 12h3M19 12h3M8 9l2-3h4l2 3M9 15l-2 4M15 15l2 4"/></AutoSvg>,
  Radiator: props => <AutoSvg {...props}><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 6v12M11 6v12M14 6v12M17 6v12M2 8h3M19 16h3"/></AutoSvg>,
  WaterPump: props => <AutoSvg {...props}><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 5v5M19 12h-5M12 19v-5M5 12h5"/><path d="M19 8h3v4"/></AutoSvg>,
  ThermostatAuto: props => <AutoSvg {...props}><circle cx="12" cy="12" r="7"/><path d="M12 7v6M12 13l3 2M7 5l-2-2M17 5l2-2M5 17l-2 2M19 17l2 2"/></AutoSvg>,
  CoolingFan: props => <AutoSvg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 10c-1-5 2-6 4-5 1 2 0 5-3 7M14 12c5-1 6 2 5 4-2 1-5 0-7-3M12 14c1 5-2 6-4 5-1-2 0-5 3-7M10 12c-5 1-6-2-5-4 2-1 5 0 7 3"/></AutoSvg>,
  Intercooler: props => <AutoSvg {...props}><rect x="5" y="7" width="14" height="10" rx="2"/><path d="M8 9v6M11 9v6M14 9v6M17 9v6M2 10h3M19 14h3"/></AutoSvg>,
  Exhaust: props => <AutoSvg {...props}><path d="M3 8h8v3h5l2 2v4h-5v-3H8v3H3z"/><path d="M18 13h3M19 9c1-2 3-2 3-4"/></AutoSvg>,
  CatalyticConverter: props => <AutoSvg {...props}><path d="M3 10h4l2-3h6l2 3h4v4h-4l-2 3H9l-2-3H3z"/><path d="M10 9l4 6M14 9l-4 6"/></AutoSvg>,
  Muffler: props => <AutoSvg {...props}><path d="M2 11h5l2-3h7l2 3h4v3h-4l-2 3H9l-2-3H2z"/><path d="M11 10v5M14 10v5"/></AutoSvg>,
  FuelPump: props => <AutoSvg {...props}><rect x="6" y="5" width="9" height="14" rx="2"/><path d="M8 8h5v4H8zM15 8h2l2 2v7c0 1 2 1 2 0v-5M9 19v2M12 19v2"/></AutoSvg>,
  Alternator: props => <AutoSvg {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M20 12h-3M12 20v-3M4 12h3M6.5 6.5l2 2M17.5 6.5l-2 2M17.5 17.5l-2-2M6.5 17.5l2-2"/></AutoSvg>,
  StarterMotor: props => <AutoSvg {...props}><rect x="6" y="8" width="11" height="8" rx="3"/><path d="M17 10h3v4h-3M9 8V5h5v3M8 16v3M15 16v3M3 12h3"/></AutoSvg>,
  AutoBattery: props => <AutoSvg {...props}><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M7 7V4h3v3M14 7V4h3v3M8 11v4M6 13h4M15 11v4"/></AutoSvg>,
  ECU: props => <AutoSvg {...props}><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 2v3M12 2v3M16 2v3M8 19v3M12 19v3M16 19v3M2 8h3M2 12h3M2 16h3M19 8h3M19 12h3M19 16h3"/><path d="M9 9h6v6H9z"/></AutoSvg>,
  AutoSensor: props => <AutoSvg {...props}><path d="M10 3h4v5l3 3v7H7v-7l3-3zM9 13h6M10 18v3M14 18v3"/><path d="M18 6c2 1 3 3 3 5M6 6c-2 1-3 3-3 5"/></AutoSvg>,
  TimingBelt: props => <AutoSvg {...props}><circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/><path d="M10.5 5.5l8 8M5.5 10.5l8 8"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/></AutoSvg>,
  TimingChain: props => <AutoSvg {...props}><path d="M6 8l3-3 3 3-3 3zM12 14l3-3 3 3-3 3zM9 11l3 3M12 8l3 3"/><circle cx="6" cy="8" r="3"/><circle cx="18" cy="14" r="3"/></AutoSvg>,
  BeltTensioner: props => <AutoSvg {...props}><circle cx="9" cy="15" r="5"/><circle cx="9" cy="15" r="2"/><path d="M12 11l5-6 3 3-6 5M17 5l2-2"/></AutoSvg>,
  Headlight: props => <AutoSvg {...props}><path d="M5 6h6c3 0 5 2 5 6s-2 6-5 6H5z"/><path d="M18 8l3-2M18 12h4M18 16l3 2"/></AutoSvg>,
  TailLight: props => <AutoSvg {...props}><path d="M19 6h-6c-3 0-5 2-5 6s2 6 5 6h6z"/><path d="M6 8L3 6M6 12H2M6 16l-3 2"/></AutoSvg>,
  MirrorAuto: props => <AutoSvg {...props}><path d="M5 12c0-4 3-7 8-7 3 0 5 2 6 5-2 4-5 7-10 7-2 0-4-2-4-5z"/><path d="M8 17l-1 4M7 21h5"/></AutoSvg>,
  Wiper: props => <AutoSvg {...props}><path d="M4 17h16M7 17l6-11M13 6l5 2"/></AutoSvg>,
  Wheel: props => <AutoSvg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M21 12h-6M12 21v-6M3 12h6"/></AutoSvg>,
  Tire: props => <AutoSvg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M8 4l2 3M14 3l1 4M19 6l-3 2M20 14l-4-1M16 20l-2-3M8 20l2-3M4 16l4-2M4 8l4 2"/></AutoSvg>,
  OilCan: props => <AutoSvg {...props}><path d="M5 9h10l3 3v6H5zM8 9V6h5v3M18 12h3l1 2M3 18h4"/><path d="M20 6c1 2 2 3 2 4"/></AutoSvg>,
  Hose: props => <AutoSvg {...props}><path d="M4 5v4c0 5 4 8 8 8s8-3 8-8V5M2 5h4M18 5h4M9 17v3h6v-3"/></AutoSvg>
};

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

const AUTOMOTIVE_NAMES = Object.keys(CUSTOM_ICONS);

const GROUPS: Array<[string, string[]]> = [
  ['عمومی', ['Home','Menu','Search','User','Users','Settings','SlidersHorizontal','Plus','Check','Eye','MousePointerClick']],
  ['فروشگاه', ['ShoppingCart','ShoppingBag','Package','PackageOpen','PackageCheck','Boxes','Store','Warehouse','Tags','Gift','Percent','CreditCard']],
  ['خودرو و قطعات', ['Car','Truck','Bus','Bike','Gauge','Fuel','BatteryCharging','Wrench','Hammer','Cog','Cogs','Factory','Fan','Wind','Droplets','Thermometer']],
  ['قطعات یدکی تخصصی', AUTOMOTIVE_NAMES],
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
  Eye:'نمایش', Move:'جابه‌جایی', MapPin:'موقعیت', Bell:'اعلان',
  Engine:'موتور', Turbocharger:'توربوشارژر', Piston:'پیستون', Cylinder:'سیلندر / بوش', SparkPlug:'شمع',
  Injector:'انژکتور', OilFilter:'فیلتر روغن', AirFilter:'فیلتر هوا', FuelFilter:'فیلتر سوخت',
  BrakeDisc:'دیسک ترمز', BrakePad:'لنت ترمز', BrakeCaliper:'کالیپر ترمز', Clutch:'کلاچ',
  Gearbox:'گیربکس', Differential:'دیفرانسیل', Driveshaft:'میل گاردان', CVJoint:'پلوس / CV Joint',
  WheelHub:'توپی چرخ', ShockAbsorber:'کمک فنر', CoilSpring:'فنر لول', ControlArm:'طبق', SteeringWheel:'فرمان',
  SteeringRack:'جعبه فرمان', Radiator:'رادیاتور', WaterPump:'واترپمپ', ThermostatAuto:'ترموستات',
  CoolingFan:'فن خنک‌کننده', Intercooler:'اینترکولر', Exhaust:'اگزوز', CatalyticConverter:'کاتالیزور',
  Muffler:'منبع اگزوز', FuelPump:'پمپ سوخت', Alternator:'دینام', StarterMotor:'استارت', AutoBattery:'باتری خودرو',
  ECU:'ECU', AutoSensor:'سنسور', TimingBelt:'تسمه تایم', TimingChain:'زنجیر تایم', BeltTensioner:'تسمه‌سفت‌کن',
  Headlight:'چراغ جلو', TailLight:'چراغ عقب', MirrorAuto:'آینه', Wiper:'برف‌پاک‌کن', Wheel:'رینگ / چرخ',
  Tire:'لاستیک', OilCan:'روغن و روانکار', Hose:'شلنگ / لوله'
};

const kebab = (name:string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const ICON_CATALOG: IconCatalogItem[] = [...ICON_NAMES, ...AUTOMOTIVE_NAMES].map(name => ({
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
  const Custom = CUSTOM_ICONS[resolved];
  if (Custom) return <Custom className={className} strokeWidth={strokeWidth} />;
  const Component = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[resolved];
  if (!Component) return <>{fallback}</>;
  return <Component className={className} strokeWidth={strokeWidth} />;
};
