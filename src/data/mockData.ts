import { CarBrand, VehicleModel, Category, Product, Article, ArticleCategory, SliderItem, AdminUser, SitePage, PageSection } from '../types';

export const BRANDS: CarBrand[] = [
  {
    id: 'kmc',
    nameFa: 'کی‌ام‌سی (KMC)',
    nameEn: 'KMC',
    slug: 'kmc',
    logo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&auto=format&fit=crop&q=80',
    description: 'برند KMC زیرمجموعه لوکس و مدرن کرمان موتور و شرکت JAC چین، عرضه‌کننده خودروهای مدرنی همچون J7، T8، K7 و X5 در ایران.',
    country: 'چین / مونتاژ کرمان موتور',
    foundedYear: 2020,
    modelsCount: 5,
    officialRepresentative: 'کرمان موتور',
    popularCategorySlugs: ['cooling', 'engine', 'brakes', 'filters'],
    faq: [
      {
        q: 'آیا قطعات KMC در انبار چین‌پارت موجودی دائم دارند؟',
        a: 'بله، تمامی قطعات پرمصرف و موتوری خودروهای KMC J7، KMC T8 و KMC K7 به صورت مستقیم و با تضمین اصالت عرضه می‌شوند.'
      },
      {
        q: 'کد موتور KMC J7 چیست و از چه روغنی استفاده می‌کند؟',
        a: 'موتور KMC J7 از نوع ۱.۵ لیتری TGDI با کد HFC4GC1.6E بوده و نیازمند روغن موتور 5W-30 با استاندارد API SN Plus یا SP می‌باشد.'
      }
    ]
  },
  {
    id: 'chery',
    nameFa: 'چری (Chery)',
    nameEn: 'Chery',
    slug: 'chery',
    logo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
    description: 'بزرگترین صادرکننده خودروی چین و شریک تجاری مدیران خودرو، با خانواده پرفروش تیگو (Tiggo) و آریزو (Arrizo).',
    country: 'چین / مدیران خودرو',
    foundedYear: 1997,
    modelsCount: 8,
    officialRepresentative: 'مدیران خودرو (MVM / Fownix)',
    popularCategorySlugs: ['timing', 'engine', 'cooling', 'filters'],
    faq: [
      {
        q: 'تفاوت قطعات شرکتی چری و قطعات متفرقه بازار چیست؟',
        a: 'قطعات شرکتی با هولوگرام مدیران خودرو و استاندارد تست دوام کارخانه چری تولید شده و مانع از آسیب به موتور حساس توربو GDI می‌شوند.'
      }
    ]
  },
  {
    id: 'mvm',
    nameFa: 'ام‌وی‌ام (MVM)',
    nameEn: 'MVM',
    slug: 'mvm',
    logo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80',
    description: 'خط محصولات جوان‌پسند و کراس‌اوورهای شهری مدیران خودرو شامل X55 پرو، X22 پرو، X33 کراس و 315.',
    country: 'چین / مدیران خودرو',
    foundedYear: 2002,
    modelsCount: 6,
    officialRepresentative: 'مدیران خودرو',
    popularCategorySlugs: ['suspension', 'filters', 'brakes', 'transmission'],
    faq: [
      {
        q: 'گیربکس MVM X55 Pro چه نوعی است و زمان تعویض روغن آن کی است؟',
        a: 'گیربکس CVT نسل سوم با شبیه‌سازی ۹ سرعته؛ توصیه می‌شود روغن مخصوص CVT-W55 هر ۴۰ هزار کیلومتر تعویض شود.'
      }
    ]
  },
  {
    id: 'fownix',
    nameFa: 'فونیکس (Fownix)',
    nameEn: 'Fownix',
    slug: 'fownix',
    logo: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80',
    description: 'برند پریمیوم و لوکس مدیران خودرو شامل مدل‌های فونیکس FX، تیگو ۸ پرو مکس، تیگو ۷ پرو پریمیوم و آریزو ۶ جی‌تی.',
    country: 'چین / مدیران خودرو',
    foundedYear: 2021,
    modelsCount: 5,
    officialRepresentative: 'مدیران خودرو',
    popularCategorySlugs: ['turbo', 'engine', 'electronics', 'body'],
    faq: [
      {
        q: 'آیا قطعات فونیکس FX با تیگو ۸ پرو مشترک هستند؟',
        a: 'بله، بسیاری از قطعات موتوری ۱.۶ لیتری توربو TGDI (کد SQRF4J16) و سیستم انتقال قدرت دوکلاچه تر در فونیکس FX و تیگو ۸ پرو یکسان می‌باشند.'
      }
    ]
  },
  {
    id: 'jac',
    nameFa: 'جک (JAC)',
    nameEn: 'JAC',
    slug: 'jac',
    logo: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80',
    description: 'یکی از قدیمی‌ترین و محبوب‌ترین برندهای چینی در ایران با مدل‌های جاودانه J5، S5 و S3.',
    country: 'چین / کرمان موتور',
    foundedYear: 1964,
    modelsCount: 4,
    officialRepresentative: 'کرمان موتور',
    popularCategorySlugs: ['cooling', 'suspension', 'brakes', 'engine'],
    faq: [
      {
        q: 'آیا لوازم جک S5 موتور ۲۰۰۰ توربو با ۱۵۰۰ یکسان است؟',
        a: 'خیر، در قطعات موتوری از جمله واترپمپ، تسمه/زنجیر تایم، توربو و شمع تفاوت‌های اساسی وجود دارد؛ هنگام خرید به سال و حجم موتور دقت کنید.'
      }
    ]
  },
  {
    id: 'lamari',
    nameFa: 'لاماری (Lamari)',
    nameEn: 'Lamari',
    slug: 'lamari',
    logo: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&auto=format&fit=crop&q=80',
    description: 'برند خودرویی شرکت آرین پارس موتور با کراس‌اوور جذاب لاماری ایما (Forthing T5 EVO).',
    country: 'چین / آرین پارس موتور',
    foundedYear: 2022,
    modelsCount: 2,
    officialRepresentative: 'آرین پارس موتور',
    popularCategorySlugs: ['filters', 'brakes', 'cooling', 'body'],
    faq: [
      {
        q: 'موتور لاماری ایما ساخت چه شرکتی است؟',
        a: 'موتور ۱.۵ لیتری توربو شارژر لاماری ایما توسط کمپانی میتسوبیشی (شن‌یانگ) با کد 4A95TD با ۱۹۵ اسب بخار طراحی و ساخته شده است.'
      }
    ]
  },
  {
    id: 'changan',
    nameFa: 'چانگان (Changan)',
    nameEn: 'Changan',
    slug: 'changan',
    logo: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop&q=80',
    description: 'یکی از چهار غول بزرگ خودروسازی چین با مدل‌های محبوب CS35، CS35 پلاس، CS55 پلاس و یونی‌تی (UNI-T).',
    country: 'چین / سایپا',
    foundedYear: 1862,
    modelsCount: 4,
    officialRepresentative: 'سایپا',
    popularCategorySlugs: ['engine', 'suspension', 'filters', 'cooling'],
    faq: [
      {
        q: 'آیا فیلترهای چانگان وارداتی جدید با CS35 قدیمی یکسان است؟',
        a: 'خیر، مدل‌های CS35 Plus توربو دارای فیلترهای هوای متفاوتی نسبت به مدل‌های تنفس طبیعی قدیمی هستند.'
      }
    ]
  },
  {
    id: 'jetour',
    nameFa: 'جتور / فیدلیتی (Jetour)',
    nameEn: 'Jetour',
    slug: 'jetour',
    logo: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=120&auto=format&fit=crop&q=80',
    heroImage: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&auto=format&fit=crop&q=80',
    description: 'زیربرند جوان و مدرن گروه چری، عرضه‌شده در ایران با نام فیدلیتی پرایم و پرستیژ توسط گروه بهمن.',
    country: 'چین / بهمن موتور',
    foundedYear: 2018,
    modelsCount: 3,
    officialRepresentative: 'بهمن موتور',
    popularCategorySlugs: ['cooling', 'engine', 'brakes', 'transmission'],
    faq: [
      {
        q: 'موتور فیدلیتی با کدام خودروهای چری مشترک است؟',
        a: 'موتور ۱.۵ لیتری توربو فیدلیتی پرایم با تیگو ۷ معمولی و آریزو ۵ توربو پلتفرم مشترک موتوری دارد.'
      }
    ]
  }
];

