import type { Category } from '../types';

/**
 * The canonical 12-part catalog taxonomy. Existing product-facing slugs are
 * retained where possible; timing and turbo are now nested under their parent
 * systems so products can be grouped consistently.
 */
export const PART_CATEGORIES: Category[] = [
  {
    id: 'cat-engine', nameFa: 'موتور و قطعات موتوری', nameEn: 'Engine & Mechanics', slug: 'engine', icon: 'Cpu',
    description: 'قطعات داخلی موتور، سرسیلندر، تایمینگ، واشرها، کاسه‌نمدها و پایه‌های نگه‌دارنده.',
    subcategories: [
      { id: 'sub-engine-internals', nameFa: 'قطعات درون موتور', nameEn: 'Engine Internals', slug: 'engine-internals', subcategories: [
        { id: 'sub-pistons', nameFa: 'پیستون و رینگ', nameEn: 'Pistons & Rings', slug: 'pistons' },
        { id: 'sub-connecting-rods', nameFa: 'شاتون و یاتاقان', nameEn: 'Connecting Rods & Bearings', slug: 'connecting-rods' },
        { id: 'sub-crankshaft', nameFa: 'میل‌لنگ', nameEn: 'Crankshaft', slug: 'crankshaft' },
        { id: 'sub-oil-pump', nameFa: 'اویل پمپ', nameEn: 'Oil Pump', slug: 'oil-pump' }
      ]},
      { id: 'sub-cylinder-head', nameFa: 'سرسیلندر و متعلقات', nameEn: 'Cylinder Head', slug: 'cylinder-head', subcategories: [
        { id: 'sub-valves', nameFa: 'سوپاپ دود و هوا', nameEn: 'Intake & Exhaust Valves', slug: 'valves' },
        { id: 'sub-camshafts', nameFa: 'میل‌سوپاپ', nameEn: 'Camshafts', slug: 'camshafts' },
        { id: 'sub-guides-seats', nameFa: 'گاید و سیت سوپاپ', nameEn: 'Valve Guides & Seats', slug: 'valve-guides-seats' }
      ]},
      { id: 'sub-timing-system', nameFa: 'تایمینگ و تسمه‌ها', nameEn: 'Timing & Belts', slug: 'timing', subcategories: [
        { id: 'sub-timing-chain-kit', nameFa: 'کیت زنجیر تایم', nameEn: 'Timing Chain Kit', slug: 'timing-chain-kit' },
        { id: 'sub-timing-belt', nameFa: 'تسمه تایم و تسمه دینام', nameEn: 'Timing Belts', slug: 'timing-belt' },
        { id: 'sub-timing-tensioner', nameFa: 'سفت‌کن و هرزگرد', nameEn: 'Tensioners & Idlers', slug: 'timing-tensioner' },
        { id: 'sub-vvt-gear', nameFa: 'چرخ‌دنده VVT', nameEn: 'VVT Sprocket', slug: 'vvt-sprocket' }
      ]},
      { id: 'sub-engine-gaskets', nameFa: 'واشرها و کاسه‌نمدها', nameEn: 'Gaskets & Seals', slug: 'engine-gaskets', subcategories: [
        { id: 'sub-head-gasket', nameFa: 'واشر سرسیلندر', nameEn: 'Head Gasket', slug: 'head-gasket' },
        { id: 'sub-valve-cover-gasket', nameFa: 'واشر درب سوپاپ', nameEn: 'Valve Cover Gasket', slug: 'valve-cover-gasket' },
        { id: 'sub-engine-seals', nameFa: 'کاسه‌نمد و کیت واشر', nameEn: 'Oil Seals & Gasket Kits', slug: 'engine-seals' }
      ]},
      { id: 'sub-engine-mounts', nameFa: 'دسته موتور و گیربکس', nameEn: 'Engine & Transmission Mounts', slug: 'engine-mount' }
    ]
  },
  {
    id: 'cat-transmission', nameFa: 'گیربکس و سیستم انتقال قدرت', nameEn: 'Transmission & Drivetrain', slug: 'transmission', icon: 'Cog',
    description: 'قطعات داخلی گیربکس‌های دستی و اتوماتیک، پلوس، دیفرانسیل و گاردان.',
    subcategories: [
      { id: 'sub-transmission-internals', nameFa: 'قطعات داخلی گیربکس', nameEn: 'Transmission Internals', slug: 'transmission-internals', subcategories: [
        { id: 'sub-valve-body', nameFa: 'ساعت و شیر برقی گیربکس', nameEn: 'Valve Body & Solenoids', slug: 'valve-body' },
        { id: 'sub-trans-filters', nameFa: 'فیلتر گیربکس CVT / DCT', nameEn: 'Transmission Filters', slug: 'transmission-filter' },
        { id: 'sub-clutch-kit', nameFa: 'کیت کلاچ و مجموعه‌های DCT', nameEn: 'Clutch Kits', slug: 'clutch-kits' }
      ]},
      { id: 'sub-drive-axles', nameFa: 'پلوس و انتقال قدرت', nameEn: 'Drive Axles', slug: 'drive-shafts', subcategories: [
        { id: 'sub-cv-joints', nameFa: 'سرپلوس و مشعلی پلوس', nameEn: 'CV Joints', slug: 'cv-joints' },
        { id: 'sub-cv-boots', nameFa: 'گردگیر پلوس', nameEn: 'CV Boots', slug: 'cv-boots' }
      ]},
      { id: 'sub-differential-propeller', nameFa: 'دیفرانسیل و گاردان', nameEn: 'Differential & Propeller Shaft', slug: 'differential-propeller', subcategories: [
        { id: 'sub-propeller-joints', nameFa: 'چهارشاخ و بلبرینگ گاردان', nameEn: 'Propeller Shaft Joints', slug: 'propeller-shaft-joints' },
        { id: 'sub-wheel-hubs', nameFa: 'توپی و بلبرینگ چرخ', nameEn: 'Wheel Hubs & Bearings', slug: 'wheel-hubs' }
      ]}
    ]
  },
  {
    id: 'cat-suspension', nameFa: 'سیستم تعلیق، جلوبندی و فرمان', nameEn: 'Suspension & Steering', slug: 'suspension', icon: 'Move',
    description: 'قطعات تعلیق جلو و عقب، کمک‌فنر، طبق، بوش‌ها و اجزای سیستم فرمان.',
    subcategories: [
      { id: 'sub-front-suspension', nameFa: 'تعلیق جلو', nameEn: 'Front Suspension', slug: 'front-suspension', subcategories: [
        { id: 'sub-front-shocks', nameFa: 'کمک‌فنر و توپی کمک جلو', nameEn: 'Front Shocks & Mounts', slug: 'front-shock-absorbers' },
        { id: 'sub-control-arms', nameFa: 'طبق و سیبک طبق', nameEn: 'Control Arms & Ball Joints', slug: 'control-arms' },
        { id: 'sub-sway-bar-links', nameFa: 'میل موج‌گیر و بوش‌ها', nameEn: 'Sway Bar Links & Bushings', slug: 'sway-bar-links' }
      ]},
      { id: 'sub-rear-suspension', nameFa: 'تعلیق عقب', nameEn: 'Rear Suspension', slug: 'rear-suspension', subcategories: [
        { id: 'sub-rear-shocks', nameFa: 'کمک‌فنر عقب', nameEn: 'Rear Shocks', slug: 'rear-shock-absorbers' },
        { id: 'sub-rear-springs', nameFa: 'فنر لول و طبق عقب', nameEn: 'Rear Springs & Arms', slug: 'rear-springs-arms' },
        { id: 'sub-rear-bushings', nameFa: 'بوش‌های تعلیق عقب', nameEn: 'Rear Suspension Bushings', slug: 'rear-bushings' }
      ]},
      { id: 'sub-steering', nameFa: 'سیستم فرمان', nameEn: 'Steering System', slug: 'steering', subcategories: [
        { id: 'sub-steering-rack', nameFa: 'جعبه فرمان برقی و هیدرولیک', nameEn: 'Steering Rack', slug: 'steering-rack' },
        { id: 'sub-steering-joints', nameFa: 'سیبک و قرقری فرمان', nameEn: 'Steering Joints', slug: 'steering-joints' },
        { id: 'sub-power-steering-pump', nameFa: 'پمپ هیدرولیک فرمان', nameEn: 'Power Steering Pump', slug: 'power-steering-pump' }
      ]}
    ]
  },
  {
    id: 'cat-brakes', nameFa: 'سیستم ترمز و ایمنی', nameEn: 'Brake System & Safety', slug: 'brakes', icon: 'Disc3',
    description: 'لنت، دیسک و کالیپر ترمز، پمپ و بوستر ترمز و قطعات ABS.',
    subcategories: [
      { id: 'sub-mechanical-brakes', nameFa: 'قطعات مکانیکی ترمز', nameEn: 'Mechanical Brakes', slug: 'mechanical-brakes', subcategories: [
        { id: 'sub-front-brake-pads', nameFa: 'لنت ترمز جلو', nameEn: 'Front Brake Pads', slug: 'front-brake-pads' },
        { id: 'sub-rear-brake-pads', nameFa: 'لنت ترمز عقب', nameEn: 'Rear Brake Pads', slug: 'rear-brake-pads' },
        { id: 'sub-brake-rotors', nameFa: 'دیسک و کاسه چرخ', nameEn: 'Brake Discs & Drums', slug: 'brake-discs' },
        { id: 'sub-brake-calipers', nameFa: 'کالیپر ترمز', nameEn: 'Brake Calipers', slug: 'brake-calipers' }
      ]},
      { id: 'sub-brake-hydraulics', nameFa: 'هیدرولیک و کنترل ترمز', nameEn: 'Brake Hydraulics & Controls', slug: 'brake-hydraulics', subcategories: [
        { id: 'sub-master-cylinder-booster', nameFa: 'پمپ و بوستر ترمز', nameEn: 'Master Cylinder & Booster', slug: 'brake-master-cylinder' },
        { id: 'sub-abs-sensor', nameFa: 'بلوک و سنسور ABS', nameEn: 'ABS Module & Sensors', slug: 'abs-sensors' }
      ]}
    ]
  },
  {
    id: 'cat-electrical', nameFa: 'قطعات برقی، سنسورها و انژکتور', nameEn: 'Electrical, Sensors & Injection', slug: 'electrical', icon: 'Zap',
    description: 'سیستم جرقه‌زنی و استارت، سنسورهای موتور و رفاهی، ECU، BCM و جعبه فیوز.',
    subcategories: [
      { id: 'sub-ignition-starting', nameFa: 'جرقه‌زنی و استارت', nameEn: 'Ignition & Starting', slug: 'ignition-starting', subcategories: [
        { id: 'sub-coils', nameFa: 'کویل، شمع و وایر', nameEn: 'Coils, Plugs & Wires', slug: 'ignition-coils' },
        { id: 'sub-alternator-starter', nameFa: 'دینام و استارت', nameEn: 'Alternator & Starter', slug: 'alternator-starter' }
      ]},
      { id: 'sub-engine-sensors', nameFa: 'سنسورهای موتور', nameEn: 'Engine Sensors', slug: 'engine-sensors', subcategories: [
        { id: 'sub-o2-sensors', nameFa: 'سنسور اکسیژن', nameEn: 'Oxygen Sensors', slug: 'oxygen-sensors' },
        { id: 'sub-crank-cam-sensors', nameFa: 'سنسور میل‌لنگ و میل‌سوپاپ', nameEn: 'Crank & Cam Sensors', slug: 'crank-cam-sensors' },
        { id: 'sub-map-maf-sensors', nameFa: 'سنسور MAP و MAF', nameEn: 'MAP & MAF Sensors', slug: 'map-maf-sensors' }
      ]},
      { id: 'sub-comfort-sensors', nameFa: 'سنسورهای رفاهی و ایمنی', nameEn: 'Comfort & Safety Sensors', slug: 'comfort-sensors', subcategories: [
        { id: 'sub-parking-radar', nameFa: 'سنسور دنده عقب و رادار نقطه کور', nameEn: 'Parking & Blind Spot Sensors', slug: 'parking-blindspot-sensors' },
        { id: 'sub-rain-tpms', nameFa: 'سنسور باران و TPMS', nameEn: 'Rain & TPMS Sensors', slug: 'rain-tpms-sensors' }
      ]},
      { id: 'sub-control-units', nameFa: 'کامپیوتر و یونیت‌ها', nameEn: 'Control Units', slug: 'control-units', subcategories: [
        { id: 'sub-ecu-bcm', nameFa: 'ECU و BCM', nameEn: 'ECU & BCM', slug: 'ecu-bcm' },
        { id: 'sub-fuse-box', nameFa: 'جعبه فیوز و رله', nameEn: 'Fuse Boxes & Relays', slug: 'fuse-box-relay' },
        { id: 'sub-injectors', nameFa: 'انژکتور و ریل سوخت', nameEn: 'Injectors & Fuel Rail', slug: 'injectors' }
      ]}
    ]
  },
  {
    id: 'cat-cooling', nameFa: 'سیستم خنک‌کننده و تهویه', nameEn: 'Cooling & HVAC', slug: 'cooling', icon: 'Thermometer',
    description: 'خنک‌کاری موتور، رادیاتور، واترپمپ، فن، کولر و بخاری.',
    subcategories: [
      { id: 'sub-engine-cooling', nameFa: 'خنک‌کننده موتور', nameEn: 'Engine Cooling', slug: 'engine-cooling', subcategories: [
        { id: 'sub-water-pump', nameFa: 'واتر پمپ', nameEn: 'Water Pump', slug: 'water-pump' },
        { id: 'sub-radiator', nameFa: 'رادیاتور آب', nameEn: 'Radiator', slug: 'engine-radiator' },
        { id: 'sub-thermostat', nameFa: 'ترموستات و هوزینگ', nameEn: 'Thermostat & Housing', slug: 'thermostat' },
        { id: 'sub-cooling-fan', nameFa: 'فن و موتور فن', nameEn: 'Cooling Fan', slug: 'cooling-fan' },
        { id: 'sub-expansion-tank', nameFa: 'مخزن انبساط', nameEn: 'Expansion Tank', slug: 'expansion-tank' },
        { id: 'sub-oil-cooler', nameFa: 'اویل کولر', nameEn: 'Oil Cooler', slug: 'oil-cooler' }
      ]},
      { id: 'sub-hvac', nameFa: 'کولر و بخاری', nameEn: 'Air Conditioning & Heating', slug: 'hvac', subcategories: [
        { id: 'sub-ac-compressor-condenser', nameFa: 'کمپرسور و کندانسور کولر', nameEn: 'AC Compressor & Condenser', slug: 'ac-compressor-condenser' },
        { id: 'sub-heater-core-expansion', nameFa: 'رادیاتور بخاری و شیر انبساط', nameEn: 'Heater Core & Expansion Valve', slug: 'heater-core-expansion' }
      ]}
    ]
  },
  {
    id: 'cat-fuel', nameFa: 'سوخت‌رسانی و سیستم پرخوران', nameEn: 'Fuel System & Turbocharger', slug: 'fuel', icon: 'Fuel',
    description: 'پمپ و انژکتور سوخت، ریل سوخت، توربوشارژر و اجزای اگزوز.',
    subcategories: [
      { id: 'sub-fuel-system', nameFa: 'سیستم سوخت‌رسانی', nameEn: 'Fuel System', slug: 'fuel-system', subcategories: [
        { id: 'sub-fuel-pump', nameFa: 'پمپ و مغزی پمپ بنزین', nameEn: 'Fuel Pump', slug: 'fuel-pump' },
        { id: 'sub-hpfp', nameFa: 'پمپ فشاربالای سوخت', nameEn: 'High Pressure Fuel Pump', slug: 'hpfp' },
        { id: 'sub-fuel-rail', nameFa: 'ریل و رگلاتور سوخت', nameEn: 'Fuel Rail & Regulator', slug: 'fuel-rail-regulator' }
      ]},
      { id: 'sub-turbo-system', nameFa: 'توربو و اگزوز', nameEn: 'Turbocharger & Exhaust', slug: 'turbo', subcategories: [
        { id: 'sub-turbochargers', nameFa: 'توربوشارژر و کارتریج', nameEn: 'Turbochargers & CHRA', slug: 'turbochargers' },
        { id: 'sub-intercoolers', nameFa: 'اینترکولر و لوله‌های بوست', nameEn: 'Intercooler & Boost Pipes', slug: 'intercoolers' },
        { id: 'sub-catalyst-exhaust', nameFa: 'کاتالیزور و منبع اگزوز', nameEn: 'Catalytic Converter & Exhaust', slug: 'catalyst-exhaust' }
      ]}
    ]
  },
  {
    id: 'cat-body', nameFa: 'قطعات بدنه، شیشه و آینه', nameEn: 'Body Panels, Glass & Mirrors', slug: 'body', icon: 'CarFront',
    description: 'قطعات بیرونی بدنه، سپر، گلگیر، شیشه، آینه و متعلقات.',
    subcategories: [
      { id: 'sub-body-panels', nameFa: 'قطعات بیرونی بدنه', nameEn: 'Exterior Body Panels', slug: 'body-panels', subcategories: [
        { id: 'sub-bumpers-grille', nameFa: 'سپر و جلوپنجره', nameEn: 'Bumpers & Grille', slug: 'bumpers-grille' },
        { id: 'sub-hood-fenders-doors', nameFa: 'کاپوت، گلگیر و درب‌ها', nameEn: 'Hood, Fenders & Doors', slug: 'hood-fenders-doors' },
        { id: 'sub-splash-guards', nameFa: 'شلگیر و پوشش زیر بدنه', nameEn: 'Splash Guards', slug: 'splash-guards' }
      ]},
      { id: 'sub-glass-mirrors', nameFa: 'شیشه و آینه', nameEn: 'Glass & Mirrors', slug: 'glass-mirrors', subcategories: [
        { id: 'sub-mirrors', nameFa: 'آینه جانبی کامل', nameEn: 'Side Mirrors', slug: 'side-mirrors' },
        { id: 'sub-windshields', nameFa: 'شیشه جلو و عقب', nameEn: 'Windshields', slug: 'windshields' },
        { id: 'sub-window-regulators', nameFa: 'شیشه‌بالابر و قفل درب', nameEn: 'Window Regulators & Door Locks', slug: 'window-regulators-locks' }
      ]},
      { id: 'sub-wipers', nameFa: 'برف‌پاک‌کن و بازویی', nameEn: 'Wipers', slug: 'wipers' }
    ]
  },
  {
    id: 'cat-lighting', nameFa: 'سیستم روشنایی و چراغ‌ها', nameEn: 'Lighting System', slug: 'lighting', icon: 'Lightbulb',
    description: 'چراغ‌های جلو و عقب، مه‌شکن، دیلایت، لامپ و بالاست.',
    subcategories: [
      { id: 'sub-headlights', nameFa: 'چراغ جلو', nameEn: 'Headlights', slug: 'headlights' },
      { id: 'sub-taillights', nameFa: 'چراغ عقب و خطر', nameEn: 'Tail Lights', slug: 'taillights' },
      { id: 'sub-fog-lights', nameFa: 'پروژکتور و مه‌شکن', nameEn: 'Fog Lights', slug: 'fog-lights' },
      { id: 'sub-bulbs-ballasts', nameFa: 'لامپ LED، زنون و بالاست', nameEn: 'LED, Xenon Bulbs & Ballasts', slug: 'bulbs-ballasts' }
    ]
  },
  {
    id: 'cat-filters', nameFa: 'لوازم مصرفی و فیلترها', nameEn: 'Maintenance & Filters', slug: 'filters', icon: 'Layers',
    description: 'فیلترهای سرویس دوره‌ای، شمع، لنت و اقلام مصرفی پرکاربرد.',
    subcategories: [
      { id: 'sub-oil-filter', nameFa: 'فیلتر روغن', nameEn: 'Oil Filter', slug: 'oil-filter' },
      { id: 'sub-air-filter', nameFa: 'فیلتر هوا', nameEn: 'Air Filter', slug: 'air-filter' },
      { id: 'sub-cabin-filter', nameFa: 'فیلتر کابین', nameEn: 'Cabin Filter', slug: 'cabin-filter' },
      { id: 'sub-fuel-filter', nameFa: 'فیلتر و صافی سوخت', nameEn: 'Fuel Filter', slug: 'fuel-filter' },
      { id: 'sub-trans-filter-maintenance', nameFa: 'صافی گیربکس', nameEn: 'Transmission Filter', slug: 'transmission-filter' },
      { id: 'sub-maintenance-spark-plugs', nameFa: 'شمع موتور', nameEn: 'Spark Plugs', slug: 'spark-plugs' },
      { id: 'sub-wiper-blades', nameFa: 'تیغه برف‌پاک‌کن', nameEn: 'Wiper Blades', slug: 'wiper-blades' }
    ]
  },
  {
    id: 'cat-fluids', nameFa: 'روغن، سیالات و مکمل‌ها', nameEn: 'Fluids & Lubricants', slug: 'fluids', icon: 'Droplet',
    description: 'روغن موتور و گیربکس، سیالات خودرو و مکمل‌های نگهداری.',
    subcategories: [
      { id: 'sub-engine-oil', nameFa: 'روغن موتور', nameEn: 'Engine Oil', slug: 'engine-oil' },
      { id: 'sub-transmission-oil', nameFa: 'روغن گیربکس ATF / CVT / DCT', nameEn: 'Transmission Fluid', slug: 'transmission-oil' },
      { id: 'sub-steering-brake-fluid', nameFa: 'روغن هیدرولیک فرمان و ترمز', nameEn: 'Steering & Brake Fluid', slug: 'steering-brake-fluid' },
      { id: 'sub-coolant', nameFa: 'ضدیخ و مایع خنک‌کننده', nameEn: 'Coolant', slug: 'coolant' },
      { id: 'sub-fuel-additives', nameFa: 'مکمل سوخت و شوینده انژکتور', nameEn: 'Fuel Additives & Injector Cleaner', slug: 'fuel-additives' }
    ]
  },
  {
    id: 'cat-interior', nameFa: 'تزئینات، قطعات داخلی و لوکس', nameEn: 'Interior & Trim', slug: 'interior', icon: 'Armchair',
    description: 'قطعات داشبورد و کابین، کلیدها، تزئینات داخلی و تجهیزات ایمنی.',
    subcategories: [
      { id: 'sub-dashboard-trim', nameFa: 'داشبورد و قطعات تزئینی', nameEn: 'Dashboard & Trim', slug: 'dashboard-trim', subcategories: [
        { id: 'sub-dashboard', nameFa: 'پوسته داشبورد', nameEn: 'Dashboard Panels', slug: 'dashboard' },
        { id: 'sub-steering-wheel', nameFa: 'غربیلک فرمان', nameEn: 'Steering Wheel', slug: 'steering-wheel' },
        { id: 'sub-decorative-trim', nameFa: 'قطعات دکوراتیو کابین', nameEn: 'Decorative Trim', slug: 'decorative-trim' }
      ]},
      { id: 'sub-switches-controls', nameFa: 'کلیدها و کنترل‌ها', nameEn: 'Switches & Controls', slug: 'switches-controls', subcategories: [
        { id: 'sub-window-switches', nameFa: 'کلید شیشه‌بالابر', nameEn: 'Window Switches', slug: 'window-switches' },
        { id: 'sub-steering-switches', nameFa: 'کلیدهای روی فرمان', nameEn: 'Steering Switches', slug: 'steering-switches' }
      ]},
      { id: 'sub-restraints', nameFa: 'ایربگ و کمربند ایمنی', nameEn: 'Airbags & Seat Belts', slug: 'airbags-seatbelts' }
    ]
  }
];
