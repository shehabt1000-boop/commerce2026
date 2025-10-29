// =============================================
// ==== PWA INSTALLATION LOGIC (المنطق الذكي) ====
// =============================================

// 1. تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js', { scope: './' }) // إضافة scope: './'
            .then(reg => {
                console.log('✅ Service Worker registered successfully! Scope:', reg.scope);
            })
            .catch(err => {
                console.error('❌ Service Worker registration failed: ', err);
            });
    });
}

// 2. اعتراض حدث التثبيت وعرض البانر
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎉 beforeinstallprompt fired!'); // تأكيد أن المتصفح أطلق الحدث
    
    e.preventDefault();
    deferredInstallPrompt = e;
    
    // إظهار البانر الأحمر فقط إذا لم يكن التطبيق مثبتاً بالفعل
    // التحقق من أن المتصفح ليس في وضع "التطبيق المستقل"
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        installBanner.classList.remove('hidden');
    }
});

// 3. معالجة النقر على زر التثبيت
// ... (بقية الكود كما هو)