export const VEHICLE_MODELS: VehicleModel[] = [
  {
    id: 'kmc-j7',
    brandId: 'kmc',
    nameFa: 'کی‌ام‌سی جی۷ (KMC J7)',
    nameEn: 'KMC J7',
    slug: 'j7',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1401,
    yearTo: 1404,
    bodyType: 'سدان',
    engineSummary: '1.5 لیتری 4 سیلندر توربو شارژر TGDI (172 اسب بخار)',
    transmissionSummary: '6 سرعته اتوماتیک دو کلاچه تر (Wet DCT)',
    description: 'سدان فست‌بک اسپرت و لوکس کرمان موتور با شتاب فوق‌العاده، طراحی تهاجمی و سیستم انتقال قدرت مدرن DCT.',
    specifications: {
      engineCode: 'HFC4GC1.6E',
      displacement: '1499 سی‌سی',
      horsepower: '172 اسب بخار @ 5500 RPM',
      torque: '280 نیوتن‌متر @ 1800-3500 RPM',
      transmission: '6 سرعته DCT دوکلاچه روغنی',
      fuelConsumption: '6.9 لیتر در 100 کیلومتر'
    },
    commonIssues: [
      'حساسیت بالای سیستم توربو به روغن نامرغوب',
      'افت کارایی واترپمپ در کارکردهای بالای ۶۰ هزار کیلومتر در صورت استفاده از ضدیخ غیراستاندارد',
      'فرسایش سریع‌تر لنت‌های ترمز چرخ جلو به دلیل شتاب‌گیری و گشتاور بالا'
    ],
    maintenanceTips: [
      'تعویض روغن موتور تمام سنتتیک 5W-30 با استاندارد API SN Plus یا SP هر ۵۰۰۰ کیلومتر',
      'تعویض فیلتر روغن اصلی در هر نوبت سرویس روغنی',
      'استفاده مداوم از مکمل‌های سوخت کاهنده ناک اکتان برای حفظ سلامت پیستون‌ها و سوزن انژکتورهای GDI'
    ],
    faq: [
      {
        q: 'آیا واترپمپ KMC J7 با جک S5 فیس‌لیفت مشترک است؟',
        a: 'بله، در هر دو مدل از موتور نسل جدید TGDI جک با کد بلوک HFC4GC استفاده شده و واترپمپ پارت نامبر 1026040GH010 روی هر دو خودرو نصب می‌شود.'
      },
      {
        q: 'لنت ترمز اصلی KMC J7 چه ویژگی دارد؟',
        a: 'لنت اصلی از فرمولاسیون سرامیکی نیمه‌فلزی بدون آزبست بهره می‌برد تا بدون سوت کشیدن و آسیب به دیسک، قدرت ترمزگیری خودرو در سرعت‌های بالا را تضمین کند.'
      }
    ]
  },
  {
    id: 'kmc-t8',
    brandId: 'kmc',
    nameFa: 'کی‌ام‌سی تی۸ (KMC T8)',
    nameEn: 'KMC T8',
    slug: 't8',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1399,
    yearTo: 1404,
    bodyType: 'پیکاپ',
    engineSummary: '2.0 لیتری 4 سیلندر توربوشارژر بنزینی (174 اسب بخار)',
    transmissionSummary: '6 سرعته دستی با ترانسفر کیس 4WD برقی',
    description: 'پرفروش‌ترین پیکاپ دو دیفرانسیل بازار ایران با قابلیت‌های آفرود تحسین‌برانگیز و استحکام شاسی بالا.',
    specifications: {
      engineCode: 'HFC4GA3-4D',
      displacement: '1997 سی‌سی',
      horsepower: '174 اسب بخار',
      torque: '290 نیوتن‌متر',
      transmission: '6 سرعته دستی (6MT)',
      fuelConsumption: '10.5 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'صفحه کلاچ تقویت‌شده KMC T8 برای آفرود چه مزیتی دارد؟',
        a: 'صفحه کلاچ‌های پریمیوم دارای لنت‌های کولار و فنرهای دوبل تقویت‌شده بوده و از داغ شدن و بوی کلاچ در شیب‌های تند جلوگیری می‌کنند.'
      }
    ]
  },
  {
    id: 'chery-tiggo7-pro',
    brandId: 'chery',
    nameFa: 'چری تیگو ۷ پرو (Tiggo 7 Pro)',
    nameEn: 'Chery Tiggo 7 Pro',
    slug: 'tiggo-7-pro',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1400,
    yearTo: 1404,
    bodyType: 'کراس‌اوور',
    engineSummary: '1.5 لیتری توربو شارژر (156 اسب بخار)',
    transmissionSummary: 'گیربکس اتوماتیک CVT با 9 دنده مجازی',
    description: 'کراس‌اوور خانوادگی و مدرن با امکانات رفاهی کامل، مصرف سوخت بهینه و استهلاک پایین قطعات یدکی.',
    specifications: {
      engineCode: 'SQRE4T15C',
      displacement: '1498 سی‌سی',
      horsepower: '156 اسب بخار',
      torque: '230 نیوتن‌متر',
      transmission: 'CVT 9 سرعته تیپ‌ترونیک',
      fuelConsumption: '7.4 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'کیت تایم تیگو ۷ پرو زنجیری است یا تسمه‌ای؟',
        a: 'موتور SQRE4T15C مجهز به زنجیر تایم تمام فلزی با طول عمر بالاست؛ با این حال بررسی سفت‌کن زنجیر در ۱۰۰ هزار کیلومتر الزامی است.'
      }
    ]
  },
  {
    id: 'chery-tiggo8-pro',
    brandId: 'chery',
    nameFa: 'چری تیگو ۸ پرو (Tiggo 8 Pro)',
    nameEn: 'Chery Tiggo 8 Pro',
    slug: 'tiggo-8-pro',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1401,
    yearTo: 1404,
    bodyType: 'شاسی‌بلند',
    engineSummary: '1.6 لیتری TGDI اکستریم (197 اسب بخار)',
    transmissionSummary: '7 سرعته دوکلاچه روغنی Wet DCT ساخت گتراک',
    description: 'شاسی‌بلند پرچمدار ۷ نفره مدیران خودرو با شتاب کم‌نظیر و پیشرانه پیشرفته توربو تزریق مستقیم.',
    specifications: {
      engineCode: 'SQRF4J16',
      displacement: '1598 سی‌سی',
      horsepower: '197 اسب بخار',
      torque: '290 نیوتن‌متر',
      transmission: '7 سرعته DCT دوکلاچه خیس',
      fuelConsumption: '7.8 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'آیا قطعات موتوری تیگو ۸ پرو با فونیکس FX یکی است؟',
        a: 'بله، هر دو از پیشرانه ۱.۶ لیتری توربو GDI سری کانتزیری چری با پارت‌های مشترک بهره می‌برند.'
      }
    ]
  },
  {
    id: 'mvm-x55-pro',
    brandId: 'mvm',
    nameFa: 'ام‌وی‌ام ایکس ۵۵ پرو (MVM X55 Pro)',
    nameEn: 'MVM X55 Pro',
    slug: 'x55-pro',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1401,
    yearTo: 1404,
    bodyType: 'کراس‌اوور',
    engineSummary: '1.5 لیتری 4 سیلندر توربو (156 اسب بخار)',
    transmissionSummary: 'CVT نسل جدید 9 سرعته با اهرم الکترونیکی',
    description: 'کراس‌اوور چالاک و پرطرفدار شهری با طراحی کابین مدرن و جلوپنجره الماسی که بازار دست‌دوم فعالی دارد.',
    specifications: {
      engineCode: 'SQRE4T15C',
      displacement: '1498 سی‌سی',
      horsepower: '156 اسب بخار',
      torque: '230 نیوتن‌متر',
      transmission: 'CVT 9 دنده با حالت اسپرت',
      fuelConsumption: '7.1 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'واترپمپ ام‌وی‌ام X55 Pro چه زمانی نیاز به تعویض دارد؟',
        a: 'معمولاً بین کارکرد ۶۰ الی ۸۰ هزار کیلومتر یا در صورت مشاهده کاهش سطح آب رادیاتور یا صدای غیرعادی پولی واترپمپ باید بررسی شود.'
      }
    ]
  },
  {
    id: 'fownix-fx',
    brandId: 'fownix',
    nameFa: 'فونیکس اف‌ایکس (Fownix FX)',
    nameEn: 'Fownix FX',
    slug: 'fx',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1401,
    yearTo: 1404,
    bodyType: 'کراس‌اوور',
    engineSummary: '1.6 لیتری TGDI مجهز به توربو (197 اسب بخار)',
    transmissionSummary: '7 سرعته اتوماتیک دو کلاچه خیس (Wet DCT)',
    description: 'کراس‌اوور فست‌بک سوپراسپرت فونیکس با رادارهای خودران سطح ۲ و بیشینه سرعت و کشش بی‌رقیب.',
    specifications: {
      engineCode: 'SQRF4J16',
      displacement: '1598 سی‌سی',
      horsepower: '197 اسب بخار',
      torque: '290 نیوتن‌متر',
      transmission: '7-Wet DCT',
      fuelConsumption: '7.2 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'لنت‌های ترمز فونیکس اف‌ایکس با چه خودروهایی مشترک هستند؟',
        a: 'کالیپر و لنت ترمز فونیکس FX پلتفرم مشترک با تیگو ۸ پرو و آریزو ۶ جی‌تی دارد.'
      }
    ]
  },
  {
    id: 'lamari-eama',
    brandId: 'lamari',
    nameFa: 'لاماری ایما (Lamari Eama)',
    nameEn: 'Lamari Eama',
    slug: 'eama',
    imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1401,
    yearTo: 1404,
    bodyType: 'کراس‌اوور',
    engineSummary: '1.5 لیتری توربو TGDI میتسوبیشی (195 اسب بخار)',
    transmissionSummary: '7 سرعته اتوماتیک دوکلاچه تر ساخت مگنا',
    description: 'کراس‌اوور چشم‌نواز آرین پارس موتور با موتور پرتوان میتسوبیشی 4A95TD و شتاب صفر تا صد ۸.۹ ثانیه.',
    specifications: {
      engineCode: '4A95TD',
      displacement: '1481 سی‌سی',
      horsepower: '195 اسب بخار',
      torque: '285 نیوتن‌متر',
      transmission: '7 سرعته دوکلاچه روغنی مگنا/گتراک',
      fuelConsumption: '6.6 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'شمع استاندارد لاماری ایما چیست؟',
        a: 'شمع ایریدیوم سوزنی مقاوم در برابر حرارت بالا با گپ حرارتی تخصصی سازگار با سیستم پاشش سوخت مستقیم میتسوبیشی.'
      }
    ]
  },
  {
    id: 'jac-s5',
    brandId: 'jac',
    nameFa: 'جک اس۵ (JAC S5)',
    nameEn: 'JAC S5',
    slug: 's5',
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1394,
    yearTo: 1402,
    bodyType: 'کراس‌اوور',
    engineSummary: '2.0 لیتری توربو (174 اسب بخار) و 1.5 لیتری TGDI فیس‌لیفت',
    transmissionSummary: '6 سرعته دو کلاچه اتوماتیک DCT',
    description: 'محبوب‌ترین کراس‌اوور جک در ایران با وفور بالای قطعات یدکی و دسترسی گسترده در تمام نقاط کشور.',
    specifications: {
      engineCode: 'HFC4GA3.1D / HFC4GC1.6D',
      displacement: '1997 / 1499 سی‌سی',
      horsepower: '174 اسب بخار',
      torque: '265 نیوتن‌متر',
      transmission: '6 سرعته اتوماتیک دوکلاچه',
      fuelConsumption: '8.8 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'آیا گیربکس جک S5 نیاز به خنک‌کننده دارد؟',
        a: 'بله، سلامت رادیاتور و اویل کولر گیربکس جک S5 برای پیشگیری از بالارفتن دمای ساعت گیربکس حیاتی است.'
      }
    ]
  },
  {
    id: 'changan-cs35-plus',
    brandId: 'changan',
    nameFa: 'چانگان سی‌اس۳۵ پلاس (CS35 Plus)',
    nameEn: 'Changan CS35 Plus',
    slug: 'cs35-plus',
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=80',
    yearFrom: 2023,
    yearTo: 2024,
    bodyType: 'کراس‌اوور',
    engineSummary: '1.4 لیتری توربوشارژر بلوکور BlueCore (158 اسب بخار)',
    transmissionSummary: '7 سرعته دو کلاچه تر (WDCT)',
    description: 'کراس‌اوور وارداتی سایپا با موتور فوق‌پیشرفته کم‌مصرف چانگان بلوکور و متریال ساخت عالی.',
    specifications: {
      engineCode: 'JL473ZQ9',
      displacement: '1392 سی‌سی',
      horsepower: '158 اسب بخار',
      torque: '260 نیوتن‌متر',
      transmission: '7 سرعته اتوماتیک دوکلاچه تر',
      fuelConsumption: '6.3 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'قطعات چانگان CS35 پلاس وارداتی به راحتی یافت می‌شوند؟',
        a: 'بله، چین‌پارت پارت‌های مصرفی، جلوپنجره، لنت‌ها و سنسورهای مدل‌های وارداتی جدید ۲۰۲۳ و ۲۰۲۴ را به طور مستقیم تامین می‌کند.'
      }
    ]
  },
  {
    id: 'jetour-fidelity',
    brandId: 'jetour',
    nameFa: 'فیدلیتی پرایم (Fidelity Prime)',
    nameEn: 'Jetour X70S',
    slug: 'fidelity-prime',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&auto=format&fit=crop&q=80',
    yearFrom: 1400,
    yearTo: 1404,
    bodyType: 'شاسی‌بلند',
    engineSummary: '1.5 لیتری توربو (156 اسب بخار)',
    transmissionSummary: '6 سرعته دو کلاچه DCT',
    description: 'شاسی‌بلند ۵ و ۷ نفره گروه بهمن با طراحی چشم‌نواز و فضای کابین بسیار جادار خانوادگی.',
    specifications: {
      engineCode: 'E4T15C',
      displacement: '1498 سی‌سی',
      horsepower: '156 اسب بخار',
      torque: '230 نیوتن‌متر',
      transmission: '6 سرعته دوکلاچه',
      fuelConsumption: '7.5 لیتر در 100 کیلومتر'
    },
    faq: [
      {
        q: 'کدام قطعات فیدلیتی با تیگو ۷ مشترک است؟',
        a: 'بسیاری از قطعات موتوری شامل شمع، تسمه‌ها، پمپ روغن، فیلترها و واترپمپ بین فیدلیتی پرایم و تیگو ۷ مشترک است.'
      }
    ]
  }
];

