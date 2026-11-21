/* ==========================================================================
   OrderFlow Growth Suite — Solutions Showcase, Onboarding Engine,
   Managed Expert Services, Seller Academy Guides & Canvas Photo Studio
   UMD-compatible so both browser and Node unit tests (node:test) can import it.
   ========================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    root.OrderFlowGrowth = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * 1. الأيقونات والشعارات الرسمية المعتمدة للمنصات كما تظهر في مواقعها وتطبيقاتها الرسمية (أمازون · نون · جوميا · ترينديول · كنز)
   */
  const PLATFORM_LOGO_ASSETS = {
    a: {
      full: '/assets/logos/amazon.svg',
      icon: '/assets/logos/amazon-icon.svg',
      alt: 'Amazon Egypt',
      stageBg: '#FFFFFF',
      tileBg: '#FFFFFF',
      bleed: false
    },
    n: {
      full: '/assets/logos/noon.svg',
      icon: '/assets/logos/noon-icon.svg',
      alt: 'Noon',
      stageBg: '#FCE819',
      tileBg: '#FCE819',
      bleed: true
    },
    j: {
      full: '/assets/logos/jumia-wordmark.png',
      icon: '/assets/logos/jumia-icon.jpg',
      alt: 'Jumia',
      stageBg: '#FFFFFF',
      tileBg: '#F68B1E',
      bleed: true
    },
    t: {
      full: '/assets/logos/trendyol.svg',
      icon: '/assets/logos/trendyol-icon.jpg',
      alt: 'Trendyol',
      stageBg: '#FFFFFF',
      tileBg: '#F27A1A',
      bleed: true
    },
    k: {
      full: '/assets/logos/kenzz.svg',
      icon: '/assets/logos/kenzz-icon.png',
      alt: 'Kenzz',
      stageBg: '#FFFFFF',
      tileBg: '#FFFFFF',
      bleed: false
    }
  };

  function renderPlatformLogo(key, variant = 'icon') {
    const asset = PLATFORM_LOGO_ASSETS[key];
    if (!asset) return '';
    const mode = variant === 'full' ? 'full' : 'icon';
    const src = mode === 'full' ? asset.full : asset.icon;
    const bleedCls = mode === 'icon' && asset.bleed ? ' platform-logo-img--bleed' : '';
    return `<img class="platform-logo-img platform-logo-img--${mode} platform-logo-img--${key}${bleedCls}" src="${src}" alt="${asset.alt}" loading="eager" decoding="async">`;
  }

  const PARTNER_CERTIFICATIONS = [
    { key: 'a', code: 'Amazon SPN', name: 'Amazon Egypt', badge: 'إدارة المبيعات', accent: '#131921', textColor: '#ffffff', short: 'A', stageBg: PLATFORM_LOGO_ASSETS.a.stageBg, tileBg: PLATFORM_LOGO_ASSETS.a.tileBg, bleed: PLATFORM_LOGO_ASSETS.a.bleed, logoSrc: PLATFORM_LOGO_ASSETS.a.full, iconSrc: PLATFORM_LOGO_ASSETS.a.icon },
    { key: 'n', code: 'Noon FBPI', name: 'Noon', badge: 'إدارة المبيعات', accent: '#FCE819', textColor: '#1E1E24', short: 'N', stageBg: PLATFORM_LOGO_ASSETS.n.stageBg, tileBg: PLATFORM_LOGO_ASSETS.n.tileBg, bleed: PLATFORM_LOGO_ASSETS.n.bleed, logoSrc: PLATFORM_LOGO_ASSETS.n.full, iconSrc: PLATFORM_LOGO_ASSETS.n.icon },
    { key: 'j', code: 'Jumia AMP', name: 'Jumia', badge: 'إدارة المبيعات', accent: '#F68B1E', textColor: '#ffffff', short: 'J', stageBg: PLATFORM_LOGO_ASSETS.j.stageBg, tileBg: PLATFORM_LOGO_ASSETS.j.tileBg, bleed: PLATFORM_LOGO_ASSETS.j.bleed, logoSrc: PLATFORM_LOGO_ASSETS.j.full, iconSrc: PLATFORM_LOGO_ASSETS.j.icon },
    { key: 't', code: 'Trendyol API', name: 'Trendyol', badge: 'إدارة المبيعات', accent: '#F27A1A', textColor: '#ffffff', short: 'T', stageBg: PLATFORM_LOGO_ASSETS.t.stageBg, tileBg: PLATFORM_LOGO_ASSETS.t.tileBg, bleed: PLATFORM_LOGO_ASSETS.t.bleed, logoSrc: PLATFORM_LOGO_ASSETS.t.full, iconSrc: PLATFORM_LOGO_ASSETS.t.icon },
    { key: 'k', code: 'Kenzz Egypt', name: 'Kenzz', badge: 'إدارة المبيعات', accent: '#6A00D5', textColor: '#ffffff', short: 'K', stageBg: PLATFORM_LOGO_ASSETS.k.stageBg, tileBg: PLATFORM_LOGO_ASSETS.k.tileBg, bleed: PLATFORM_LOGO_ASSETS.k.bleed, logoSrc: PLATFORM_LOGO_ASSETS.k.full, iconSrc: PLATFORM_LOGO_ASSETS.k.icon }
  ];

  /**
   * 2. تبويبات "حلولنا الذكية" التفاعلية على الصفحة الرئيسية (منصة + ذكاء اصطناعي + خدمات الخبراء)
   */
  const SOLUTIONS_TABS = [
    {
      id: 'ai',
      label: 'الذكاء الاصطناعي',
      icon: 'ai',
      headline: 'أدوات ذكاء اصطناعي تجهّز منتجاتك في ثوانٍ',
      lead: 'اكتب وصف المنتج، جهّز صوره، واعرف سعر السوق بدون مجهود.',
      ctaText: 'جرّب الاستوديو الآن',
      ctaAction: 'demo',
      items: [
        { icon: 'ai', name: 'كتابة الوصف و A+', desc: 'عناوين ووصف جاهز لأمازون ونون وجوميا بضغطة زر.' },
        { icon: 'camera', name: 'استوديو الصور', desc: 'صور بخلفية بيضاء نقية مطابقة لشروط المنصات.' },
        { icon: 'globe', name: 'رادار الأسعار', desc: 'قارن أسعار المنافسين واختر أفضل سعر لمنتجك.' },
        { icon: 'message', name: 'المساعد الذكي', desc: 'إجابات سريعة على أسئلة الشحن والضرائب والمرتجعات.' },
        { icon: 'calc', name: 'حاسبة الأرباح', desc: 'اعرف صافي ربح القطعة قبل ما تنشرها.' },
        { icon: 'brain', name: 'مستشار النمو', desc: 'اقتراحات سريعة لزيادة مبيعاتك وإعادة التوريد.' }
      ]
    },
    {
      id: 'ops',
      label: 'إدارة العمليات',
      icon: 'layers',
      headline: 'مخزونك وطلباتك وتحصيلاتك في شاشة واحدة',
      lead: 'تابع كل متاجرك وشركات الشحن من مكان واحد بدل التنقل بين ٥ لوحات.',
      ctaText: 'شاهد لوحة التحكم',
      ctaAction: 'demo',
      items: [
        { icon: 'sync', name: 'مخزون متزامن لحظيًا', desc: 'أي مبيعة تُخصم فورًا من باقي المنصات لمنع الإلغاء.' },
        { icon: 'ord', name: 'الطلبات والبوالص', desc: 'اطبع بوالص بوسطة وأرامكس وأكّد الطلب بواتساب.' },
        { icon: 'returns', name: 'متابعة المرتجعات', desc: 'قلّل رفض الاستلام وأعد المخزون السليم تلقائيًا.' },
        { icon: 'customers', name: 'سجل العملاء', desc: 'اعرف عملاءك وأكثر المحافظات طلبًا لمنتجاتك.' }
      ]
    },
    {
      id: 'experts',
      label: 'خدمات الخبراء',
      icon: 'briefcase',
      headline: 'فريق متخصص يساعدك في تأسيس ونمو متجرك',
      lead: 'نفتح حساباتك، نجهّز صفحات منتجاتك، وندير إعلاناتك خطوة بخطوة.',
      ctaText: 'احجز استشارة مجانية',
      ctaAction: 'open-consult',
      items: [
        { icon: 'award', name: 'فتح وتوثيق الحسابات', desc: 'تفعيل حسابك على أمازون ونون وجوميا بدون تعقيد.' },
        { icon: 'layers', name: 'تجهيز الكتالوج و A+', desc: 'تصميم صفحات بيعية وصور احترافية ترفع المبيعات.' },
        { icon: 'briefcase', name: 'إدارة كاملة للحساب', desc: 'مدير حساب يتابع الطلبات والمخزون يوميًا عنك.' },
        { icon: 'shield', name: 'حماية صحة الحساب', desc: 'حل تنبيهات المنصات والحفاظ على تقييم متجرك.' }
      ]
    }
  ];

  /**
   * 3. كتالوج خدمات الخبراء وإدارة الحسابات (لصفحة #/services والصفحة الرئيسية)
   */
  const EXPERT_SERVICES_UI = [
    {
      key: 'account_setup',
      icon: 'award',
      badge: 'تأسيس سريع',
      title: 'فتح وتوثيق حسابات البائعين',
      desc: 'إعداد كامل لحساباتك على أمازون مصر (SPN) ونون وجوميا وترينديول مع مراجعة المستندات والربط البنكي.',
      sla: 'خلال ٤٨ ساعة عمل',
      priceLabel: 'مجاني مع الاحترافية أو ٧٥٠ ج.م',
      deliverables: ['تجهيز ومراجعة السجل التجاري والبطاقة الضريبية', 'تفعيل حسابات أمازون ونون وجوميا وترينديول', 'ضبط إعدادات الشحن والربط مع OrderFlow']
    },
    {
      key: 'aplus_content',
      icon: 'camera',
      badge: 'مضاعفة التحويل',
      title: 'تصميم صفحات المنتجات ومحتوى A+',
      desc: 'بناء صفحات بيعية احترافية تتضمن صور الاستوديو البيضاء والإنفوجرافيك ومحتوى A+ المتوافق مع SEO.',
      sla: 'خلال ٣ أيام عمل',
      priceLabel: 'تبدأ من ٩٥٠ ج.م (١٠ منتجات)',
      deliverables: ['عناوين ونقاط بيعية متوافقة مع A9 وNoon Search', 'تصميم ٣ شرائح محتوى A+ لكل منتج رئيسي', 'تجهيز صور بخلفية بيضاء نقية ومقاسات المنصات']
    },
    {
      key: 'ppc_ads',
      icon: 'trendUp',
      badge: 'نمو المبيعات',
      title: 'إدارة الإعلانات الممولة (PPC)',
      desc: 'إدارة احترافية لحملات Amazon Sponsored وNoon Ads مع استهداف كلمات بحثية عالية التحويل وتقارير ACOS.',
      sla: 'تقرير أداء أسبوعي',
      priceLabel: '١٬٨٠٠ ج.م / شهريًا',
      deliverables: ['بحث الكلمات المفتاحية الأعلى شراءً في مصر', 'ضبط الميزانيات اليومية وخفض تكلفة الاستحواذ', 'تقرير أسبوعي بالعائد على الإنفاق الإعلاني ROAS']
    },
    {
      key: 'full_management',
      icon: 'briefcase',
      badge: 'إدارة شاملة',
      title: 'الإدارة التشغيلية الكاملة للحساب',
      desc: 'فريق متكامل يتولى متابعة الطلبات والمخزون والمرتجعات والتسعير وصحة الحساب يوميًا بالنيابة عنك.',
      sla: 'مدير حساب مخصص يوميًا',
      priceLabel: 'باقة مخصصة حسب حجم المتجر',
      deliverables: ['مدير حساب مخصص لمتابعة الأسواق الثلاثة وأكثر', 'إدارة التوريد وFBA / Noon Express والمرتجعات', 'اجتماع مراجعة أرباح وتسوية مالية كل أسبوعين']
    },
    {
      key: 'team_training',
      icon: 'book',
      badge: 'تدريب عملي',
      title: 'تدريب فريقك على معايير الأسواق',
      desc: 'ورش عمل تطبيقية لتأهيل فريق تشغيل متجرك على إدارة أمازون ونون وجوميا وقراءة تقارير الربحية.',
      sla: 'جلستان عمليتان أونلاين',
      priceLabel: '١٬٢٠٠ ج.م للفريق بالكامل',
      deliverables: ['شرح عملي لقوانين Buy Box وصحة حساب البائع', 'تطبيق حي على حساب الأرباح وتقليل RTO', 'دليل تشغيل داخلي (SOP) جاهز لفريقك']
    },
    {
      key: 'growth_consult',
      icon: 'message',
      badge: 'مجانية بالكامل',
      title: 'استشارة نمو وتسعير مجانية (٣٠ دقيقة)',
      desc: 'جلسة تشخيصية مع خبير تجارة إلكترونية لتحليل متجرك الحالي ورسم خارطة طريق عملية لمضاعفة مبيعاتك.',
      sla: 'تواصل خلال ٢٤ ساعة',
      priceLabel: '٠ ج.م · مجانية بالكامل',
      deliverables: ['مراجعة سريعة لأهم ٣ فرص زيادة ربح في متجرك', 'تقييم جاهزيتك للتوسع على نون وترينديول وكنز', 'خطة عمل قابلة للتنفيذ الفوري بدون التزام']
    }
  ];

  /**
   * 4. أكاديمية التاجر (المدونة وأدلة البائعين العملية)
   */
  const SELLER_GUIDES = [
    {
      id: 'amazon-spn-egypt',
      category: 'أمازون مصر',
      readMin: '٥ دقائق قراءة',
      title: 'دليل التاجر الشامل للبدء والربح على أمازون مصر (FBA مقابل FBM)',
      summary: 'كيف تفوز بصندوق الشراء Buy Box وتختار بين الشحن عبر أمازون (FBA) أو الشحن الذاتي (FBM) بدون خسارة هامش ربحك.',
      takeaways: [
        'ابدأ بإرسال أعلى ٥ منتجات مبيعًا إلى مخازن أمازون FBA للحصول على شارة Prime وزيادة التحويل حتى ٤٠٪.',
        'احتفظ بالمخزون الاحتياطي متزامنًا على OrderFlow لتفادي نفاد الكمية وهبوط ترتيب المنتج في بحث A9.',
        'احسب عمولة الفئة (١٠٪–١٥٪) + ١٤٪ ضريبة قيمة مضافة على العمولة قبل تثبيت السعر النهائي.'
      ],
      sections: [
        { h: '١. متى تختار FBA ومتى تختار FBM؟', p: 'يفضّل استخدام FBA للمنتجات خفيفة الوزن وسريعة الدوران (أكثر من ٣٠ طلبًا شهريًا) لأن رسوم التخزين تكون منخفضة ومعدل رفض الاستلام أقل بكثير. أما المنتجات كبيرة الحجم أو البطيئة فاشحنها عبر FBM مع بوسطة أو أرامكس.' },
        { h: '٢. أسرار الفوز بـ Buy Box في السوق المصري', p: 'لا يعتمد Buy Box على أقل سعر فقط؛ بل على سرعة الشحن، معدل الإلغاء الصفري، وتوفر المخزون المستمر. ربط متجرك عبر OrderFlow يمنع البيع على المكشوف ويحافظ على تقييم حسابك فوق ٩٨٪.' },
        { h: '٣. تجهيز صفحة المنتج وفق معايير أمازون', p: 'استخدم خلفية بيضاء نقية للصورة الأولى (#FFFFFF) وعنوانًا واضحًا يضم الاسم والموديل والميزة الرئيسية، ثم أضف ٤ نقاط بيعية ومحتوى A+ عبر استوديو الذكاء الاصطناعي في OrderFlow.' }
      ]
    },
    {
      id: 'noon-fbpi-growth',
      category: 'نون مصر',
      readMin: '٤ دقائق قراءة',
      title: 'شرح نموذج نون السريع (Noon FBPI / Express) ومضاعفة الظهور',
      summary: 'خطوات تجهيز الباركود والكتالوج وتفعيل شارة نون إكسبريس لرفع مبيعاتك في القاهرة والإسكندرية والدلتا.',
      takeaways: [
        'المنتجات الحاصلة على شارة Express تحصد أكثر من ٦٥٪ من نقرات المتسوقين على تطبيق نون.',
        'توحيد رموز SKU بين نون وأمازون داخل OrderFlow يختصر ٨٠٪ من وقت الجرد الأسبوعي.',
        'تابع تسعير المنافسين أسبوعيًا عبر رادار الأسعار لتبقى داخل النطاق التنافسي دون حرق الهامش.'
      ],
      sections: [
        { h: '١. تجهيز الكتالوج بدون رفض من فريق الجودة', p: 'أكثر أسباب رفض منتجات نون شيوعًا هي الصور التي تحتوي على شعارات مائية أو خلفيات ملونة. يمكنك الآن توليد صور بخلفية بيضاء مطابقة تمامًا عبر «استوديو الصور» داخل لوحة التحكم.' },
        { h: '٢. إدارة العروض الموسمية والجمعة الصفراء', p: 'قبل الدخول في أي عرض خصم على نون، أدخل سعر العرض في حاسبة الأرباح وتأكد أن صافي الربح بعد عمولة ١٠٪ وضريبة ١٤٪ يغطي تكلفة التغليف والشحن بهامش إيجابي.' }
      ]
    },
    {
      id: 'reduce-cod-rto-egypt',
      category: 'الشحن و COD',
      readMin: '٦ دقائق قراءة',
      title: 'خطة عملية لتقليل مرتجعات الدفع عند الاستلام (RTO) بنسبة ٤٠٪',
      summary: 'أكبر عدو لصافي ربح التاجر المصري هو الشحنات المرتجعة. إليك ٤ إجراءات مجربة لحماية هامشك وتدفقاتك النقدية.',
      takeaways: [
        'تأكيد الطلب برسالة واتساب مهذبة قبل تسليمه للمندوب يخفض رفض الاستلام بنسبة ٣٠٪–٤٢٪.',
        'شحن طلبات القاهرة والجيزة خلال ٢٤ ساعة يضاعف نسبة التسليم الناجح مقارنة بالتأخير لـ ٣ أيام.',
        'أضف مخصص RTO (٥٪–٨٪) داخل تسعيرك من اليوم الأول حتى لا تتآكل أرباحك في نهاية الشهر.'
      ],
      sections: [
        { h: '١. قاعدة الـ ١٥ دقيقة لتأكيد طلبات COD', p: 'كلما تواصلت مع العميل أسرع لتأكيد العنوان وموعد التواجد، زادت جديته في الاستلام. يولّد OrderFlow رسالة واتساب جاهزة ببيانات كل طلب بضغطة واحدة.' },
        { h: '٢. مطابقة تحصيلات بوسطة وأرامكس ومايلرز', p: 'لا تترك تحصيلاتك مبعثرة؛ راجع شاشة تحصيلات COD أسبوعيًا وطابق كل شحنة مسلّمة واسحب الرصيد مباشرة إلى حسابك على إنستاباي لإعادة تدوير رأس المال.' }
      ]
    },
    {
      id: 'egypt-vat-eta-profits',
      category: 'المالية والضرائب',
      readMin: '٥ دقائق قراءة',
      title: 'كيف تحسب ضريبة ١٤٪ على العمولات وتصدر فواتير ETA بدون أخطاء',
      summary: 'لماذا يظن كثير من التجار أنهم يربحون بينما رصيدهم البنكي يتناقص؟ دليلك المبسط لضبط الحسابات بالجنيه المصري.',
      takeaways: [
        'ضريبة القيمة المضافة ١٤٪ تُحتسب فوق عمولة المنصة نفسها (مثلًا عمولة ١٢٪ تصبح فعليًا ١٣٫٦٨٪).',
        'نقطة التعادل الحقيقية يجب أن تشمل: تكلفة البضاعة + الشحن + العمولة بضريبتها + مخصص المرتجعات.',
        'إصدار فاتورة إلكترونية مبسطة برمز QR لكل طلب يحمي متجرك عند المراجعة الضريبية.'
      ],
      sections: [
        { h: '١. معادلة الربح الصافي الحقيقية في مصر', p: 'إذا بعت منتجًا بـ ٦٥٠ ج.م وتكلفته ٣٦٠ ج.م على أمازون بعمولة ١٢٪، فالعمولة ٧٨ ج.م + ١٠٫٩ ج.م ضريبة ق.م + ٤٠ ج.م شحن + ٤٫٣ ج.م مخصص مرتجعات = صافي ربح فعلي ١٥٦٫٨ ج.م فقط.' },
        { h: '٢. أتمتة الفواتير الضريبية المبسطة', p: 'أضف رقمك الضريبي مرة واحدة في إعدادات OrderFlow ليُدرج تلقائيًا في كل فاتورة ضريبية برمز QR جاهز للطباعة أو الإرسال للعميل.' }
      ]
    }
  ];

  /**
   * 5. حساب خطوات الإعداد الذكي للمتجر (Guided Onboarding Checklist — Pure Function)
   */
  function computeOnboardingProgress(stateObj, productsList, aiCacheObj) {
    const integrations = (stateObj && stateObj.integrations) || {};
    const hasMarket = Boolean(integrations.a || integrations.n || integrations.j || integrations.t || integrations.k);
    const hasProducts = Array.isArray(productsList) && productsList.length > 0;
    const hasInstapay = Boolean(stateObj && String(stateObj.instaPayHandle || '').trim().length >= 3);
    const hasAi = Boolean(aiCacheObj && (aiCacheObj.advisor || aiCacheObj.market || aiCacheObj.listing));

    const steps = [
      {
        id: 'market',
        title: 'ربط أول سوق إلكتروني',
        desc: 'فعّل أمازون أو نون أو جوميا أو ترينديول من التكاملات',
        done: hasMarket,
        href: '#/int',
        cta: hasMarket ? 'تم الربط' : 'ربط الآن'
      },
      {
        id: 'product',
        title: 'إضافة وتوحيد منتجات الكتالوج',
        desc: 'أضف منتجك الأول بسعر البيع والتكلفة والمخزون',
        done: hasProducts,
        href: '#/prod',
        cta: hasProducts ? `${productsList.length} منتج` : 'إضافة منتج'
      },
      {
        id: 'instapay',
        title: 'ضبط عنوان InstaPay لتحصيلات COD',
        desc: 'لسحب مستحقات بوسطة وأرامكس ومايلرز لحظيًا',
        done: hasInstapay,
        href: '#/set',
        cta: hasInstapay ? 'مضبوط' : 'ضبط الحساب'
      },
      {
        id: 'ai',
        title: 'تجربة استوديو الذكاء الاصطناعي',
        desc: 'ولّد محتوى SEO وصور استوديو وفحص أسعار السوق',
        done: hasAi,
        href: '#/ai',
        cta: hasAi ? 'مُفعّل' : 'فتح الاستوديو'
      }
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const totalCount = steps.length;
    const percent = Math.round((completedCount / totalCount) * 100);
    return { steps, completedCount, totalCount, percent, isComplete: completedCount === totalCount };
  }

  /**
   * 6. استوديو صور المنتجات (Canvas Studio Generator — متوافق مع شروط أمازون ونون)
   * يرسم بطاقة صورة منتج احترافية قابلة للتحميل PNG والحفظ المباشر في الكتالوج.
   */
  function renderStudioPhotoOnCanvas(canvas, opts = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    const ratio = opts.ratio === '4:5' ? '4:5' : '1:1';
    const W = 800;
    const H = ratio === '4:5' ? 1000 : 800;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const preset = opts.preset || 'pure-white';
    const title = String(opts.title || 'منتج مميز عالي الجودة').trim().slice(0, 46);
    const badgeText = String(opts.badgeText || '').trim().slice(0, 24);
    const priceText = String(opts.priceText || '').trim().slice(0, 24);
    const imgEl = opts.imageElement || null;

    // 1. Background
    if (preset === 'pure-white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
    } else if (preset === 'studio-pearl') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#F8FBFF');
      grad.addColorStop(0.55, '#EDF5FC');
      grad.addColorStop(1, '#E2EFFA');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Soft radial studio spotlight
      const rad = ctx.createRadialGradient(W * 0.5, H * 0.44, 40, W * 0.5, H * 0.44, W * 0.48);
      rad.addColorStop(0, 'rgba(255,255,255,0.95)');
      rad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, W, H);
    } else if (preset === 'promo-ocean') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#071D35');
      grad.addColorStop(0.6, '#0B3E73');
      grad.addColorStop(1, '#0EA5C6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Center white podium card for high contrast
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, 76, 118, W - 152, H - 270, 34);
      ctx.fill();
    }

    // 2. Soft floor shadow under product
    const prodCenterY = preset === 'promo-ocean' ? H * 0.46 : H * 0.47;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.5, prodCenterY + 195, 190, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(11, 29, 51, 0.11)';
    ctx.fill();
    ctx.restore();

    // 3. Draw uploaded/selected product image OR crisp vector product pedestal
    const boxW = W * 0.62;
    const boxH = H * 0.52;
    const boxX = (W - boxW) / 2;
    const boxY = (preset === 'promo-ocean' ? 148 : 110);

    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      const scale = Math.min(boxW / imgEl.naturalWidth, boxH / imgEl.naturalHeight);
      const dw = imgEl.naturalWidth * scale;
      const dh = imgEl.naturalHeight * scale;
      const dx = (W - dw) / 2;
      const dy = boxY + (boxH - dh) / 2;
      ctx.save();
      roundRect(ctx, dx, dy, dw, dh, 22);
      ctx.clip();
      ctx.drawImage(imgEl, dx, dy, dw, dh);
      ctx.restore();
    } else {
      // Crisp geometric studio product showcase placeholder
      ctx.save();
      const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
      boxGrad.addColorStop(0, '#0B57A4');
      boxGrad.addColorStop(1, '#0EA5C6');
      ctx.fillStyle = boxGrad;
      roundRect(ctx, W * 0.28, boxY + 40, W * 0.44, boxH - 80, 34);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      roundRect(ctx, W * 0.32, boxY + 72, W * 0.36, 48, 14);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 32px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OrderFlow Studio', W * 0.5, boxY + boxH * 0.52);
      ctx.font = '600 20px Cairo, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText('ارفع صورة منتجك أو اختر من الكتالوج', W * 0.5, boxY + boxH * 0.52 + 42);
      ctx.restore();
    }

    // 4. Optional Arabic quality badge (top-right in RTL)
    if (badgeText && preset !== 'pure-white') {
      ctx.save();
      ctx.font = '800 24px Cairo, sans-serif';
      const tw = ctx.measureText(badgeText).width;
      const pw = Math.min(340, tw + 52);
      const ph = 54;
      const px = W - pw - 42;
      const py = 40;
      const bGrad = ctx.createLinearGradient(px, py, px + pw, py);
      bGrad.addColorStop(0, '#0B57A4');
      bGrad.addColorStop(1, '#0EA5C6');
      ctx.fillStyle = bGrad;
      roundRect(ctx, px, py, pw, ph, 14);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, px + pw / 2, py + ph / 2 + 2);
      ctx.restore();
    }

    // 5. Optional footer title & price bar (hidden on strict pure-white Amazon main image mode)
    if (preset !== 'pure-white') {
      ctx.save();
      const footerY = H - 118;
      ctx.fillStyle = preset === 'promo-ocean' ? '#FFFFFF' : '#0B1D33';
      ctx.font = '800 30px Alexandria, Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, W / 2, footerY);
      if (priceText) {
        ctx.fillStyle = preset === 'promo-ocean' ? '#6EE7F7' : '#0B57A4';
        ctx.font = '800 28px Alexandria, Cairo, sans-serif';
        ctx.fillText(priceText, W / 2, footerY + 46);
      }
      ctx.restore();
    }

    return canvas.toDataURL('image/jpeg', 0.86);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  return {
    PLATFORM_LOGO_ASSETS,
    PLATFORM_LOGOS: PLATFORM_LOGO_ASSETS,
    renderPlatformLogo,
    PARTNER_CERTIFICATIONS,
    SOLUTIONS_TABS,
    EXPERT_SERVICES_UI,
    SELLER_GUIDES,
    computeOnboardingProgress,
    renderStudioPhotoOnCanvas
  };
});