export const CATEGORIES: Category[] = [
  {
    id: 'cat-cooling',
    nameFa: 'سیستم خنک‌کننده',
    nameEn: 'Cooling System',
    slug: 'cooling',
    icon: 'Thermometer',
    imageUrl: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&auto=format&fit=crop&q=80',
    description: 'واتر پمپ، رادیاتور، ترموستات، فن، منبع انبساط، شیلنگ‌های آب و اویل کولر موتورهای چینی',
    subcategories: [
      { id: 'sub-water-pump', nameFa: 'واتر پمپ (Water Pump)', nameEn: 'Water Pump', slug: 'water-pump' },
      { id: 'sub-radiator', nameFa: 'رادیاتور آب موتور', nameEn: 'Engine Radiator', slug: 'engine-radiator' },
      { id: 'sub-thermostat', nameFa: 'ترموستات و هوزینگ', nameEn: 'Thermostat & Housing', slug: 'thermostat' },
      { id: 'sub-cooling-fan', nameFa: 'موتور فن و پروانه خنک‌کننده', nameEn: 'Cooling Fan', slug: 'cooling-fan' },
      { id: 'sub-expansion-tank', nameFa: 'منبع انبساط و درب رادیاتور', nameEn: 'Expansion Tank', slug: 'expansion-tank' },
      { id: 'sub-oil-cooler', nameFa: 'اویل کولر خنک‌کننده روغن', nameEn: 'Oil Cooler', slug: 'oil-cooler' }
    ]
  },
  {
    id: 'cat-engine',
    nameFa: 'موتور و متعلقات',
    nameEn: 'Engine & Components',
    slug: 'engine',
    icon: 'Cpu',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80',
    description: 'سرسیلندر، پیستون، رینگ، شاتون، میل‌لنگ، یاتاقان، واشر سرسیلندر، اویل پمپ و دسته موتور',
    subcategories: [
      { id: 'sub-cylinder-head', nameFa: 'سرسیلندر کامل و واشر سرسیلندر', nameEn: 'Cylinder Head', slug: 'cylinder-head' },
      { id: 'sub-pistons', nameFa: 'پیستون و رینگ موتور', nameEn: 'Pistons & Rings', slug: 'pistons' },
      { id: 'sub-oil-pump', nameFa: 'اویل پمپ (پمپ روغن موتور)', nameEn: 'Oil Pump', slug: 'oil-pump' },
      { id: 'sub-engine-mount', nameFa: 'دسته موتور و گیربکس', nameEn: 'Engine Mount', slug: 'engine-mount' },
      { id: 'sub-valves', nameFa: 'سوپاپ دود و هوا و میل سوپاپ', nameEn: 'Engine Valves', slug: 'valves' }
    ]
  },
  {
    id: 'cat-timing',
    nameFa: 'سیستم تایم',
    nameEn: 'Timing System',
    slug: 'timing',
    icon: 'Clock',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    description: 'کیت کامل زنجیر تایم، تسمه تایم، سفت‌کن، هرزگرد و چرخ‌دنده‌های تایمینگ VVT',
    subcategories: [
      { id: 'sub-timing-chain-kit', nameFa: 'کیت کامل زنجیر تایم', nameEn: 'Timing Chain Kit', slug: 'timing-chain-kit' },
      { id: 'sub-timing-belt', nameFa: 'تسمه تایم و تسمه دینام', nameEn: 'Timing Belts', slug: 'timing-belt' },
      { id: 'sub-timing-tensioner', nameFa: 'تسمه سفت‌کن و هرزگرد تایم', nameEn: 'Timing Tensioner', slug: 'timing-tensioner' },
      { id: 'sub-vvt-gear', nameFa: 'چرخ‌دنده VVT میل‌سوپاپ', nameEn: 'VVT Sprocket', slug: 'vvt-sprocket' }
    ]
  },
  {
    id: 'cat-brakes',
    nameFa: 'سیستم ترمز',
    nameEn: 'Brake System',
    slug: 'brakes',
    icon: 'Disc',
    imageUrl: 'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?w=800&auto=format&fit=crop&q=80',
    description: 'لنت ترمز سرامیکی، دیسک چرخ، کالیپر، پمپ ترمز، بوستر ترمز و سنسورهای سرعت چرخ ABS',
    subcategories: [
      { id: 'sub-front-brake-pads', nameFa: 'لنت ترمز چرخ جلو', nameEn: 'Front Brake Pads', slug: 'front-brake-pads' },
      { id: 'sub-rear-brake-pads', nameFa: 'لنت ترمز چرخ عقب', nameEn: 'Rear Brake Pads', slug: 'rear-brake-pads' },
      { id: 'sub-brake-rotors', nameFa: 'دیسک چرخ خنک‌شونده', nameEn: 'Brake Discs / Rotors', slug: 'brake-discs' },
      { id: 'sub-abs-sensor', nameFa: 'سنسور ABS و بلوک کنترل ترمز', nameEn: 'ABS Sensors', slug: 'abs-sensors' }
    ]
  },
  {
    id: 'cat-suspension',
    nameFa: 'جلوبندی و تعلیق',
    nameEn: 'Suspension & Steering',
    slug: 'suspension',
    icon: 'Shield',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80',
    description: 'کمک فنر، فنر لول، طبق بالا و پایین، سیبک طبق، میل موج‌گیر، بوش‌ها و توپی سرکمک',
    subcategories: [
      { id: 'sub-shock-absorbers', nameFa: 'کمک فنر جلو و عقب', nameEn: 'Shock Absorbers', slug: 'shock-absorbers' },
      { id: 'sub-control-arms', nameFa: 'طبق کامل و بوش‌های لاستیکی', nameEn: 'Control Arms', slug: 'control-arms' },
      { id: 'sub-sway-bar-links', nameFa: 'میل موج‌گیر و لاستیک چاکدار', nameEn: 'Sway Bar Links', slug: 'sway-bar-links' },
      { id: 'sub-wheel-hubs', nameFa: 'توپی چرخ و بلبرینگ چرخ', nameEn: 'Wheel Hubs', slug: 'wheel-hubs' }
    ]
  },
  {
    id: 'cat-transmission',
    nameFa: 'گیربکس و انتقال قدرت',
    nameEn: 'Transmission',
    slug: 'transmission',
    icon: 'Cog',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    description: 'ساعت گیربکس، شیرهای برقی، فیلتر روغن گیربکس CVT و DCT، کیت کلاچ و سنسورهای دور توربین',
    subcategories: [
      { id: 'sub-valve-body', nameFa: 'ساعت و شیر برقی گیربکس', nameEn: 'Valve Body & Solenoids', slug: 'valve-body' },
      { id: 'sub-trans-filters', nameFa: 'فیلتر گیربکس CVT / DCT', nameEn: 'Transmission Filters', slug: 'transmission-filter' },
      { id: 'sub-clutch-kit', nameFa: 'کیت کلاچ و دوکلاچه DCT', nameEn: 'Clutch Kits', slug: 'clutch-kits' },
      { id: 'sub-drive-axles', nameFa: 'پلوس و سرپلوس', nameEn: 'Drive Shafts', slug: 'drive-shafts' }
    ]
  },
  {
    id: 'cat-turbo',
    nameFa: 'توربو و مکش هوا',
    nameEn: 'Turbocharger & Intake',
    slug: 'turbo',
    icon: 'Zap',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    description: 'توربوشارژر کامل، کارتریج توربو، اینترکولر، دریچه گاز برقی، منیفولد هوا و لوله‌های بوست',
    subcategories: [
      { id: 'sub-turbochargers', nameFa: 'توربوشارژر کامل و کارتریج CHRA', nameEn: 'Turbochargers', slug: 'turbochargers' },
      { id: 'sub-intercoolers', nameFa: 'اینترکولر و لوله‌های سیلیکونی', nameEn: 'Intercoolers', slug: 'intercoolers' },
      { id: 'sub-throttle-bodies', nameFa: 'دریچه گاز برقی', nameEn: 'Throttle Bodies', slug: 'throttle-bodies' },
      { id: 'sub-map-sensors', nameFa: 'سنسور مپ و سنسور بوست', nameEn: 'MAP & Boost Sensors', slug: 'map-sensors' }
    ]
  },
  {
    id: 'cat-fuel',
    nameFa: 'سوخت‌رسانی و انژکتور',
    nameEn: 'Fuel System',
    slug: 'fuel',
    icon: 'Flame',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80',
    description: 'سوزن انژکتور پاشش مستقیم GDI، پمپ بنزین فشار قوی، ریل سوخت و رگلاتور',
    subcategories: [
      { id: 'sub-gdi-injectors', nameFa: 'سوزن انژکتور GDI', nameEn: 'Fuel Injectors', slug: 'injectors' },
      { id: 'sub-fuel-pump', nameFa: 'پمپ بنزین داخل باک و مغزی', nameEn: 'Fuel Pump', slug: 'fuel-pump' },
      { id: 'sub-hpfp', nameFa: 'پمپ بنزین فشار بالا (HPFP)', nameEn: 'High Pressure Fuel Pump', slug: 'hpfp' }
    ]
  },
  {
    id: 'cat-filters',
    nameFa: 'فیلترها و سرویس دوره‌ای',
    nameEn: 'Filters & Periodic Service',
    slug: 'filters',
    icon: 'Layers',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&auto=format&fit=crop&q=80',
    description: 'فیلتر روغن اورجینال، فیلتر هوا، فیلتر کابین کربن اکتیو، شمع‌های ایریدیوم و ضدیخ استاندارد',
    subcategories: [
      { id: 'sub-oil-filter', nameFa: 'فیلتر روغن موتور', nameEn: 'Oil Filter', slug: 'oil-filter' },
      { id: 'sub-air-filter', nameFa: 'فیلتر هوای موتور', nameEn: 'Air Filter', slug: 'air-filter' },
      { id: 'sub-cabin-filter', nameFa: 'فیلتر هوای اتاق (کابین)', nameEn: 'Cabin Filter', slug: 'cabin-filter' },
      { id: 'sub-spark-plugs', nameFa: 'شمع ایریدیوم سوزنی', nameEn: 'Spark Plugs', slug: 'spark-plugs' }
    ]
  },
  {
    id: 'cat-lighting',
    nameFa: 'روشنایی و چراغ',
    nameEn: 'Lighting & Headlights',
    slug: 'lighting',
    icon: 'Sun',
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    description: 'چراغ جلو Full LED، چراغ عقب پیوسته کریستالی، پروژکتور مه‌شکن و دیلایت',
    subcategories: [
      { id: 'sub-headlights', nameFa: 'چراغ جلو کریستالی LED', nameEn: 'Headlights', slug: 'headlights' },
      { id: 'sub-taillights', nameFa: 'چراغ خطر عقب و نئون پیوسته', nameEn: 'Taillights', slug: 'taillights' },
      { id: 'sub-fog-lights', nameFa: 'چراغ مه‌شکن و دیلایت سپر', nameEn: 'Fog Lights', slug: 'fog-lights' }
    ]
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-water-pump-kmc-j7',
    slug: 'water-pump-kmc-j7-genuine',
    sku: 'WP-JAC-1026040',
    oemNumber: '1026040GH010',
    partNumber: 'JAC-1026040GH010',
    nameFa: 'واتر پمپ اصلی شرکتی KMC J7 و جک S5 فیس‌لیفت ۱.۵ توربو',
    nameEn: 'Original Water Pump KMC J7 & JAC S5 1.5 TGDI',
    categorySlug: 'cooling',
    subcategorySlug: 'water-pump',
    brandManufacturer: 'KMC / JAC Genuine Parts',
    grade: 'genuine',
    price: 3850000,
    discountPrice: 3490000,
    stock: 14,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 28,
    weightKg: 1.45,
    dimensionsCm: '18 x 14 x 12',
    countryOfOrigin: 'چین (خط تولید اصلی کرمان موتور / جی‌ای‌سی)',
    warrantyMonths: 12,
    warrantyDescription: '۱۲ ماه ضمانت بی قید و شرط تعویض در صورت نشتی یا خرابی پروانه',
    placement: 'بخش جلویی بلوک سیلندر، سیستم خنک‌کاری موتور',
    isFeatured: true,
    isBestSeller: true,
    description: `واتر پمپ شرکتی KMC J7 مستقیماً از خط تولید تامین شده و دارای پروانه‌های آلیاژی تقویت‌شده مقاوم در برابر خوردگی کاویتاسیون است. آب‌بندی سیل مکانیکی این قطعه از فیبر کربن سیلیکونی پیشرفته ساخته شده که دوام آن را در برابر دمای بالای موتورهای پرشتاب توربو TGDI تضمین می‌نماید. همراه این قطعه، واشر آب‌بندی متالیک اورجینال کارخانه ارسال می‌گردد.`,
    technicalSpecs: {
      'کد فنی کارخانه': '1026040GH010',
      'نوع پروانه': 'آلیاژ چدن گرافیتی ضد خوردگی ضد زنگ',
      'نوع آب‌بند (سیل)': 'مکانیکی دوبل سیلیکون کارباید',
      'فولی پمپ': '۵ شیار دقیق بالانس شده',
      'واشر همراه': 'واشر چندلایه استیل با پوشش لاستیکی NBR',
      'دمای کاری استاندارد': '-40 الی +135 درجه سانتی‌گراد'
    },
    symptomsOfFailure: [
      'نشتی قطرات ضدیخ و مایع خنک‌کننده از سوراخ آبریز (Weep Hole) زیر پمپ',
      'صدای زوزه یا خرخر با بالا رفتن دور موتور ناشی از خرابی بلبرینگ داخلی',
      'افزایش غیرعادی آمپر آب خودرو به خصوص در ترافیک یا زیر بار بوست توربو',
      'لقی و بازی محسوس پولی واتر پمپ هنگام باز کردن تسمه دینام'
    ],
    replacementInterval: 'هر ۶۰,۰۰۰ الی ۸۰,۰۰۰ کیلومتر یا همزمان با تعویض تسمه محرک',
    installationTips: [
      'قبل از نصب، مدار خنک‌کاری را کاملاً با آب مقطر شستشو دهید تا براده‌های اکسید از سیستم خارج شوند.',
      'هرگز از چسب مزدا یا چسب سیلیکون بیش از حد روی واشر استفاده نکنید؛ زیرا تکه‌های چسب ممکن است کانال ترموستات را مسدود کنند.',
      'پیچ‌های واترپمپ را به صورت ضربدری با گشتاور استاندارد ۹ تا ۱۱ نیوتن‌متر محکم کنید.'
    ],
    genuineVsFakeNotes: 'نمونه شرکتی دارای لوگوی برجسته JAC/KMC روی بدنه آلومینیومی، کد بارکد لیزری خوانا و جعبه قرمز رنگ مهر و موم شده کرمان موتور است. در نمونه‌های فیک، پروانه از پلاستیک بازیافتی با لبه‌های ناصاف ساخته شده که در دمای بالای ۹۰ درجه دفرمه می‌شود.',
    fitments: [
      {
        id: 'fit-1',
        brandId: 'kmc',
        brandName: 'کی‌ام‌سی (KMC)',
        modelId: 'kmc-j7',
        modelName: 'KMC J7',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 Turbo TGDI (HFC4GC1.6E)',
        notes: 'کاملاً فابریک و منطبق بر استاندارد کارخانه'
      },
      {
        id: 'fit-2',
        brandId: 'jac',
        brandName: 'جک (JAC)',
        modelId: 'jac-s5',
        modelName: 'JAC S5 فیس‌لیفت توربو GDI',
        yearFrom: 1400,
        yearTo: 1402,
        engine: '1.5 TGDI',
        notes: 'فقط مناسب مدل‌های فیس‌لیفت ۱۵۰۰ توربو (روی ۲۰۰۰ توربو قدیمی نصب نمی‌شود)'
      }
    ],
    complementPartIds: ['prod-thermostat-kmc-j7', 'prod-coolant-premium', 'prod-oil-filter-kmc-j7'],
    relatedPartIds: ['prod-oil-filter-kmc-j7', 'prod-brake-pads-j7-front', 'prod-spark-plugs-turbo']
  },
  {
    id: 'prod-thermostat-kmc-j7',
    slug: 'thermostat-kmc-j7-82c',
    sku: 'TH-KMC-82',
    oemNumber: '1026070GH010',
    partNumber: 'JAC-1026070GH010',
    nameFa: 'ترموستات ۸۲ درجه اورجینال KMC J7 و جک S5 فیس‌لیفت به همراه واشر',
    nameEn: 'OEM Thermostat 82°C KMC J7 & JAC S5 1.5T',
    categorySlug: 'cooling',
    subcategorySlug: 'thermostat',
    brandManufacturer: 'Wahler OEM / JAC',
    grade: 'genuine',
    price: 1250000,
    stock: 22,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewsCount: 15,
    weightKg: 0.28,
    dimensionsCm: '10 x 8 x 8',
    countryOfOrigin: 'چین (اصلی شرکتی)',
    warrantyMonths: 12,
    warrantyDescription: 'ضمانت عملکرد دمای باز شدن دقیق ۸۲ درجه سانتی‌گراد',
    placement: 'داخل محفظه هوزینگ خروجی آب سیلندر',
    description: 'ترموستات اورجینال ۸۲ درجه سانتی‌گراد تضمین‌کننده باز و بسته شدن دقیق مسیر گردش مایع خنک‌کننده به سمت رادیاتور، پیشگیری از داغ شدن موتور توربو و تنظیم بهینه دمای عملکرد موتور.',
    technicalSpecs: {
      'دمای باز شدن کامل': '۸۲ درجه سانتی‌گراد',
      'جنس کپسول حرارتی': 'مس ضد زنگ با موم حرارتی حساس آلمانی',
      'واشر همراه': 'واشر دور لاستیکی سیلیکونی مقاوم به ضدیخ'
    },
    symptomsOfFailure: [
      'بالا نرفتن دمای آب در زمستان و سرد ماندن بخاری (قفل در حالت باز)',
      'جوش آوردن ناگهانی موتور در رانندگی عادی (قفل در حالت بسته)'
    ],
    replacementInterval: 'هر ۵۰,۰۰۰ کیلومتر یا در صورت تعویض واترپمپ',
    installationTips: ['سوپاپ تخلیه هوای کوچک روی ترموستات باید رو به بالا قرار گیرد.'],
    genuineVsFakeNotes: 'دارای حک لیزری عدد 82C و هولوگرام رسمی روی بدنه برنجی.',
    fitments: [
      {
        id: 'fit-th-1',
        brandId: 'kmc',
        brandName: 'کی‌ام‌سی (KMC)',
        modelId: 'kmc-j7',
        modelName: 'KMC J7',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 TGDI'
      },
      {
        id: 'fit-th-2',
        brandId: 'jac',
        brandName: 'جک (JAC)',
        modelId: 'jac-s5',
        modelName: 'JAC S5 فیس‌لیفت',
        yearFrom: 1400,
        yearTo: 1402,
        engine: '1.5 TGDI'
      }
    ],
    complementPartIds: ['prod-water-pump-kmc-j7', 'prod-coolant-premium']
  },
  {
    id: 'prod-coolant-premium',
    slug: 'coolant-antifreeze-valvoline-chinese-cars',
    sku: 'CL-OAT-5L',
    oemNumber: 'OAT-RED-50/50',
    partNumber: 'COOLANT-5L-RED',
    nameFa: 'مایع ضدیخ و ضدجوش مخصوص موتورهای آلومینیومی توربو (۵ لیتر آماده مصرف قرمز)',
    nameEn: 'Premium OAT Red Antifreeze / Coolant 50/50 5L',
    categorySlug: 'cooling',
    subcategorySlug: 'thermostat',
    brandManufacturer: 'Total / OEM Spec',
    grade: 'oem',
    price: 890000,
    stock: 45,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 39,
    weightKg: 5.2,
    dimensionsCm: '25 x 18 x 12',
    countryOfOrigin: 'فرانسه / فرمولاسیون OAT آلمان',
    warrantyMonths: 24,
    warrantyDescription: '۲ سال دوام و محافظت در برابر رسوب و زنگ‌زدگی',
    placement: 'کل مدار خنک‌کننده موتور و رادیاتور',
    isMaintenancePart: true,
    description: 'مایع ضدیخ و ضدجوش بر پایه فناوری اسید آلی (OAT) بدون نیتریت و سیلیکات، سازگار ۱۰۰٪ با بلوک‌های آلومینیومی و توربوشارژرهای خودروهای چینی از جمله KMC، چری، ام‌وی‌ام و لاماری.',
    technicalSpecs: {
      'نقطه انجماد': '-38 درجه سانتی‌گراد',
      'نقطه جوش تحت فشار': '+132 درجه سانتی‌گراد',
      'فناوری': 'Organic Acid Technology (OAT)'
    },
    symptomsOfFailure: ['قهوه‌ای شدن رنگ آب رادیاتور', 'تشکیل رسوبات شیری یا لجنی در منبع انبساط'],
    replacementInterval: 'هر ۲ سال یا ۴۰,۰۰۰ کیلومتر',
    installationTips: ['قبل از پر کردن، سیستم خنک‌کاری باید کاملاً هواگیری شود.'],
    genuineVsFakeNotes: 'محصول با درب پلمپ و برچسب اصالت بارکددار عرضه می‌شود.',
    fitments: [
      {
        id: 'fit-cl-all',
        brandId: 'kmc',
        brandName: 'همه برندهای چینی',
        modelId: 'all',
        modelName: 'تمام مدل‌های چینی توربو و تنفس طبیعی',
        yearFrom: 1390,
        yearTo: 1404,
        engine: 'تمامی پیشرانه‌های ۱.۵، ۱.۶ و ۲.۰ لیتری'
      }
    ]
  },
  {
    id: 'prod-water-pump-tiggo7',
    slug: 'water-pump-chery-tiggo7-arrizo6-genuine',
    sku: 'WP-CHERY-481H',
    oemNumber: '481H-1307010',
    partNumber: 'CHERY-481H-1307010',
    nameFa: 'واتر پمپ شرکتی چری تیگو ۷، آریزو ۵ توربو و ام‌وی‌ام X55 Pro',
    nameEn: 'Genuine Water Pump Chery Tiggo 7 & MVM X55 Pro',
    categorySlug: 'cooling',
    subcategorySlug: 'water-pump',
    brandManufacturer: 'Chery Genuine Parts',
    grade: 'genuine',
    price: 3200000,
    stock: 18,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewsCount: 34,
    weightKg: 1.3,
    dimensionsCm: '17 x 15 x 11',
    countryOfOrigin: 'چین (اصلی مدیران خودرو)',
    warrantyMonths: 12,
    warrantyDescription: 'گارانتی رسمی اصالت و عدم نشتی آب',
    placement: 'بلوک سیلندر سمت شاگرد، زیر قاب تسمه',
    isBestSeller: true,
    description: 'واتر پمپ اصلی چری با هولوگرام لیزری مدیران خودرو مخصوص موتورهای ۱.۵ لیتری توربو چری (کد موتور ACTECO SQRE4T15C). تضمین جریان یکنواخت مایع خنک‌کننده به سرسیلندر و هسته توربوشارژر.',
    technicalSpecs: {
      'پارت نامبر': '481H-1307010',
      'کد موتور سازگار': 'SQRE4T15B / SQRE4T15C',
      'نوع بلبرینگ': 'بلبرینگ دوربالای دوردیفه مهروموم شده'
    },
    symptomsOfFailure: ['جوش آوردن خودرو در سربالایی‌ها', 'نشتی از محفظه بلبرینگ', 'تولید صدای زوزه شبیه به دینام'],
    replacementInterval: 'هر ۷۰,۰۰۰ کیلومتر',
    installationTips: ['سطح سینی و جایگاه پیچ‌ها را قبل از قرار دادن واشر نو کاملاً تمیز کنید.'],
    genuineVsFakeNotes: 'پکینگ مدیران خودرو با لیبل امنیتی اسکن‌شونده و بارکد اختصاصی.',
    fitments: [
      {
        id: 'fit-t7-1',
        brandId: 'chery',
        brandName: 'چری (Chery)',
        modelId: 'chery-tiggo7-pro',
        modelName: 'تیگو ۷ و تیگو ۷ پرو',
        yearFrom: 1397,
        yearTo: 1404,
        engine: '1.5 Turbo (SQRE4T15)'
      },
      {
        id: 'fit-t7-2',
        brandId: 'mvm',
        brandName: 'ام‌وی‌ام (MVM)',
        modelId: 'mvm-x55-pro',
        modelName: 'MVM X55 و X55 Pro',
        yearFrom: 1399,
        yearTo: 1404,
        engine: '1.5 Turbo'
      },
      {
        id: 'fit-t7-3',
        brandId: 'jetour',
        brandName: 'جتور (Jetour)',
        modelId: 'jetour-fidelity',
        modelName: 'فیدلیتی پرایم (Fidelity Prime)',
        yearFrom: 1400,
        yearTo: 1404,
        engine: '1.5 Turbo'
      }
    ],
    complementPartIds: ['prod-coolant-premium']
  },
  {
    id: 'prod-brake-pads-j7-front',
    slug: 'front-ceramic-brake-pads-kmc-j7',
    sku: 'BP-J7-FRT',
    oemNumber: '3501110U7001',
    partNumber: 'HI-Q-SP4192',
    nameFa: 'لنت ترمز چرخ جلو سرامیکی های‌کیو (Hi-Q) گلد مخصوص KMC J7',
    nameEn: 'Hi-Q Gold Ceramic Front Brake Pads KMC J7',
    categorySlug: 'brakes',
    subcategorySlug: 'front-brake-pads',
    brandManufacturer: 'Hi-Q Sangsin Brake Korea',
    grade: 'oem',
    price: 2450000,
    discountPrice: 2190000,
    stock: 25,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1600792536787-b9f848780233?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 42,
    weightKg: 1.85,
    dimensionsCm: '16 x 6.5 x 1.8',
    countryOfOrigin: 'کره جنوبی (اورجینال Sangsin)',
    warrantyMonths: 6,
    warrantyDescription: 'ضمانت تعویض در صورت تولید سوت، لرزش یا کاهش توان ترمزگیری',
    placement: 'چرخ‌های جلو - کالیپر چپ و راست',
    isFeatured: true,
    isBestSeller: true,
    isMaintenancePart: true,
    description: 'لنت ترمز پریمیوم سرامیکی های‌کیو کره‌ای با فرمولاسیون کاهش گرده لنت و حرارت. این لنت در ترمزگیری‌های پیاپی بزرگراهی عملکرد خود را از دست نمی‌دهد (Fade-Free) و مانع از لبه‌انداختن و خط افتادن روی دیسک چرخ KMC J7 می‌شود.',
    technicalSpecs: {
      'جنس پد': 'سرامیک تقویت‌شده با الیاف مس بدون آزبست',
      'ضخامت گوشت لنت': '۱۷.۵ میلی‌متر',
      'دارای خار اخطار': 'بله، مجهز به هشداردهنده صوتی مکانیکی اتمام لنت',
      'صفحه عایق صدا (Shim)': 'دارای شیم ۳ لایه ضد نویز'
    },
    symptomsOfFailure: [
      'صدای سوت ممتد فلز روی فلز هنگام ترمزگیری',
      'کشیده شدن فرمان به یک سمت در زمان فشردن پدال ترمز',
      'پایین رفتن غیرعادی سطح روغن ترمز در مخزن به دلیل نازک شدن گوشت لنت'
    ],
    replacementInterval: 'هر ۲۵,۰۰۰ الی ۳۵,۰۰۰ کیلومتر بر اساس سبک رانندگی',
    installationTips: [
      'پین‌های کالیپر ترمز را حتماً با گریس نسوز سیلیکونی گریس‌کاری کنید.',
      'در ۱۰۰ کیلومتر ابتدایی از ترمزهای ناگهانی شدید خودداری فرمایید تا لنت به اصطلاح آب‌بندی (Bedding-in) شود.'
    ],
    genuineVsFakeNotes: 'پشت پدهای اصلی عبارت Sangsin Korea با فونت برجسته و شماره سریال فنی هک شده است و دارای برچسب هولوگرام اصالت کالا می‌باشد.',
    fitments: [
      {
        id: 'fit-bp-1',
        brandId: 'kmc',
        brandName: 'کی‌ام‌سی (KMC)',
        modelId: 'kmc-j7',
        modelName: 'KMC J7',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 Turbo TGDI',
        notes: 'فیتمنت صد در صد تضمین شده چرخ جلو'
      }
    ],
    complementPartIds: ['prod-oil-filter-kmc-j7']
  },
  {
    id: 'prod-oil-filter-kmc-j7',
    slug: 'oil-filter-kmc-j7-s5-genuine',
    sku: 'FL-JAC-1017100',
    oemNumber: '1017100GH010',
    partNumber: 'JAC-1017100GH010',
    nameFa: 'فیلتر روغن اصلی شرکتی KMC J7، جک S5 فیس‌لیفت و KMC K7',
    nameEn: 'Genuine Engine Oil Filter KMC J7 & K7',
    categorySlug: 'filters',
    subcategorySlug: 'oil-filter',
    brandManufacturer: 'KMC Genuine / Mann Filter OEM',
    grade: 'genuine',
    price: 390000,
    stock: 65,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 68,
    weightKg: 0.35,
    dimensionsCm: '8 x 8 x 9',
    countryOfOrigin: 'چین (اصلی شرکتی کرمان موتور)',
    warrantyMonths: 6,
    warrantyDescription: 'ضمانت حفظ فشار اویل پمپ و عدم پارگی کاغذ فیلتر',
    placement: 'پایین بلوک موتور جنب کارتل روغن',
    isBestSeller: true,
    isMaintenancePart: true,
    description: 'فیلتر روغن اورجینال مجهز به سوپاپ اطمینان بای‌پس دوبل و کاغذ سلولزی تقویت‌شده با الیاف نانو. مانع از عبور ریزترین براده‌های آهن به سمت یاتاقان‌ها و شفت حساس توربوشارژر خودروهای مدرن TGDI.',
    technicalSpecs: {
      'رزوه': 'M20 x 1.5',
      'فشار باز شدن سوپاپ بای‌پس': '1.2 بار',
      'سوپاپ مانع تخلیه (Anti-drainback)': 'سیلیکون قرمز ارتجاعی',
      'راندمان فیلتراسیون': '۹۹.۲٪ ذرات بالای ۲۰ میکرون'
    },
    symptomsOfFailure: ['روشن ماندن چراغ روغن برای چند ثانیه پس از استارت سرد', 'تولید صدای استکان تایپیت‌ها به دلیل افت فشار روغن'],
    replacementInterval: 'در هر بار تعویض روغن موتور (هر ۵,۰۰۰ کیلومتر)',
    installationTips: ['قبل از بستن، واشر لاستیکی فیلتر را با کمی روغن تمیز چرب کنید و آن را فقط با دست سفت نمایید (نیازی به آچار کشی سنگین نیست).'],
    genuineVsFakeNotes: 'فیلتر تقلبی دارای سوپاپ پلاستیکی نامرغوب است که در فشار بالا خرد شده و یاتاقان زدن موتور را در پی دارد.',
    fitments: [
      {
        id: 'fit-fl-1',
        brandId: 'kmc',
        brandName: 'کی‌ام‌سی (KMC)',
        modelId: 'kmc-j7',
        modelName: 'KMC J7',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 Turbo TGDI'
      },
      {
        id: 'fit-fl-2',
        brandId: 'jac',
        brandName: 'جک (JAC)',
        modelId: 'jac-s5',
        modelName: 'جک S5 نیوفیس 1.5 TGDI',
        yearFrom: 1400,
        yearTo: 1402,
        engine: '1.5 Turbo'
      }
    ],
    complementPartIds: ['prod-water-pump-kmc-j7', 'prod-spark-plugs-turbo']
  },
  {
    id: 'prod-spark-plugs-turbo',
    slug: 'ngk-laser-iridium-spark-plugs-chinese-turbo',
    sku: 'SP-NGK-SILZKR7B11',
    oemNumber: 'SILZKR7B11',
    partNumber: 'NGK-9723',
    nameFa: 'کیت ۴ عددی شمع سوزنی لیزر ایریدیوم NGK ژاپن مخصوص خودروهای توربو چینی',
    nameEn: 'NGK Laser Iridium Spark Plugs Set of 4 (GDI Turbo Engines)',
    categorySlug: 'filters',
    subcategorySlug: 'spark-plugs',
    brandManufacturer: 'NGK Spark Plugs Japan',
    grade: 'oem',
    price: 3600000,
    discountPrice: 3250000,
    stock: 20,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 51,
    weightKg: 0.22,
    dimensionsCm: '10 x 9 x 3',
    countryOfOrigin: 'ژاپن (اصل ۱۰۰٪ تضمینی)',
    warrantyMonths: 12,
    warrantyDescription: 'ضمانت عملکرد و عدم جرقه زدن هرز تا ۶۰ هزار کیلومتر',
    placement: 'روی سرسیلندر - زیر کوئل‌های اشتعال',
    isFeatured: true,
    isBestSeller: true,
    isMaintenancePart: true,
    description: 'شمع‌های لیزر ایریدیوم اورجینال NGK با الکترود مرکزی ایریدیوم فوق‌نازک ۰.۶ میلی‌متری و پد پلاتینیومی الکترود منفی. طراحی شده برای احتراق بهینه، کاهش ناک، شتاب‌گیری پایدار و محافظت از پیستون در برابر سوخت‌های با اکتان متغیر.',
    technicalSpecs: {
      'کد حرارتی': '7 (شمع نسبتاً سرد مناسب توربو)',
      'سایز آچار': '16 میلی‌متر',
      'فیلر (گپ)': '0.8 میلی‌متر دقیق',
      'جنس الکترود مرکزی': 'لیزر ایریدیوم خالص',
      'طول عمر مفید': '۶۰,۰۰۰ الی ۸۰,۰۰۰ کیلومتر'
    },
    symptomsOfFailure: ['کپ کردن و ریپ زدن در هنگام شتاب‌گیری ناگهانی', 'کاهش توان و افزایش محسوس مصرف سوخت', 'لرزش موتور در دور آرام درجا'],
    replacementInterval: 'هر ۴۰,۰۰۰ الی ۵۰,۰۰۰ کیلومتر در بنزین‌های داخلی',
    installationTips: ['با آچار تورک‌متر روی گشتاور ۲۵ نیوتن‌متر بسته شود.'],
    genuineVsFakeNotes: 'پودر عایق در محل اتصال مهره، واشر پرس شده تخت و مقاومت اهمی دقیق ۴ الی ۵ کیلواهم نشانه‌های اصالت این محصول ژاپنی هستند.',
    fitments: [
      {
        id: 'fit-sp-1',
        brandId: 'kmc',
        brandName: 'کی‌ام‌سی (KMC)',
        modelId: 'kmc-j7',
        modelName: 'KMC J7',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 Turbo TGDI'
      },
      {
        id: 'fit-sp-2',
        brandId: 'chery',
        brandName: 'چری (Chery)',
        modelId: 'chery-tiggo7-pro',
        modelName: 'چری تیگو ۷ پرو و آریزو ۶',
        yearFrom: 1399,
        yearTo: 1404,
        engine: '1.5 Turbo'
      },
      {
        id: 'fit-sp-3',
        brandId: 'fownix',
        brandName: 'فونیکس (Fownix)',
        modelId: 'fownix-fx',
        modelName: 'فونیکس FX و تیگو ۸ پرو',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.6 TGDI'
      },
      {
        id: 'fit-sp-4',
        brandId: 'lamari',
        brandName: 'لاماری (Lamari)',
        modelId: 'lamari-eama',
        modelName: 'لاماری ایما Eama',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 TGDI Mitsubishi'
      }
    ],
    complementPartIds: ['prod-oil-filter-kmc-j7']
  },
  {
    id: 'prod-timing-chain-tiggo8',
    slug: 'timing-chain-kit-chery-tiggo8-fownix-fx',
    sku: 'TC-CHERY-1.6T',
    oemNumber: 'SQRF4J16-1021000',
    partNumber: 'CHERY-SQRF4J16',
    nameFa: 'کیت کامل زنجیر تایم شرکتی چری تیگو ۸ پرو و فونیکس FX موتور ۱.۶ TGDI',
    nameEn: 'Complete Timing Chain Kit Chery Tiggo 8 Pro & Fownix FX',
    categorySlug: 'timing',
    subcategorySlug: 'timing-chain-kit',
    brandManufacturer: 'Chery Genuine / BorgWarner OEM',
    grade: 'genuine',
    price: 8400000,
    stock: 9,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewsCount: 19,
    weightKg: 3.2,
    dimensionsCm: '30 x 20 x 8',
    countryOfOrigin: 'چین (اصلی شرکتی کانتزیری)',
    warrantyMonths: 18,
    warrantyDescription: '۱۸ ماه ضمانت کارکرد بدون صدا و عدم رد کردن دندانه تایم',
    placement: 'درون محفظه جلوی سیلندر، پشت درپوش زنجیر تایم',
    isFeatured: true,
    description: 'کیت کامل زنجیر تایم شامل زنجیر اصلی، سفت‌کن هیدرولیکی (تنسینر)، دو عدد ریل راهنما و چرخ‌دنده‌های سر میل‌لنگ و میل‌سوپاپ. ساخت کمپانی بورگ‌وارنر تحت لیسانس چری اتومبیل.',
    technicalSpecs: {
      'تعداد دندانه‌های زنجیر': '142 لینک تقویت‌شده سایلنت',
      'فشار کاری سفت‌کن': 'هیدرولیک روغن تحت فشار موتور',
      'جنس ریل‌های راهنما': 'پلیمر نسوز تقویت‌شده با فیبر تفلون'
    },
    symptomsOfFailure: ['صدای خش‌خش یا تق‌تق فلزی از سمت راننده در زمان استارت سرد', 'خطای سنسور میل‌سوپاپ به دلیل کش‌آمدن زنجیر (Timing Misalignment)'],
    replacementInterval: 'هر ۱۰۰,۰۰۰ الی ۱۲۰,۰۰۰ کیلومتر',
    installationTips: ['تنظیم تایمینگ باید دقیقاً با پین‌های قفل‌کننده میل‌سوپاپ انجام شود.'],
    genuineVsFakeNotes: 'حک برند چری روی تمامی پیوندهای زنجیر و سریال هماهنگ سفت‌کن هیدرولیک.',
    fitments: [
      {
        id: 'fit-tc-1',
        brandId: 'chery',
        brandName: 'چری (Chery)',
        modelId: 'chery-tiggo8-pro',
        modelName: 'تیگو ۸ پرو',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.6 TGDI (SQRF4J16)'
      },
      {
        id: 'fit-tc-2',
        brandId: 'fownix',
        brandName: 'فونیکس (Fownix)',
        modelId: 'fownix-fx',
        modelName: 'فونیکس FX پریمیوم',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.6 TGDI'
      }
    ]
  },
  {
    id: 'prod-turbocharger-tiggo8',
    slug: 'genuine-turbocharger-chery-tiggo8-fownix-fx',
    sku: 'TB-CHERY-1.6T',
    oemNumber: '201000185AA',
    partNumber: 'GARRETT-GT15',
    nameFa: 'توربوشارژر کامل گرت اورجینال تیگو ۸ پرو و فونیکس FX به همراه وست‌گیت برقی',
    nameEn: 'Original Garrett Turbocharger Chery Tiggo 8 Pro & Fownix FX',
    categorySlug: 'turbo',
    subcategorySlug: 'turbochargers',
    brandManufacturer: 'Garrett Motion / Chery Original',
    grade: 'genuine',
    price: 39500000,
    discountPrice: 37800000,
    stock: 4,
    stockStatus: 'low_stock',
    images: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 11,
    weightKg: 7.8,
    dimensionsCm: '28 x 26 x 22',
    countryOfOrigin: 'فرانسه / ساخت خط Garrett چین تحت کنترل کیفیت',
    warrantyMonths: 12,
    warrantyDescription: '۱۲ ماه ضمانت شفت و پروانه‌ها در صورت استفاده از روغن استاندارد',
    placement: 'متصل به منیفولد دود اگزوز در پشت موتور',
    description: 'توربوشارژر فابریک کمپانی گرت با پره‌های کمپرسور فورج‌شده تیتانیومی و عملگر برقی الکترونیکی (Electronic Wastegate Actuator). این سیستم بوست پایدار ۱.۵ باری را حتی در دورهای پایین فراهم می‌آورد.',
    technicalSpecs: {
      'نوع توربو': 'Twin-Scroll با اینرسی فوق‌العاده پایین',
      'حداکثر دور توربین': '220,000 RPM',
      'عملگر': 'الکترونیکی استپرموتور دقیق با سنسور موقعیت',
      'خنک‌کاری': 'گردش آب و روغن همزمان (Water & Oil Cooled)'
    },
    symptomsOfFailure: ['خروج دود آبی از اگزوز به دلیل نشت روغن از کارتریج', 'افت ناگهانی شتاب و روشن شدن چراغ چک همراه با خطای کمبود بوست (Underboost)', 'صدای سوت تیز یا صدای کشیده شدن پروانه به پوسته حلزونی'],
    replacementInterval: 'قطعه مادام‌العمر در صورت رعایت خنک‌کاری و تعویض به موقع روغن',
    installationTips: ['قبل از اولین استارت، کارتریج توربو را از مجرای ورودی روغن کاملاً با سرنگ پر از روغن کنید تا شفت در دور اولیه خشک نچرخد.'],
    genuineVsFakeNotes: 'دارای پلاک فلزی پرچ شده با سریال نامبر یکتا و کد کیوآر اختصاصی Garrett.',
    fitments: [
      {
        id: 'fit-tb-1',
        brandId: 'chery',
        brandName: 'چری (Chery)',
        modelId: 'chery-tiggo8-pro',
        modelName: 'تیگو ۸ پرو',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.6 TGDI'
      },
      {
        id: 'fit-tb-2',
        brandId: 'fownix',
        brandName: 'فونیکس (Fownix)',
        modelId: 'fownix-fx',
        modelName: 'فونیکس FX',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.6 TGDI'
      }
    ],
    complementPartIds: ['prod-spark-plugs-turbo']
  },
  {
    id: 'prod-shock-absorber-lamari',
    slug: 'front-left-shock-absorber-lamari-eama',
    sku: 'SA-LAMARI-FL',
    oemNumber: '2901110-M01',
    partNumber: 'MANDO-LAMARI-FL',
    nameFa: 'کمک فنر جلو چپ اورجینال لاماری ایما (Lamari Eama)',
    nameEn: 'Front Left Shock Absorber Lamari Eama',
    categorySlug: 'suspension',
    subcategorySlug: 'shock-absorbers',
    brandManufacturer: 'Mando / Dongfeng OEM',
    grade: 'genuine',
    price: 4950000,
    stock: 8,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 4.7,
    reviewsCount: 14,
    weightKg: 4.9,
    dimensionsCm: '55 x 16 x 16',
    countryOfOrigin: 'چین (اصلی شرکتی آرین پارس موتور)',
    warrantyMonths: 12,
    warrantyDescription: '۱۲ ماه گارانتی عدم روغن‌زدگی و نرمی جذب ضربات',
    placement: 'محور جلو سمت چپ (راننده)',
    description: 'کمک فنر گازی-روغنی تلسکوپی اورجینال لاماری ایما ساخته شده توسط ماندو. ارائه پایداری بی‌نظیر در پیچ‌ها و سواری نرم و بدون کوبش در دست‌اندازهای شهری.',
    technicalSpecs: {
      'نوع کمک': 'دو جداره گازی با گاز نیتروژن پرفشار',
      'قطر پیستون شفت': '22 میلی‌متر کروم سخت آبکاری شده'
    },
    symptomsOfFailure: ['روغن‌زدگی روی بدنه کمک فنر', 'کوبش شدید در عبور از دست‌اندازها', 'گیج زدن خودرو و متمایل شدن به بیرون پیچ'],
    replacementInterval: 'هر ۸۰,۰۰۰ کیلومتر (توصیه می‌شود جفتی چپ و راست تعویض شوند)',
    installationTips: ['حتماً قبل از بستن فنر لول، کمک فنر را ۲ الی ۳ بار به آرامی با دست باز و بسته کنید تا گاز و روغن یکنواخت شوند.'],
    genuineVsFakeNotes: 'دارای هولوگرام طلایی آرین پارس موتور و بست‌های فابریک سنسور ABS و لوله ترمز.',
    fitments: [
      {
        id: 'fit-lam-1',
        brandId: 'lamari',
        brandName: 'لاماری (Lamari)',
        modelId: 'lamari-eama',
        modelName: 'لاماری ایما Eama',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 TGDI'
      }
    ]
  },
  {
    id: 'prod-headlight-kmc-j7-right',
    slug: 'right-led-headlight-kmc-j7',
    sku: 'HL-J7-RH',
    oemNumber: '4121200U7001',
    partNumber: 'KMC-4121200U7001',
    nameFa: 'چراغ جلو سمت راست کامل Full LED اورجینال KMC J7',
    nameEn: 'Original Full LED Right Headlight KMC J7',
    categorySlug: 'lighting',
    subcategorySlug: 'headlights',
    brandManufacturer: 'Hasco / KMC Genuine',
    grade: 'genuine',
    price: 18900000,
    stock: 5,
    stockStatus: 'in_stock',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'
    ],
    rating: 5.0,
    reviewsCount: 8,
    weightKg: 4.1,
    dimensionsCm: '62 x 34 x 26',
    countryOfOrigin: 'چین (اصلی خط تولید کرمان موتور)',
    warrantyMonths: 12,
    warrantyDescription: 'گارانتی عدم مات شدن طلق پلی‌کربنات و سوختگی لنزهای LED',
    placement: 'جلو سمت راست (سمت شاگرد)',
    description: 'چراغ جلو تمام ال‌ای‌دی شرکتی KMC J7 با لنزهای پروژکتوری دوبل، دیلایت خطی پیوسته و راهنمای موشن پویا. طلق ساخته شده از پلی‌کربنات مجهز به پوشش ضد اشعه ماوراء بنفش (Anti-UV).',
    technicalSpecs: {
      'فناوری نور': 'Full LED با چیپ‌های تایوانی OSRAM Spec',
      'میزان روشنایی': '3200 لومن نور پایین / 4800 لومن نور بالا',
      'موتور تنظیم ارتفاع نور': 'مجهز به موتور فابریک برقی داخلی'
    },
    symptomsOfFailure: ['شکستگی طلق بر اثر ضربه تصادف', 'نفوذ بخار و آب به داخل چراغ به دلیل آسیب به درزگیر سیلیکونی', 'سوختن برد درایور ال‌ای‌دی'],
    replacementInterval: 'در صورت شکستگی فیزیکی یا خرابی درایور',
    installationTips: ['کانکتور برقی را بدون وارد کردن فشار به خارها جا بزنید و پایه‌های چراغ را بیش از حد سفت نکنید.'],
    genuineVsFakeNotes: 'پشت کاسه چراغ دارای نشان تجاری حک شده JAC MOTORS و لیبل کنترل کیفیت سبز رنگ کارخانه است.',
    fitments: [
      {
        id: 'fit-hl-1',
        brandId: 'kmc',
        brandName: 'کی‌ام‌سی (KMC)',
        modelId: 'kmc-j7',
        modelName: 'KMC J7',
        yearFrom: 1401,
        yearTo: 1404,
        engine: '1.5 Turbo TGDI'
      }
    ]
  }
];

export const ARTICLES: Article[] = [
  {
    id: 'art-kmc-j7-waterpump-guide',
    slug: 'kmc-j7-water-pump-failure-symptoms-guide',
    title: 'علائم خرابی واتر پمپ KMC J7 و راهنمای جامع تعویض دوره ای',
    summary: 'چگونه علائم اولیه خرابی واترپمپ سدان اسپرت KMC J7 را قبل از وارد آمدن آسیب به واشر سرسیلندر و توربوشارژر تشخیص دهیم؟',
    content: `موتورهای توربوشارژر تزریق مستقیم سوخت (TGDI) از جمله پیشرانه ۱.۵ لیتری KMC J7 با تولید حرارت بالا در اتاقک احتراق، وابستگی بسیار شدیدی به گردش مداوم و پرحجم مایع خنک‌کننده دارند. واترپمپ در این خودروها قلب تپنده مدار خنک‌کاری است.

### مهم‌ترین دلایل خرابی زودرس واترپمپ در خودروهای چینی:
۱. **استفاده از آب لوله‌کشی معمولی**: املاح موجود در آب معمولی باعث ایجاد جرم و خوردگی کاویتاسیون در پروانه‌ها می‌شود.
۲. **استفاده از ضدیخ‌های تقلبی یا فاقد استاندارد OAT**: اسیدهای غیراستاندارد آب‌بند مکانیکی (Mechanical Seal) کربن سرامیکی پمپ را از بین می‌برند.
۳. **سفت بودن بیش از حد تسمه دینام**: فشار شعاعی روی بلبرینگ واترپمپ را به شدت افزایش می‌دهد.

### علائم آشکار خرابی:
- افت تدریجی سطح مایع خنک‌کننده در منبع انبساط بدون مشاهده نشتی واضح از شیلنگ‌ها
- مشاهده رد رسوبات صورتی یا قرمز رنگ خشک‌شده در زیر واترپمپ
- صدای زوزه فلزی شبیه به دینام که با گاز دادن ریتم آن تندتر می‌شود.

### قطعه توصیه شده:
برای پیشگیری از تحمیل هزینه‌های سنگین تعمیر موتور، همیشه از نمونه‌های اصلی شرکتی با پارت نامبر 1026040GH010 استفاده نمایید.`,
    category: 'آموزش و نگهداری',
    readTimeMinutes: 6,
    author: 'مهندس حسام رستگار (کارشناس ارشد فنی خودروهای چینی)',
    date: '۱۴۰۳/۰۶/۱۵',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
    relatedModelIds: ['kmc-j7', 'jac-s5'],
    relatedProductIds: ['prod-water-pump-kmc-j7', 'prod-thermostat-kmc-j7', 'prod-coolant-premium'],
    faq: [
      {
        q: 'آیا با شنیدن صدای زوزه واترپمپ می‌توان تا چند صد کیلومتر رانندگی کرد؟',
        a: 'خیر! گریپاژ ناگهانی بلبرینگ واترپمپ می‌تواند باعث پاره شدن تسمه دینام، از کار افتادن پمپ هیدرولیک و جوش آوردن فوری موتور شود.'
      },
      {
        q: 'آیا در زمان تعویض واترپمپ، ترموستات هم باید تعویض شود؟',
        a: 'توصیه اکید کارشناسان تعویض همزمان ترموستات و واشر آن است، چرا که مدار آب به طور کامل تخلیه شده و هزینه اجرت دوباره کاری پرداخت نمی‌شود.'
      }
    ]
  },
  {
    id: 'art-chinese-turbo-oil-guide',
    slug: 'best-engine-oil-for-chinese-turbo-gdi-cars',
    title: 'راهنمای انتخاب روغن موتور مناسب خودروهای چینی توربو (GDI/TGDI)',
    summary: 'چرا استاندارد API SP و شاخص ویسکوزیته 5W-30 برای پیشگیری از پدیده مخرب LSPI در تیگو، KMC و فیدلیتی حیاتی است؟',
    content: `پدیده اشتعال زودرس در دور پایین (LSPI یا Low-Speed Pre-Ignition) یکی از بزرگترین خطرات تهدیدکننده موتورهای کم‌حجم پرتوان توربوشارژ نظیر KMC J7، چری تیگو ۸ پرو و لاماری ایما است. روغن موتور نامناسب می‌تواند قطرات ریز سدیم و کلسیم آزاد کند که به عنوان جرقه ثانویه عمل کرده و پیستون را دچار شکستگی ناگهانی می‌کنند.

### ویژگی‌های روغن ایده‌آل:
- گرید ویسکوزیته: **5W-30 تمام سنتتیک (Full Synthetic)**
- استاندارد الزامی: **API SP یا ILSAC GF-6** (مقاوم در برابر LSPI)
- سازگاری با سیستم‌های خنک‌کننده روغنی شفت توربوشارژر

همیشه همراه با تعویض روغن، فیلتر روغن اورجینال دارای سوپاپ برگشت روغن نصب کنید تا از خشک استارت خوردن موتور در صبح‌ها جلوگیری شود.`,
    category: 'راهنمای خرید',
    readTimeMinutes: 8,
    author: 'دکتر علیرضا معتمد (متخصص روانکارهای صنعتی)',
    date: '۱۴۰۳/۰۵/۲۲',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
    relatedModelIds: ['kmc-j7', 'chery-tiggo8-pro', 'fownix-fx', 'lamari-eama'],
    relatedProductIds: ['prod-oil-filter-kmc-j7', 'prod-spark-plugs-turbo'],
    faq: [
      {
        q: 'آیا می‌توان از روغن 10W-40 در موتور KMC J7 استفاده کرد؟',
        a: 'خیر! روغن 10W-40 به دلیل ویسکوزیته بالا در استارت سرد دیرتر به یاتاقان‌ها و شفت توربو می‌رسد و استهلاک قطعات را بالا می‌برد.'
      }
    ]
  },
  {
    id: 'art-tiggo7-genuine-brake-pads',
    slug: 'chery-tiggo7-genuine-vs-fake-brake-pads',
    title: 'تشخیص لنت ترمز اصلی از تقلبی در خودروهای چری و فونیکس',
    summary: 'مقایسه عملکرد لنت‌های سرامیکی با لنت‌های متفرقه بازار و نحوه تشخیص هولوگرام‌های اصل مدیران خودرو.',
    content: `سیستم ترمز در خودروهای کراس‌اوور با وزن بالای ۱.۵ تن مثل تیگو ۷ پرو و فونیکس FX باید بتواند در هر سرعتی خودرو را بدون انحراف و در کمترین مسافت متوقف سازد. لنت‌های تقلبی با استفاده از آزبست و براده‌های درشت آهن نه تنها باعث خط افتادن روی دیسک ترمز گران‌قیمت می‌شوند، بلکه در ترمزگیری‌های مکرر داغ کرده و پدال ترمز به اصطلاح چوب می‌شود.`,
    category: 'معرفی قطعات',
    readTimeMinutes: 5,
    author: 'مهندس آرش شایگان',
    date: '۱۴۰۳/۰۴/۱۰',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80',
    relatedModelIds: ['chery-tiggo7-pro', 'fownix-fx'],
    relatedProductIds: ['prod-brake-pads-j7-front'],
    faq: [
      {
        q: 'چرا بعد از تعویض لنت چرخ‌ها سوت می‌کشند؟',
        a: 'علاوه بر کیفیت متریال لنت، عدم گریس‌کاری پین‌های کالیپر و عدم تعویض شیم‌های ضد لرزش پشت لنت از عوامل شایع سوت کشیدن است.'
      }
    ]
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ord-10029',
    orderNumber: 'CHP-84920',
    date: '۱۴۰۳/۰۶/۲۴ - ۱۱:۳۰',
    status: 'shipped' as const,
    statusTitle: 'ارسال شده با پست پیشتاز',
    items: [
      {
        productId: 'prod-water-pump-kmc-j7',
        productName: 'واتر پمپ اصلی شرکتی KMC J7',
        oemNumber: '1026040GH010',
        price: 3490000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&auto=format&fit=crop&q=80',
        grade: 'genuine' as const,
        vehicleInfo: 'مناسب KMC J7 مدل 1402'
      },
      {
        productId: 'prod-oil-filter-kmc-j7',
        productName: 'فیلتر روغن اصلی شرکتی KMC J7',
        oemNumber: '1017100GH010',
        price: 390000,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=200&auto=format&fit=crop&q=80',
        grade: 'genuine' as const,
        vehicleInfo: 'مناسب KMC J7'
      }
    ],
    customer: {
      firstName: 'حمیدرضا',
      lastName: 'کاظمی',
      phone: '09123456789',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1458963214',
      address: 'خیابان شریعتی، بالاتر از پل رومی، پلاک ۴۲، واحد ۵',
      notes: 'لطفاً قبل از ارسال هماهنگ شود'
    },
    shippingMethod: {
      id: 'express-post',
      title: 'پست پیشتاز ویژه قطعات حساس',
      cost: 85000,
      estimatedDelivery: '۲ الی ۳ روز کاری'
    },
    paymentMethod: {
      id: 'online-saman',
      title: 'درگاه پرداخت اینترنتی سامان کیش'
    },
    subtotal: 4270000,
    discountAmount: 200000,
    shippingFee: 85000,
    total: 4155000,
    trackingPostCode: '39485029184759203948'
  },
  {
    id: 'ord-10028',
    orderNumber: 'CHP-83110',
    date: '۱۴۰۳/۰۶/۱۸ - ۱۶:۴۵',
    status: 'delivered' as const,
    statusTitle: 'تحویل داده شده',
    items: [
      {
        productId: 'prod-brake-pads-j7-front',
        productName: 'لنت ترمز چرخ جلو سرامیکی Hi-Q KMC J7',
        oemNumber: '3501110U7001',
        price: 2190000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80',
        grade: 'oem' as const,
        vehicleInfo: 'KMC J7 1401'
      }
    ],
    customer: {
      firstName: 'سعید',
      lastName: 'مهرابی',
      phone: '09351234567',
      province: 'اصفهان',
      city: 'اصفهان',
      postalCode: '8193847291',
      address: 'بلوار آتشگاه، کوچه بهار، پلاک ۱۸'
    },
    shippingMethod: {
      id: 'tipax',
      title: 'تیپاکس اکسپرس هوایی',
      cost: 110000,
      estimatedDelivery: '۲۴ ساعته'
    },
    paymentMethod: {
      id: 'online-mellat',
      title: 'درگاه پرداخت اینترنتی به پرداخت ملت'
    },
    subtotal: 2190000,
    discountAmount: 0,
    shippingFee: 110000,
    total: 2300000,
    trackingPostCode: 'TPX-9482019482'
  }
];

export const INITIAL_GARAGE = [
  {
    id: 'gar-1',
    brandId: 'kmc',
    brandName: 'کی‌ام‌سی (KMC)',
    modelId: 'kmc-j7',
    modelName: 'KMC J7',
    year: 1402,
    engine: '1.5 Turbo TGDI (172 HP)',
    transmission: '6 سرعته DCT',
    customLabel: 'خودروی من (KMC J7)',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&auto=format&fit=crop&q=80',
    addedAt: '۱۴۰۳/۰۵/۱۰'
  },
  {
    id: 'gar-2',
    brandId: 'mvm',
    brandName: 'ام‌وی‌ام (MVM)',
    modelId: 'mvm-x55-pro',
    modelName: 'MVM X55 Pro',
    year: 1401,
    engine: '1.5 Turbo (156 HP)',
    transmission: 'CVT 9 دنده',
    customLabel: 'خودروی همسر (X55 پرو)',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&auto=format&fit=crop&q=80',
    addedAt: '۱۴۰۳/۰۶/۰۱'
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    firstName: 'حمیدرضا',
    lastName: 'کاظمی',
    phone: '09123456789',
    email: 'h.kazemi@gmail.com',
    type: 'retail' as const,
    typeTitle: 'مشتری عادی',
    status: 'active' as const,
    registeredAt: '۱۴۰۳/۰۲/۱۵',
    totalOrders: 3,
    totalSpent: 8450000,
    vehicle: 'KMC J7 (1402)',
    address: 'تهران، خیابان شریعتی، بالاتر از پل رومی، پلاک ۴۲، واحد ۵',
    loyaltyPoints: 1250,
    loyaltyTier: 'gold' as const
  },
  {
    id: 'cust-2',
    firstName: 'مهندس بهرام',
    lastName: 'سهرابی (تعمیرگاه تخصصی چین‌موتور)',
    phone: '09128889900',
    email: 'chinmotor.teh@gmail.com',
    type: 'mechanic' as const,
    typeTitle: 'تعمیرکار / همکار',
    status: 'active' as const,
    registeredAt: '۱۴۰۲/۱۱/۲۰',
    totalOrders: 18,
    totalSpent: 42300000,
    vehicle: 'تخصصی KMC و Chery',
    address: 'تهران، میدان هروی، خیابان وفامنش، پلاک ۱۱۴',
    loyaltyPoints: 4650,
    loyaltyTier: 'diamond' as const
  },
  {
    id: 'cust-3',
    firstName: 'علیرضا',
    lastName: 'صادقی (فروشگاه یدکی البرز)',
    phone: '09351234567',
    email: 'alborz.parts@yahoo.com',
    type: 'wholesale' as const,
    typeTitle: 'عمده‌فروش قطعات',
    status: 'active' as const,
    registeredAt: '۱۴۰۳/۰۱/۱۰',
    totalOrders: 7,
    totalSpent: 125000000,
    vehicle: 'فروشگاه عمده قطعات کرج',
    address: 'کرج، ۴۵ متری گلشهر، نبش بهار غربی',
    loyaltyPoints: 8500,
    loyaltyTier: 'diamond' as const
  },
  {
    id: 'cust-4',
    firstName: 'مریم',
    lastName: 'فرهادی',
    phone: '09197776655',
    email: 'm.farhadi@gmail.com',
    type: 'retail' as const,
    typeTitle: 'مشتری عادی',
    status: 'active' as const,
    registeredAt: '۱۴۰۳/۰۵/۱۸',
    totalOrders: 1,
    totalSpent: 2190000,
    vehicle: 'MVM X22 Pro',
    address: 'اصفهان، خیابان شیخ صدوق شمالی',
    loyaltyPoints: 320,
    loyaltyTier: 'silver' as const
  }
];

export const INITIAL_LOYALTY_TRANSACTIONS = [
  {
    id: 'tx-loyalty-1',
    customerId: 'cust-1',
    type: 'bonus' as const,
    points: 100,
    description: 'هدیه خوش‌آمدگویی و تکمیل مشخصات پروفایل کاربری',
    date: '۱۴۰۳/۰۲/۱۵ - ۱۲:۰۰',
    balanceAfter: 100
  },
  {
    id: 'tx-loyalty-2',
    customerId: 'cust-1',
    type: 'earned' as const,
    points: 415,
    description: 'امتیاز خرید سفارش CHP-84920 (واترپمپ و فیلتر KMC J7)',
    orderNumber: 'CHP-84920',
    date: '۱۴۰۳/۰۶/۲۴ - ۱۱:۳۲',
    balanceAfter: 515
  },
  {
    id: 'tx-loyalty-3',
    customerId: 'cust-1',
    type: 'bonus' as const,
    points: 150,
    description: 'پاداش ارتقا به سطح مشتری طلایی و ثبت خودرو در گاراژ',
    date: '۱۴۰۳/۰۶/۲۵ - ۰۹:۱۵',
    balanceAfter: 665
  },
  {
    id: 'tx-loyalty-4',
    customerId: 'cust-1',
    type: 'earned' as const,
    points: 585,
    description: 'امتیاز خرید سفارش CHP-83110 (لنت ترمز سرامیکی)',
    orderNumber: 'CHP-83110',
    date: '۱۴۰۳/۰۷/۰۲ - ۱۷:۴۰',
    balanceAfter: 1250
  },
  {
    id: 'tx-loyalty-5',
    customerId: 'cust-2',
    type: 'earned' as const,
    points: 4650,
    description: 'امتیاز انباشته سفارش‌های همکار مکانیک (سطح VIP)',
    date: '۱۴۰۳/۰۶/۲۰ - ۱۰:۰۰',
    balanceAfter: 4650
  }
];

export const INITIAL_ARTICLE_CATEGORIES: ArticleCategory[] = [
  {
    id: 'cat-maintenance',
    name: 'آموزش و نگهداری',
    slug: 'maintenance',
    description: 'راهنماهای دوره‌ای تعویض روغن، تسمه تایم، فیلترها و مایعات مصرفی خودروهای چینی با نکات کلیدی کارخانه',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    icon: 'Wrench',
    articleCount: 4
  },
  {
    id: 'cat-buyers-guide',
    name: 'راهنمای خرید قطعات',
    slug: 'buyers-guide',
    description: 'روش‌های علمی و تجربی تشخیص قطعه اصلی شرکتی از نمونه‌های متفرقه و تقلبی موجود در بازار چراغ برق',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    icon: 'ShieldCheck',
    articleCount: 3
  },
  {
    id: 'cat-technical-review',
    name: 'بررسی فنی و مقایسه',
    slug: 'technical-review',
    description: 'تحلیل سیستم‌های موتوری توربو TGDI، گیربکس‌های دوکلاچه تر (Wet DCT) و پلتفرم‌های مدرن فونیکس و KMC',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
    icon: 'Car',
    articleCount: 2
  },
  {
    id: 'cat-troubleshooting',
    name: 'عیب‌یابی و تعمیرات تخصصی',
    slug: 'troubleshooting',
    description: 'بررسی خطاهای ECU، صداهای غیرعادی جلوبندی، لرزش دیسک ترمز و راه‌حل‌های کاربردی مکانیک‌های مجرب',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80',
    icon: 'AlertTriangle',
    articleCount: 5
  }
];

export const INITIAL_SETTINGS = {
  siteTitle: 'چین پارت | بازار تخصصی قطعات یدکی خودروهای چینی',
  siteSlogan: 'مرجع رسمی و تخصصی لوازم یدکی و قطعات فابریک با سیستم فیتمنت هوشمند',
  contactPhone: '۰۲۱-۸۸۹۹۲۲۱۱',
  supportPhone: '۰۹۱۲۳۴۵۶۷۸۹',
  supportEmail: 'support@chinpart.ir',
  address: 'تهران، خیابان امیرکبیر (چراغ برق)، کوچه سراج، پاساژ کاشانی، طبقه همکف، پلاک ۲۸',
  announcementText: 'تضمین اصالت قطعات شرکتی با هولوگرام، ارسال فوری ۲ ساعته در تهران و ۲۴ ساعته با تیپاکس در سراسر کشور',
  primaryColor: '#DC2626', // Red-600
  primaryHover: '#b91c1c',
  accentGlowColor: '#DC2626', // Configurable glow/red highlight under buttons, cards, hover
  themeMode: 'dark' as const,
  layoutPreset: 'classic' as const,
  siteBgColor: '#0a0a0a',
  cardBgColor: '#171717',
  headerBgColor: '#0a0a0a',
  footerBgColor: '#0a0a0a',
  textColor: '#ffffff',
  fontFamily: 'Vazirmatn' as const,
  fontSize: 'normal' as const,
  borderRadius: 'normal' as const,
  themeRadiusPx: 12,
  metaTitle: 'چین‌پارت | فروشگاه تخصصی قطعات یدکی خودروهای چینی با سیستم فیتمنت',
  metaDescription: 'مرجع تخصصی خرید لوازم یدکی و قطعات فابریک خودروهای کی‌ام‌سی KMC، چری، فونیکس، ام‌وی‌ام، لاماری و جک با تضمین اصالت و گارانتی بازگشت وجه.',
  metaKeywords: 'لوازم یدکی کی ام سی, قطعات چری, قطعات فونیکس, قطعات KMC J7, لوازم جک S5, قطعات فابریک چینی',
  ogTitle: 'چین‌پارت پرو - مرجع قطعات خودروهای چینی',
  ogDescription: 'سیستم هوشمند فیتمنت و سازگاری ۱۰۰٪ قطعات با خودروهای مدرن چینی',
  ogImageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&auto=format&fit=crop&q=80',
  freeShippingThreshold: 5000000,
  expressShippingFee: 120000,
  postShippingFee: 85000,
  tipaxShippingFee: 110000,
  enableGuestCheckout: true,
  enableStockAlerts: true,
  navigationMenus: [
    { id: 'm1', title: 'صفحه اصلی', link: 'home' },
    { id: 'm2', title: 'فروشگاه قطعات', link: 'shop' },
    { id: 'm3', title: 'قطعات مصرفی و سرویس دوره‌ای', link: 'shop:maintenance', badge: 'سرویس' },
    { id: 'm4', title: 'استعلام قطعه با شماره شاسی', link: 'part-request', badge: 'فوری' },
    { id: 'm5', title: 'مقالات و آموزش تعمیرات', link: 'blog' },
    { id: 'm6', title: 'گاراژ خودروهای من', link: 'account:garage' }
  ],
  headerMenus: [
    { id: 'header-categories', title: 'دسته‌بندی قطعات خودرو', link: 'shop', kind: 'categories' as const, isVisible: true },
    { id: 'header-brands', title: 'برندهای خودرو', link: 'shop', kind: 'brands' as const, isVisible: true },
    { id: 'header-maintenance', title: 'سرویس دوره‌ای', link: 'shop:maintenance', kind: 'system' as const, badge: 'سرویس', isVisible: true },
    { id: 'header-request', title: 'استعلام قطعه', link: 'part-request', kind: 'system' as const, badge: 'فوری', isVisible: true },
    { id: 'header-blog', title: 'مقالات و آموزش', link: 'blog', kind: 'system' as const, isVisible: true },
    { id: 'header-cat-engine', title: 'قطعات موتور', link: 'category:engine', kind: 'category' as const, parentId: 'header-categories', isVisible: true },
    { id: 'header-cat-brakes', title: 'سیستم ترمز', link: 'category:brakes', kind: 'category' as const, parentId: 'header-categories', isVisible: true },
    { id: 'header-cat-filters', title: 'فیلترها و سرویس', link: 'category:filters', kind: 'category' as const, parentId: 'header-categories', isVisible: true },
    { id: 'header-cat-suspension', title: 'جلوبندی و تعلیق', link: 'category:suspension', kind: 'category' as const, parentId: 'header-categories', isVisible: true }
  ],
  popularPartsBrands: [
    { id: 'pb-bosch', title: 'BOSCH', subtitle: 'Bosch Mobility', imageUrl: 'https://www.google.com/s2/favicons?domain=bosch.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-mahle', title: 'MAHLE', subtitle: 'Engine Components', imageUrl: 'https://www.google.com/s2/favicons?domain=mahle.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-valeo', title: 'VALEO', subtitle: 'Clutch & Electrical', imageUrl: 'https://www.google.com/s2/favicons?domain=valeo.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-skf', title: 'SKF', subtitle: 'Bearings', imageUrl: 'https://www.google.com/s2/favicons?domain=skf.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-ngk', title: 'NGK', subtitle: 'Ignition', imageUrl: 'https://www.google.com/s2/favicons?domain=ngkntk.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-castrol', title: 'Castrol', subtitle: 'Lubricants', imageUrl: 'https://www.google.com/s2/favicons?domain=castrol.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-brembo', title: 'Brembo', subtitle: 'Brake Systems', imageUrl: 'https://www.google.com/s2/favicons?domain=brembo.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-mann', title: 'MANN-FILTER', subtitle: 'Filters', imageUrl: 'https://www.google.com/s2/favicons?domain=mann-filter.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-sachs', title: 'SACHS', subtitle: 'Drivetrain', imageUrl: 'https://www.google.com/s2/favicons?domain=zf.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-gates', title: 'Gates', subtitle: 'Belts & Cooling', imageUrl: 'https://www.google.com/s2/favicons?domain=gates.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-hella', title: 'HELLA', subtitle: 'Lighting & Electronics', imageUrl: 'https://www.google.com/s2/favicons?domain=hella.com&sz=128', link: 'shop', isVisible: true },
    { id: 'pb-mobil', title: 'Mobil 1', subtitle: 'Engine Oil', imageUrl: 'https://www.google.com/s2/favicons?domain=mobil.com&sz=128', link: 'shop', isVisible: true }
  ],
  productAttributes: [
    { id: 'attr-1', nameFa: 'شماره فنی اصلی (OEM)', category: 'all', defaultValue: 'استاندارد کارخانه' },
    { id: 'attr-2', nameFa: 'کد و حجم پیشرانه (سی‌سی)', category: 'engine', defaultValue: '1500 Turbo' },
    { id: 'attr-3', nameFa: 'نوع گیربکس (CVT/DCT/دستی)', category: 'gearbox', defaultValue: 'اتوماتیک دوکلاچه تر' },
    { id: 'attr-4', nameFa: 'موقعیت نصب در خودرو', category: 'body_chassis', defaultValue: 'جلوبندی و سیستم تعلیق' },
    { id: 'attr-5', nameFa: 'درجه استاندارد کیفی', category: 'all', defaultValue: 'Genuine شرکتی پلمپ' }
  ],
  logoUrl: '',
  faviconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
  sellerName: 'بازرگانی قطعات خودروهای چینی چین‌پارت (با مسئولیت محدود)',
  sellerEconomicCode: '411589324567',
  sellerNationalId: '14009854321',
  sellerRegistrationNo: '584920',
  sellerPostalCode: '1143987654',
  sellerPhone: '۰۲۱-۸۸۹۹۲۲۱۱',
  sellerAddress: 'تهران، خیابان امیرکبیر (چراغ برق)، کوچه سراج، پاساژ کاشانی، طبقه همکف، پلاک ۲۸',
  
  // Footer Customization Defaults (Editable, Deletable, Addable)
  footerAboutTitle: 'فروشگاه اینترنتی لوازم یدکی چین‌پارت',
  footerAboutText: 'فروشگاه اینترنتی چین‌پارت، به عنوان مرجع تخصصی تامین، واردات و توزیع قطعات یدکی خودروهای چینی در ایران، با بیش از یک دهه سابقه در بازار چراغ برق تهران فعالیت می‌کند. تمرکز ما حذف واسطه‌ها، تضمین اصالت و تامین قطعات خودروهای مدرن کی‌ام‌سی (KMC)، چری، ام‌وی‌ام، فونیکس، لاماری، جک و چانگان است.',
  footerShowFeatures: true,
  footerFeatures: [
    { id: 'feat-1', title: 'ضمانت ۱۰۰٪ اصالت قطعه', description: 'تضمین قطعات اصلی شرکتی با هولوگرام لیزری', icon: 'ShieldCheck' },
    { id: 'feat-2', title: 'ارسال اکسپرس و بیمه‌شده', description: 'تهران ۲ ساعته، شهرستان‌ها با تیپاکس و پست پیشتاز', icon: 'Truck' },
    { id: 'feat-3', title: '۷ روز مهلت تست و مرجوعی', description: 'بازگشت بدون قید و شرط در صورت عدم تطبیق فیتمنت', icon: 'Clock' },
    { id: 'feat-4', title: 'مشاوره تخصصی قبل از خرید', description: 'بررسی دقیق شماره شاسی VIN توسط مهندسین فنی', icon: 'Headphones' }
  ],
  footerColumns: [
    {
      id: 'fcol-1',
      title: 'راهنمای خرید و قوانین',
      links: [
        { id: 'flink-1', title: 'درباره چین‌پارت پرو', url: 'page:about' },
        { id: 'flink-2', title: 'ضمانت اصالت و شرایط بازگشت کالا', url: 'page:guarantee' },
        { id: 'flink-3', title: 'پیگیری وضعیت سفارش و مرسوله', url: 'tracking' },
        { id: 'flink-4', title: 'استعلام قطعات کم‌یاب و وارداتی', url: 'part-request' }
      ]
    },
    {
      id: 'fcol-2',
      title: 'خدمات مشتریان و همکاران',
      links: [
        { id: 'flink-5', title: 'آموزش فنی و عیب‌یابی خودرو', url: 'blog' },
        { id: 'flink-6', title: 'مدیریت گاراژ خودروهای من', url: 'account:garage' },
        { id: 'flink-7', title: 'ثبت‌نام خریداران و مکانیک‌ها', url: 'account' }
      ]
    }
  ],
  // Trust/certification badges stay disabled until real verification codes are configured.
  footerShowBadges: false,
  footerBadges: [],
  footerCustomHtml: '',
  footerCopyrightText: 'تمامی حقوق مادی و معنوی برای فروشگاه اینترنتی چین‌پارت محفوظ است. طراحی تخصصی مخصوص صنعت خودروهای چینی.',
  loyaltySettings: {
    enabled: true,
    pointsPerToman: 0.0001, // 1 point per 10,000 Tomans
    tomanPerPoint: 1000, // 1 point = 1,000 Tomans discount
    minimumRedeemPoints: 50,
    maxRedeemPercent: 50, // up to 50% of subtotal can be paid with points
    signupBonusPoints: 50,
    firstOrderBonusPoints: 100
  }
};

export const INITIAL_SLIDERS: SliderItem[] = [
  {
    id: 'slide-1',
    title: 'تخصصی‌ترین مرکز قطعات یدکی KMC و JAC در ایران',
    subtitle: 'تامین مستقیم قطعات موتوری، گیربکس دوکلاچه تر، جلوبندی و بدنه KMC J7، T8، K7 و JAC S5 با گارانتی تعویض',
    tag: 'اصلی شرکتی',
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1600&auto=format&fit=crop&q=80',
    link: 'shop',
    buttonText: 'مشاهده و خرید قطعات KMC',
    isActive: true,
    order: 1
  },
  {
    id: 'slide-2',
    title: 'لوازم یدکی فابریک فونیکس (Fownix) و چری تیگو',
    subtitle: 'قطعات اورجینال تیگو ۸ پرو، فونیکس FX و آریزو ۶ جی‌تی با تضمین شماره فنی OEM و گارانتی اصالت کالا',
    tag: 'موجود در انبار',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop&q=80',
    link: 'shop',
    buttonText: 'بررسی قطعات فونیکس و چری',
    isActive: true,
    order: 2
  },
  {
    id: 'slide-3',
    title: 'تخفیف ویژه کیت‌های سرویس دوره‌ای و فیلترها',
    subtitle: 'کیت کامل روغن موتور 5W-30، فیلتر روغن، هوا، کابین و لنت ترمز فابریک با ارسال رایگان',
    tag: 'سرویس اقتصادی',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1600&auto=format&fit=crop&q=80',
    link: 'shop:maintenance',
    buttonText: 'خرید کیت‌های سرویس دوره‌ای',
    isActive: true,
    order: 3
  }
];

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin-super',
    username: 'admin',
    fullName: 'مهندس رضایی (مدیر ارشد سیستم)',
    role: 'super_admin',
    roleTitle: 'مدیر کل ارشد (Super Admin)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'admin@chinpart.ir',
    phone: '09121112233',
    isActive: true,
    createdAt: '1402/10/01',
    permissions: {
      canManageProducts: true,
      canManageOrders: true,
      canManageArticles: true,
      canManageSliders: true,
      canManageSettings: true,
      canManageAdmins: true,
      canAccessSandbox: true,
      canManageVehicles: true
    }
  },
  {
    id: 'admin-content',
    username: 'content',
    fullName: 'خانم علیزاده (سرپرست تولید محتوا)',
    role: 'content_manager',
    roleTitle: 'مدیر محتوا و بلاگ',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    email: 'content@chinpart.ir',
    phone: '09124445566',
    isActive: true,
    createdAt: '1402/11/15',
    permissions: {
      canManageProducts: false,
      canManageOrders: false,
      canManageArticles: true,
      canManageSliders: true,
      canManageSettings: false,
      canManageAdmins: false,
      canAccessSandbox: false,
      canManageVehicles: false
    }
  },
  {
    id: 'admin-orders',
    username: 'orders',
    fullName: 'آقای کاظمی (مدیر سفارشات و مالی)',
    role: 'order_manager',
    roleTitle: 'مدیر فروش و فاکتورها',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'orders@chinpart.ir',
    phone: '09127778899',
    isActive: true,
    createdAt: '1402/12/01',
    permissions: {
      canManageProducts: false,
      canManageOrders: true,
      canManageArticles: false,
      canManageSliders: false,
      canManageSettings: false,
      canManageAdmins: false,
      canAccessSandbox: true,
      canManageVehicles: false
    }
  },
  {
    id: 'admin-inventory',
    username: 'inventory',
    fullName: 'آقای حسینی (انباردار مرکزی)',
    role: 'inventory_manager',
    roleTitle: 'مدیر کاتالوگ و انبار',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'stock@chinpart.ir',
    phone: '09128889900',
    isActive: true,
    createdAt: '1403/01/10',
    permissions: {
      canManageProducts: true,
      canManageOrders: false,
      canManageArticles: false,
      canManageSliders: false,
      canManageSettings: false,
      canManageAdmins: false,
      canAccessSandbox: false,
      canManageVehicles: true
    }
  }
];

export const INITIAL_PAYMENT_GATEWAYS = [
  {
    id: 'gateway-saman',
    name: 'درگاه پرداخت الکترونیک سامان (SEP)',
    provider: 'saman' as const,
    isActive: false,
    merchantId: '',
    terminalId: '',
    isSandbox: false,
    description: 'درگاه پیش‌فرض و پایدار بانکی با بالاترین نرخ تراکنش موفق عضو شتاب'
  },
  {
    id: 'gateway-mellat',
    name: 'به‌پرداخت بانک ملت (BPM)',
    provider: 'mellat' as const,
    isActive: false,
    merchantId: '',
    terminalId: '',
    isSandbox: false,
    description: 'درگاه معتبر شبکه شاپرک با تسویه حساب آنی روزانه'
  },
  {
    id: 'gateway-zarinpal',
    name: 'زرین‌پال پرداخت واسط هوشمند (ZarinPal)',
    provider: 'zarinpal' as const,
    isActive: false,
    merchantId: '',
    isSandbox: true,
    description: 'درگاه پرداخت سریع با قابلیت مسیردهی هوشمند بین چند سوئیچ بانکی'
  },
  {
    id: 'gateway-cod',
    name: 'پرداخت در محل (Cash On Delivery)',
    provider: 'cod' as const,
    isActive: true,
    merchantId: '',
    isSandbox: false,
    description: 'پرداخت وجه پس از تحویل و رویت قطعه با کارت‌خوان سیار (ویژه سفارش‌های تهران)'
  }
];

export const INITIAL_API_CONFIG = {
  smsProvider: 'kavenegar' as const,
  smsApiKey: '',
  smsSenderNumber: '10008585',
  smsNotifyOnOrder: true,
  smsNotifyOnStock: true,
  smsTrackingPattern: 'chinpart-tracking',
  accountingSoftware: 'sepidar' as const,
  accountingApiKey: '',
  accountingAutoSyncStock: true,
  webhookUrl: 'https://api.chinpart.ir/webhooks/orders',
  webhookSecret: ''
};

export const INITIAL_PAGES: SitePage[] = [
  {
    id: 'page-home',
    slug: 'home',
    title: 'صفحه اصلی فروشگاه',
    description: 'سکشن‌های صفحه نخست شامل هدر، اسلایدر ویژه، فیلتر هوشمند و کاتالوگ قطعات',
    isSystem: true,
    updatedAt: '1403/01/15',
    sections: [
      {
        id: 'sec-hero',
        title: 'قطعه درست برای خودروی شما',
        subtitle: 'تخصصی‌ترین مرکز تامین لوازم یدکی، موتوری، گیربکس و جلوبندی خودروهای چینی با تضمین شماره فنی OEM و انطباق کامل.',
        content: 'سیستم هوشمند فیتمنت و سازگاری قطعات خودروهای چینی KMC, Chery, MVM, Fownix, Lamari, Changan',
        badge: 'سیستم هوشمند فیتمنت',
        buttonText: 'انتخاب خودرو و شروع خرید',
        buttonLink: 'shop',
        isVisible: true,
        order: 1
      },
      {
        id: 'sec-brands',
        title: 'خرید قطعات بر اساس برند خودرو',
        subtitle: 'برند خودروی خود را انتخاب کنید تا به صفحه اختصاصی مدل‌ها و قطعات آن هدایت شوید',
        content: 'پوشش کامل تمامی برندهای معتبر خودروسازی چین شامل کرمان موتور، مدیران خودرو، بهمن موتور، آرین پارس موتور و سایپا',
        badge: 'برندهای خودرو',
        buttonText: 'مشاهده تمامی خودروها',
        buttonLink: 'shop',
        isVisible: true,
        order: 2
      },
      {
        id: 'sec-categories',
        title: 'دسته‌بندی تخصصی قطعات یدکی',
        subtitle: 'دسترسی سریع به سیستم‌های فنی، موتوری، برقی، گیربکس و بدنه',
        content: 'بیش از ۱۰٬۰۰۰ قلم کالای موجود با مشخصات فنی دقیق، گرید کیفی شرکتی پلمپ و هولوگرام اصالت',
        badge: 'دسته‌بندی‌ها',
        buttonText: 'مشاهده کاتالوگ کامل',
        buttonLink: 'shop',
        isVisible: true,
        order: 3
      },
      {
        id: 'sec-trust',
        title: 'چرا خرید از چین‌پارت پرو؟',
        subtitle: '۴ رکن اعتماد مشتریان و مکانیک‌های متخصص در سراسر ایران',
        content: 'تطبیق شماره شاسی VIN، اصالت ۱۰۰٪ فابریک، ضمانت بازگشت وجه ۷ روزه، ارسال سریع همان روز',
        badge: 'تضمین کیفیت',
        isVisible: true,
        order: 4
      },
      {
        id: 'sec-articles',
        title: 'دانشنامه و مقالات تخصصی تعمیرات',
        subtitle: 'آموزش‌های تخصصی عیب‌یابی، راهنمای تعویض روغن گیربکس و حل مشکلات رایج خودروهای چینی',
        content: 'تولید شده توسط کارشناسان ارشد فنی با تجربه نمایندگی‌های مجاز',
        badge: 'آموزش فنی',
        buttonText: 'مشاهده تمامی مقالات',
        buttonLink: 'blog',
        isVisible: true,
        order: 5
      }
    ]
  },
  {
    id: 'page-about',
    slug: 'about',
    title: 'درباره چین‌پارت پرو',
    description: 'معرفی تاریخچه، انبار مرکزی و اهداف مجموعه چین‌پارت',
    isSystem: true,
    updatedAt: '1403/01/10',
    sections: [
      {
        id: 'sec-about-intro',
        title: 'مرجع تخصصی قطعات یدکی خودروهای چینی در ایران',
        subtitle: 'با بیش از یک دهه تجربه واردات و توزیع مستقیم لوازم یدکی شرکتی',
        content: 'مجموعه چین‌پارت پرو فعالیت خود را با هدف رفع دغدغه مالکان و تعمیرکاران خودروهای چینی در زمینه تامین قطعات اصلی آغاز کرد. با واردات مستقیم از خطوط تولید مادر در چین و همکاری با نمایندگی‌های مجاز داخلی، بالاترین استانداردهای کیفی را به ارمغان آورده‌ایم.',
        badge: 'درباره ما',
        imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
        isVisible: true,
        order: 1
      },
      {
        id: 'sec-about-warehouse',
        title: 'انبار مرکزی و موجودی پویا',
        subtitle: 'بیش از ۱۵٬۰۰۰ قطعه آماده ارسال در انبار مکانیزه تهران',
        content: 'تمامی قطعات پیش از انبارداری و ارسال، توسط کارشناسان کنترل کیفیت (QC) بررسی و بارکدگذاری می‌شوند.',
        badge: 'زیرساخت انبارداری',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
        isVisible: true,
        order: 2
      }
    ]
  },
  {
    id: 'page-guarantee',
    slug: 'guarantee',
    title: 'قوانین ضمانت اصالت و بازگشت وجه',
    description: 'تعهدات شرکت نسبت به تطبیق شماره فنی و سلامت فیزیکی کالا',
    isSystem: true,
    updatedAt: '1403/01/01',
    sections: [
      {
        id: 'sec-guarantee-rules',
        title: 'ضمانت تطبیق ۱۰۰٪ با شماره شاسی (VIN)',
        subtitle: 'در صورت عدم تطبیق، قطعه بدون قید و شرط تعویض یا مرجوع می‌گردد',
        content: 'کارشناسان فنی ما قبل از پردازش سفارش، شماره فنی قطعه انتخابی شما را با شاسی خودرو استعلام می‌گیرند تا از انطباق بی‌نقص اطمینان حاصل شود.',
        badge: 'تضمین اصالت',
        isVisible: true,
        order: 1
      }
    ]
  }
];
