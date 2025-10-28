// 1. استيراد وظائف Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    collection, 
    query, 
    where, 
    onSnapshot, 
    Timestamp,
    updateDoc,
    runTransaction,
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// 2. إعدادات Firebase (من المستخدم)
const firebaseConfig = {
    apiKey: "AIzaSyA5OiTcX95GBgiJoDHnY3y7N23o-j8hsQ8",
    authDomain: "services-cef84.firebaseapp.com",
    databaseURL: "https://services-cef84-default-rtdb.firebaseio.com",
    projectId: "services-cef84",
    storageBucket: "services-cef84.firebasestorage.app",
    messagingSenderId: "902396219187",
    appId: "1:902396219187:web:3ba084a724266afa8bb846"
};

// 3. تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 4. متغيرات الحالة العامة
let userId = null;
let userProfile = null;
let currentUnsubscribe = null; 
const appId = typeof __app_id !== 'undefined' ? __app_id : 'services-cef84'; 
let isRegistering = false;
let allUsers = []; 
let previousPage = { page: 'home', params: {} };
let currentPage = { page: 'home', params: {} };

// قائمة الخدمات الموسعة جداً
const SERVICES_LIST = [
    { name: 'سباك', icon: '🔧', categorySearch: 'سباك' },
    { name: 'كهربائي', icon: '💡', categorySearch: 'كهربائي' },
    { name: 'نجار', icon: '🪚', categorySearch: 'نجار' },
    { name: 'فني تبريد وتكييف', icon: '❄️', categorySearch: 'تكييف' },
    { name: 'فني صيانة هواتف', icon: '📱', categorySearch: 'هواتف' },
    { name: 'فني صيانة شاشات', icon: '📺', categorySearch: 'شاشات' },
    { name: 'فني صيانة أجهزة', icon: '🔌', categorySearch: 'اجهزة' },
    { name: 'فني صيانة دش', icon: '📡', categorySearch: 'دش' },
    { name: 'عامل بناء / محارة', icon: '🧱', categorySearch: 'عامل بناء محارة' },
    { name: 'نقاش / دهانات', icon: '🎨', categorySearch: 'نقاش دهانات' },
    { name: 'مهندس مدني', icon: '🏗️', categorySearch: 'مهندس مدني' }, 
    { name: 'مهندس معماري', icon: '📐', categorySearch: 'مهندس معماري' }, 
    { name: 'مهندس زراعي', icon: '🌾', categorySearch: 'مهندس زراعي' }, 
    { name: 'مهندس حاسبات / برمجة', icon: '💻', categorySearch: 'مهندس حاسبات برمجة' }, 
    { name: 'مدرس / معلم', icon: '📚', categorySearch: 'مدرس معلم تعليمية' }, 
    { name: 'سكرتير / سكرتارية', icon: '📁', categorySearch: 'سكرتير سكرتارية' }, 
    { name: 'محاسب / كاتب حسابات', icon: '🧾', categorySearch: 'محاسب كاتب حسابات' }, 
    { name: 'خدمات طبية / طبيب', icon: '🩺', categorySearch: 'طبية طبيب' },
    { name: 'ممرض / تمريض منزلي', icon: '🩹', categorySearch: 'ممرض تمريض' },
    { name: 'نقل وشحن / عفش', icon: '🚚', categorySearch: 'نقل شحن عفش' },
    { name: 'خدمات قانونية / محامي', icon: '⚖️', categorySearch: 'قانونية محامي' },
    { name: 'تنظيف منازل', icon: '🧹', categorySearch: 'تنظيف منازل' },
    { name: 'طباخ / شيف', icon: '🧑‍🍳', categorySearch: 'طباخ شيف' },
    { name: 'مصور', icon: '📸', categorySearch: 'مصور' },
    { name: 'خياط / ترزي', icon: '🧵', categorySearch: 'خياط ترزي' },
    { name: 'حداد', icon: '🔗', categorySearch: 'حداد' },
    { name: 'مزارع / جنايني', icon: '🌿', categorySearch: 'مزارع جنايني زراعة' },
    { name: 'خدمات عامة / أخرى', icon: '👥', categorySearch: 'خدمات عامة أخرى' },
];

// 5. أيقونات SVG 
const ICONS = {
    star: `<svg class="star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`,
    starEmpty: `<svg class="star-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.31h5.513c.498 0 .704.656.34.985l-4.46 4.062a.562.562 0 0 0-.162.541l1.618 5.22c.19.613-.526 1.09-1.04.724l-4.59-3.44a.563.563 0 0 0-.642 0l-4.59 3.44c-.514.366-1.23-.111-1.04-.724l1.618-5.22a.562.562 0 0 0-.162-.541l-4.46-4.062a.563.563 0 0 1 .34-.985h5.513a.563.563 0 0 0 .475.31l2.125-5.112Z" /></svg>`,
    home: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-3.741-5.582M11.995 12.75a9.004 9.004 0 0 1-5.214 0m-2.5 4.972a9.094 9.094 0 0 1 3.741-.479 3 3 0 0 1 3.741 5.582M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-5.214 0a9.004 9.004 0 0 0 5.214 0M12 12a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm5.214 0a9.004 9.004 0 0 0-5.214 0" /></svg>`,
    add: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
    profile: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
    chat: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 0 1-1.06 0l-3.72-3.72C9.847 17.1 9 16.136 9 15v-4.286c0-.97 0.616-1.813 1.5-2.097l6.75-3.375c.22-.11.459-.11.679 0l6.75 3.375Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.5c.884-.284 1.5-1.128 1.5-2.097V7.116c0-1.136.847-2.1 1.98-2.193l3.72-3.72a.75.75 0 0 1 1.06 0l3.72 3.72C16.153 5.016 17 5.98 17 7.116v4.286c0 .97-.616 1.813-1.5 2.097l-6.75 3.375a.625.625 0 0 1-.679 0L3 13.5Z" /></svg>`,
    logout: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>`, // RTL back arrow
    send: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L6 12Z" /></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 18.07a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Zm0 0L19.5 7.125" /></svg>`,
};

// 6. الحاوية الرئيسية
const appContainer = document.getElementById('app');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContent = document.getElementById('modal-content');

// 7. وظائف مساعدة (Modal)
function showModal(html) {
    modalContent.innerHTML = html;
    modalBackdrop.classList.remove('hidden');
}

function hideModal() {
    modalBackdrop.classList.add('hidden');
    modalContent.innerHTML = '';
}

function showLoading(message = 'جاري التحميل...') {
    const html = `
        <div class="flex flex-col items-center justify-center p-8">
            <svg class="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-700 font-medium">${message}</p>
        </div>
    `;
    showModal(html);
}

function hideLoading() {
    hideModal();
}

// دالة لعرض رسالة نجاح/خطأ قصيرة (بديل لـ alert)
function showMessageModal(title, message, isSuccess = true) {
    const color = isSuccess ? 'text-green-600' : 'text-red-600';
    const html = `
        <h2 class="text-xl font-semibold text-center ${color} mb-4">${title}</h2>
        <p class="text-center text-gray-700">${message}</p>
        <button data-action="closeModal" class="mt-4 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">حسناً</button>
    `;
    showModal(html);
}

// 8. وظائف التوجيه (Routing) 
function navigateTo(page, params = {}) {
    console.log(`Navigating to: ${page}`, params);
    // إلغاء أي اشتراك حالي
    if (currentUnsubscribe) {
        currentUnsubscribe();
        currentUnsubscribe = null;
        console.log('Unsubscribed from real-time listener.');
    }
    appContainer.innerHTML = '';
    // تنظيف الصفحة

    // تحديث سجل التصفح
    if (page !== 'loading' && page !== 'auth' && page !== 'register') {
        if (currentPage.page !== page || JSON.stringify(currentPage.params) !== JSON.stringify(params)) {
            previousPage = currentPage;
            currentPage = { page, params };
        }
    } else if (page === 'auth' || page === 'register') {
        previousPage = { page: 'home', params: {} };
        currentPage = { page, params };
    }

    switch (page) {
        case 'loading':
            renderLoadingScreen();
            break;
        case 'auth':
            renderAuthPage();
            break;
        case 'register':
            renderRegisterPage();
            break;
        case 'clientHome':
            renderClientHome();
            break;
        case 'providerHome':
            renderProviderHome();
            break;
        case 'category':
            renderCategoryPage(params.category);
            break;
        case 'directory':
            renderDirectoryPage();
            break;
        case 'chatList':
            renderChatListPage();
            break;
        case 'profile':
            renderProfilePage(params.uid);
            break;
        case 'editProfile': 
            renderEditProfilePage();
            break;
        case 'chat':
            renderChatPage(params.otherUserId);
            break;
        case 'newRequest':
            renderNewRequestPage();
            break;
        default:
            renderAuthPage();
    }
}

// 9. وظائف عرض الصفحات (Render Functions)

function renderLoadingScreen() {
    appContainer.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
            <div class="flex flex-col items-center">
                <svg class="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h1 class="text-xl font-semibold text-gray-700">جاري تهيئة التطبيق...</h1>
            </div>
        </div>
    `;
}

function renderAuthPage() {
    appContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen p-8 bg-blue-600">
            <h1 class="text-4xl font-bold text-white mb-4">خدماتي</h1>
            <p class="text-lg text-blue-100 mb-12">أهلاً بك في تطبيق خدمات محافظة الشرقية</p>
            
            <div class="w-full max-w-sm bg-white rounded-lg shadow-xl p-8">
                <form id="login-form" class="space-y-4">
                    
                    <h2 class="text-2xl font-semibold text-center text-gray-800 mb-6">تسجيل الدخول</h2>
                    <div id="login-error" class="text-red-500 text-sm text-center hidden"></div>
                    
                    <div>
                        <label for="login-identifier" class="block text-sm font-medium text-gray-700">اسم المستخدم</label>
                        <input type="text" id="login-identifier" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="ادخل اسم المستخدم">
                    </div>
                    <div>
                        <label for="login-password" class="block text-sm font-medium text-gray-700">كلمة المرور</label>
                        <input type="password" id="login-password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="********">
                    </div>
                    <button type="submit" data-action="login" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        دخول
                    </button>
                </form>
                
                <div class="my-6 flex items-center justify-center">
                    <span class="border-t border-gray-300 flex-grow"></span>
                    <span class="px-4 text-sm text-gray-500">أو</span>
                    <span class="border-t border-gray-300 flex-grow"></span>
                </div>
                
                <button data-action="navigateTo" data-page="register" class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    إنشاء حساب جديد
                </button>
            </div>
        </div>
    `;
}

// --- صفحة التسجيل المحدثة (بدون بريد إلكتروني) ---
function renderRegisterPage() {
    // إنشاء خيارات القائمة المنسدلة
    const serviceOptions = SERVICES_LIST.map(service => 
        `<option value="${service.name}">${service.name}</option>`
    ).join('');
    appContainer.innerHTML = `
        <div class="min-h-screen p-8 bg-gray-100">
            <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">إنشاء حساب جديد</h1>
            <form id="register-form" class="space-y-6 bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
                
                <div id="register-error" class="text-red-500 text-sm text-center hidden"></div>
                
                <div>
                    <label for="register-username" class="block text-sm font-medium text-gray-700">اسم المستخدم (يستخدم لتسجيل الدخول)</label>
                    <input type="text" id="register-username" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="مثال: myname123">
                </div>
                
                <div>
                    <label for="register-password" class="block text-sm font-medium text-gray-700">كلمة المرور (6 حروف أو أرقام على الأقل)</label>
                    <input type="password" id="register-password" required minlength="6" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="********">
                </div>
                
                <hr class="my-4">
                
                <div>
                    <label for="register-name" class="block text-sm font-medium text-gray-700">الاسم الكامل</label>
                    <input type="text" id="register-name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="مثال: محمد أحمد علي">
                </div>
                <div>
                    <label for="register-phone" class="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                    <input type="tel" id="register-phone" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="مثال: 01012345678">
                </div>
                <div>
                    <label for="register-address" class="block text-sm font-medium text-gray-700">العنوان (المدينة / المركز)</label>
                    <input type="text" id="register-address" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="مثال: الزقازيق، القومية">
                </div>
            
                <div>
                    <label for="register-photo" class="block text-sm font-medium text-gray-700 text-center">الصورة الشخصية</label>
                    <div class="mt-2 flex justify-center">
                        <label for="register-photo" class="relative cursor-pointer">
                            <img id="photo-preview" class="w-24 h-24 rounded-full object-cover border-2 border-gray-300" 
                                 src="https://placehold.co/100x100/EBF8FF/3182CE?text=اختيار+صورة" alt="معاينة الصورة">
                            <input type="file" id="register-photo" accept="image/*" class="sr-only">
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700">أرغب في التسجيل كـ:</label>
                    <div class="mt-2 flex space-x-4 space-x-reverse">
                        <label class="flex items-center">
                            <input type="radio" name="role" value="client" class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" checked>
                            <span class="mr-2 text-gray-700">عميل (أبحث عن خدمة)</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="role" value="provider" class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300">
                            <span class="mr-2 text-gray-700">مقدم خدمة (أقدم خدمة)</span>
                        </label>
                    </div>
                </div>
                
                <div id="job-title-field" class="hidden space-y-4">
                    <div>
                        <label for="register-job-select" class="block text-sm font-medium text-gray-700">اختر وظيفتك / الخدمة:</label>
                        <select id="register-job-select" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">اختر...</option>
                            ${serviceOptions}
                            <option value="أخرى">أخرى (اذكرها بالأسفل)</option>
                        </select>
                    </div>
                    <div id="job-title-other-field" class="hidden">
                        <label for="register-job-title" class="block text-sm font-medium text-gray-700">اذكر وظيفتك:</label>
                        <input type="text" id="register-job-title" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="مثال: مصمم جرافيك">
                    </div>
                </div>

                <button type="submit" data-action="register" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    إنشاء الحساب
                </button>
                <p class="text-center text-sm text-gray-600">
                    هل لديك حساب بالفعل؟
                    <button type="button" data-action="navigateTo" data-page="auth" class="font-medium text-blue-600 hover:text-blue-500">
                        سجل الدخول
                    </button>
                </p>
            </form>
        </div>
    `;
}

// --- الدالة المساعدة لشريط التنقل السفلي ---
function renderBottomNav(activePage) {
    const navItems = [
        { page: 'home', icon: ICONS.home, label: 'الرئيسية' },
        { page: 'directory', icon: ICONS.users, label: 'مقدمو الخدمات' },
        { page: 'chatList', icon: ICONS.chat, label: 'المحادثات' },
        { page: 'profile', icon: ICONS.profile, label: 'حسابي' },
    ];

    const navHtml = navItems.map(item => {
        const isActive = activePage === item.page;
        const colorClass = isActive ? 'text-blue-600' : 'text-gray-500';
        const labelClass = isActive ? 'text-blue-600 font-semibold' : 'text-gray-500';
        const pageToNavigate = item.page === 'profile' ? { page: 'profile', params: { uid: userId } } : { page: item.page };

        return `
            <button data-action="navigateTo" data-page="${pageToNavigate.page}" data-uid="${pageToNavigate.params.uid || ''}"
                    class="flex flex-col items-center justify-center p-2 flex-grow hover:text-blue-600 transition-colors">
                <span class="w-6 h-6 ${colorClass}">${item.icon}</span>
                <span class="text-xs ${labelClass} mt-1">${item.label}</span>
            </button>
        `;
    }).join('');

    return `
        <nav class="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 shadow-xl z-20 max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl">
            <div class="flex justify-around items-center h-16">
                ${navHtml}
            </div>
        </nav>
    `;
}

// --- الصفحة الرئيسية للعميل ---
function renderClientHome() {
    // استخدام القائمة الموسعة
    const categoriesHtml = SERVICES_LIST.map(cat => `
        <div data-action="navigateTo" data-page="category" data-category="${cat.categorySearch}" class="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-500">
            <span class="text-5xl mb-3">${cat.icon}</span>
            <h3 class="text-lg font-semibold text-gray-800 text-center">${cat.name}</h3>
        </div>
    `).join('');
    appContainer.innerHTML = `
        <div class="pb-24"> <header class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
                <h1 class="text-2xl font-bold">أهلاً بك، ${userProfile.name}</h1>
                <p class="text-blue-100">ابحث عن الخدمة التي تحتاجها في محافظة الشرقية</p>
            </header>
            
            <main class="p-4 md:p-8">
                <h2 class="text-2xl font-semibold text-gray-900 mb-6">أقسام الخدمات</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    ${categoriesHtml}
                    <div data-action="navigateTo" data-page="category" data-category="" class="flex flex-col items-center justify-center bg-gray-100 text-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-500">
                        <span class="text-5xl mb-3">➕</span>
                        <h3 class="text-lg font-semibold text-center">خدمات عامة / أخرى</h3>
                    </div>
                </div>
            </main>

            <button data-action="navigateTo" data-page="newRequest" class="fixed bottom-24 left-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-blue-700 transition-colors">
                ${ICONS.add}
            </button>
            
            ${renderBottomNav('home')}
        </div>
    `;
}

// --- الصفحة الرئيسية لمقدم الخدمة ---
async function renderProviderHome() {
    appContainer.innerHTML = `
        <div class="pb-24">
            <header class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
                <h1 class="text-2xl font-bold">أهلاً بك، ${userProfile.name}</h1>
                <p class="text-blue-100">تصفح طلبات الخدمات المتاحة حالياً</p>
            </header>
            
            <main class="p-4 md:p-8">
                <h2 class="text-2xl font-semibold text-gray-900 mb-6">طلبات الخدمات المتاحة</h2>
                <div id="requests-list" class="space-y-4">
                    <p class="text-gray-500">جاري تحميل الطلبات...</p>
                </div>
            </main>

            <button data-action="navigateTo" data-page="newRequest" class="fixed bottom-24 left-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-blue-700 transition-colors">
                ${ICONS.add}
            </button>
            
            ${renderBottomNav('home')}
        </div>
    `;
    
    // جلب وعرض الطلبات
    const requestsColRef = collection(db, `artifacts/${appId}/public/data/serviceRequests`);
    currentUnsubscribe = onSnapshot(requestsColRef, (snapshot) => {
        const requestsList = document.getElementById('requests-list');
        if (snapshot.empty) {
            requestsList.innerHTML = '<p class="text-gray-500 text-center p-6">لا توجد طلبات خدمات متاحة حالياً.</p>';
            return;
        }
        
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        requestsList.innerHTML = requests.map(req => `
            <div class="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <img data-action="navigateTo" data-page="profile" data-uid="${req.requesterId}" src="${req.requesterPhoto || 'https://placehold.co/100x100/EBF8FF/3182CE?text=User'}" alt="${req.requesterName}" class="w-12 h-12 rounded-full object-cover cursor-pointer">
                        <div>
                            <h4 data-action="navigateTo" data-page="profile" data-uid="${req.requesterId}" class="font-semibold text-gray-800 cursor-pointer hover:text-blue-600">${req.requesterName}</h4>
                            <p class="text-sm text-gray-500">طلب خدمة: ${req.category}</p>
                        </div>
                    </div>
                    <span class="text-xs text-gray-400">${new Date(req.createdAt.toDate()).toLocaleDateString('ar-EG')}</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${req.title}</h3>
                <p class="text-gray-600 mb-4">${req.description}</p>
                <button data-action="navigateTo" data-page="chat" data-otheruserid="${req.requesterId}" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    تواصل مع العميل
                </button>
            </div>
        `).join('');
    }, (error) => {
        console.error("Error fetching service requests:", error);
        document.getElementById('requests-list').innerHTML = '<p class="text-red-500 text-center p-6">حدث خطأ أثناء تحميل الطلبات.</p>';
    });
}

// --- صفحة تصفح فئة الخدمات ---
async function renderCategoryPage(categorySearch) {
    const isSearchMode = !!categorySearch;
    const categoryName = isSearchMode ? SERVICES_LIST.find(s => s.categorySearch === categorySearch)?.name || 'نتائج البحث' : 'جميع مقدمي الخدمات';
    const placeholderText = isSearchMode ? `ابحث عن ${categoryName} محدد...` : `ابحث باسم مقدم خدمة أو وظيفته...`;
    
    appContainer.innerHTML = `
        <div class="pb-24">
            <header class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
                <div class="flex items-center space-x-3 space-x-reverse">
                    <button data-action="goBack" class="p-1 rounded-full hover:bg-blue-700 transition-colors">
                        ${ICONS.back}
                    </button>
                    <h1 class="text-xl font-bold">${categoryName}</h1>
                </div>
                <input type="search" id="provider-search-input" placeholder="${placeholderText}" class="mt-3 w-full p-2 rounded-md text-gray-900 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300">
            </header>

            <main class="p-4 md:p-8">
                <h2 class="text-lg font-semibold text-gray-700 mb-4">مقدمو الخدمات:</h2>
                <div id="providers-list" class="space-y-4">
                    <p class="text-gray-500">جاري تحميل مقدمي الخدمات...</p>
                </div>
            </main>
            
            ${renderBottomNav(userProfile.role === 'client' ? 'home' : 'directory')}
        </div>
    `;

    const searchInput = document.getElementById('provider-search-input');
    
    // دالة عرض مقدمي الخدمات
    const renderProviders = (users) => {
        const providersList = document.getElementById('providers-list');
        if (users.length === 0) {
            providersList.innerHTML = '<p class="text-gray-500 text-center p-6">لم يتم العثور على مقدمي خدمات مطابقين.</p>';
            return;
        }

        providersList.innerHTML = users.map(user => `
            <div data-action="navigateTo" data-page="profile" data-uid="${user.id}" class="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 space-x-reverse hover:bg-gray-50 transition-colors cursor-pointer">
                <img src="${user.photo || 'https://placehold.co/100x100/EBF8FF/3182CE?text=User'}" alt="${user.name}" class="w-16 h-16 rounded-full object-cover border border-gray-200">
                <div class="flex-grow">
                    <h3 class="text-xl font-semibold text-gray-800 truncate-1-line">${user.name}</h3>
                    <p class="text-blue-600 font-medium truncate-1-line">${user.jobTitle || 'غير محدد'}</p>
                    <div class="flex items-center text-sm text-gray-500 mt-1">
                        ${renderStars(user.rating || 0)}
                        <span class="mr-2">(${user.ratingCount || 0})</span>
                        <span class="mr-4 text-gray-400">|</span>
                        <span class="mr-4">${user.address || 'العنوان غير متوفر'}</span>
                    </div>
                </div>
                <button data-action="navigateTo" data-page="chat" data-otheruserid="${user.id}" class="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors flex-shrink-0">
                    ${ICONS.chat}
                </button>
            </div>
        `).join('');
    };

    // دالة جلب البيانات من Firebase
    const fetchProviders = async (searchTerm = '') => {
        let providersRef = collection(db, `artifacts/${appId}/public/data/users`);
        let q;
        
        // إذا كان هناك فئة محددة، نضيف شرط where عليها
        if (isSearchMode) {
            q = query(providersRef, 
                where('role', '==', 'provider'),
                where('categorySearch', 'array-contains', categorySearch.toLowerCase())
            );
        } else {
            // إذا لم يتم تحديد فئة (شاشة "جميع مقدمي الخدمات")
            q = query(providersRef, where('role', '==', 'provider'));
        }

        try {
            const snapshot = await getDocs(q);
            let providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // تطبيق البحث الإضافي (بالاسم أو بالوظيفة المذكورة)
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                providers = providers.filter(user => 
                    user.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                    user.jobTitle.toLowerCase().includes(lowerCaseSearchTerm)
                );
            }

            renderProviders(providers);
        } catch (error) {
            console.error("Error fetching providers:", error);
            document.getElementById('providers-list').innerHTML = '<p class="text-red-500 text-center p-6">حدث خطأ أثناء تحميل البيانات.</p>';
        }
    };

    // معالج حدث البحث
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchProviders(searchInput.value.trim());
        }, 300); // 300ms تأخير
    });

    // جلب البيانات الأولية
    fetchProviders();
}

// --- صفحة دليل مقدمي الخدمات (Directory) ---
function renderDirectoryPage() {
    // هذه الصفحة هي نفسها 'CategoryPage' ولكن بدون تحديد فئة، لعرض الجميع.
    renderCategoryPage('');
    
    // تعديل العنوان في DOM بعد الـ render
    const headerTitle = appContainer.querySelector('header h1');
    if (headerTitle) {
        headerTitle.textContent = 'دليل مقدمي الخدمات';
    }
}

// --- صفحة قائمة المحادثات (Chat List) ---
async function renderChatListPage() {
    appContainer.innerHTML = `
        <div class="pb-24">
            <header class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
                <h1 class="text-2xl font-bold">المحادثات (${userProfile.role === 'provider' ? 'كمقدم خدمة' : 'كعميل'})</h1>
                <p class="text-blue-100">${userProfile.role === 'provider' ? 'تواصل مع عملائك' : 'تواصل مع مقدمي الخدمات'}</p>
            </header>
            
            <main class="p-4 md:p-8">
                <div id="chat-list" class="space-y-3">
                    <p class="text-gray-500">جاري تحميل المحادثات...</p>
                </div>
            </main>
            
            ${renderBottomNav('chatList')}
        </div>
    `;

    const chatListRef = collection(db, `artifacts/${appId}/public/data/chats`);
    const q = query(chatListRef, where('participants', 'array-contains', userId));

    currentUnsubscribe = onSnapshot(q, async (snapshot) => {
        const chatListElement = document.getElementById('chat-list');
        if (!chatListElement) return; // قد تكون الصفحة قد تغيرت

        if (snapshot.empty) {
            chatListElement.innerHTML = '<p class="text-gray-500 text-center p-6">لا توجد لديك محادثات حالياً.</p>';
            return;
        }

        const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // جلب معلومات المستخدم الآخر لكل محادثة
        const chatPromises = chats.map(async (chat) => {
            const otherUserId = chat.participants.find(id => id !== userId);
            const otherUserDoc = await getDoc(doc(db, `artifacts/${appId}/public/data/users`, otherUserId));
            const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : { name: 'مستخدم محذوف', photo: 'https://placehold.co/100x100/EBF8FF/3182CE?text=?' };
            
            // ترتيب المحادثات حسب آخر رسالة
            const lastMessageTimestamp = chat.lastMessage?.timestamp?.toDate() || new Date(0);
            
            return {
                ...chat,
                otherUserId,
                otherUser,
                lastMessageTimestamp
            };
        });

        const chatsWithUserInfo = await Promise.all(chatPromises);
        
        // فرز المحادثات حسب آخر رسالة (الأحدث أولاً)
        chatsWithUserInfo.sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());

        chatListElement.innerHTML = chatsWithUserInfo.map(chat => {
            const lastMessageText = chat.lastMessage?.text ? 
                (chat.lastMessage.senderId === userId ? 'أنت: ' : '') + chat.lastMessage.text : 
                'بدء محادثة جديدة...';

            const timeString = chat.lastMessage?.timestamp ? 
                new Date(chat.lastMessage.timestamp.toDate()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 
                '';

            return `
                <div data-action="navigateTo" data-page="chat" data-otheruserid="${chat.otherUserId}" class="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 space-x-reverse hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                    <img src="${chat.otherUser.photo || 'https://placehold.co/100x100/EBF8FF/3182CE?text=User'}" alt="${chat.otherUser.name}" class="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-gray-200">
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-gray-800 truncate">${chat.otherUser.name}</h3>
                            <span class="text-xs text-gray-500 flex-shrink-0">${timeString}</span>
                        </div>
                        <p class="text-sm text-gray-500 truncate mt-1">${lastMessageText}</p>
                    </div>
                </div>
            `;
        }).join('');
    }, (error) => {
        console.error("Error fetching chat list:", error);
        chatListElement.innerHTML = '<p class="text-red-500 text-center p-6">حدث خطأ أثناء تحميل قائمة المحادثات.</p>';
    });
}

// --- صفحة المحادثة الفردية (Chat Page) ---
async function renderChatPage(otherUserId) {
    showLoading('جاري تحميل المحادثة...');
    
    // 1. جلب معلومات المستخدم الآخر
    const otherUserDoc = await getDoc(doc(db, `artifacts/${appId}/public/data/users`, otherUserId));
    const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : { name: 'مستخدم محذوف', photo: 'https://placehold.co/100x100/EBF8FF/3182CE?text=?' };
    
    // 2. إنشاء معرف المحادثة (ترتيب أبجدي)
    const chatId = [userId, otherUserId].sort().join('_');
    
    hideLoading(); // إخفاء شاشة التحميل

    appContainer.innerHTML = `
        <div class="flex flex-col h-screen">
            <header class="bg-white border-b border-gray-200 p-4 shadow-md sticky top-0 z-10 flex items-center space-x-3 space-x-reverse">
                <button data-action="goBack" class="p-1 rounded-full text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0">
                    ${ICONS.back}
                </button>
                <img data-action="navigateTo" data-page="profile" data-uid="${otherUserId}" src="${otherUser.photo || 'https://placehold.co/100x100/EBF8FF/3182CE?text=User'}" alt="${otherUser.name}" class="w-10 h-10 rounded-full object-cover cursor-pointer flex-shrink-0">
                <div data-action="navigateTo" data-page="profile" data-uid="${otherUserId}" class="cursor-pointer">
                    <h1 class="text-lg font-semibold text-gray-800 truncate">${otherUser.name}</h1>
                    <p class="text-sm text-gray-500">${otherUser.jobTitle || ''}</p>
                </div>
            </header>

            <main id="messages-container" class="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar bg-gray-100">
                </main>

            <div class="bg-white border-t border-gray-200 p-3 sticky bottom-0 z-10">
                <form id="chat-form" class="flex items-center space-x-2 space-x-reverse">
                    <input type="text" id="message-input" placeholder="اكتب رسالتك..." required class="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button type="submit" data-action="sendMessage" data-chatid="${chatId}" data-otheruserid="${otherUserId}" class="bg-blue-600 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 transition-colors flex-shrink-0">
                        ${ICONS.send}
                    </button>
                </form>
            </div>
        </div>
    `;

    const messagesContainer = document.getElementById('messages-container');
    
    // 3. عرض الرسائل في الوقت الحقيقي
    const messagesColRef = collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`);
    const qMessages = query(messagesColRef, orderBy('timestamp', 'asc'));

    currentUnsubscribe = onSnapshot(qMessages, (snapshot) => {
        if (!messagesContainer) return;

        if (snapshot.empty) {
            messagesContainer.innerHTML = '<p class="text-gray-500 text-center p-6">ابدأ المحادثة الآن!</p>';
            return;
        }

        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        messagesContainer.innerHTML = messages.map(msg => {
            const isSent = msg.senderId === userId;
            const bubbleClass = isSent ? 'chat-bubble-sent self-end' : 'chat-bubble-received self-start';
            const alignment = isSent ? 'items-end' : 'items-start';
            const timeString = msg.timestamp ? 
                new Date(msg.timestamp.toDate()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
                
            return `
                <div class="flex flex-col ${alignment}">
                    <div class="${bubbleClass} shadow-md">
                        <p class="text-sm">${msg.text}</p>
                    </div>
                    <span class="text-xs text-gray-400 mt-1 mr-3 ml-3">${timeString}</span>
                </div>
            `;
        }).join('');

        // التمرير إلى الأسفل بعد تحميل الرسائل
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    }, (error) => {
        console.error("Error fetching messages:", error);
        messagesContainer.innerHTML = '<p class="text-red-500 text-center p-6">حدث خطأ أثناء تحميل الرسائل.</p>';
    });
}

// --- صفحة الملف الشخصي (Profile Page) ---
async function renderProfilePage(uid = userId) {
    if (!uid) {
        showMessageModal('خطأ', 'لم يتم تحديد المستخدم', false);
        return;
    }
    
    showLoading('جاري تحميل الملف الشخصي...');
    
    const isCurrentUser = uid === userId;
    let targetProfile = userProfile;
    let ratingData = { avgRating: 0, ratingCount: 0 };

    try {
        if (!isCurrentUser) {
            const docSnap = await getDoc(doc(db, `artifacts/${appId}/public/data/users`, uid));
            if (!docSnap.exists()) {
                showMessageModal('خطأ', 'لم يتم العثور على الملف الشخصي المطلوب', false);
                return;
            }
            targetProfile = { id: docSnap.id, ...docSnap.data() };
        }
        
        // جلب التقييمات (إذا كان مقدم خدمة)
        if (targetProfile.role === 'provider') {
            const ratingsColRef = collection(db, `artifacts/${appId}/public/data/ratings`);
            const q = query(ratingsColRef, where('providerId', '==', uid));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const totalRating = snapshot.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
                ratingData.ratingCount = snapshot.docs.length;
                ratingData.avgRating = (totalRating / ratingData.ratingCount).toFixed(1);
            }
        }

    } catch (error) {
        console.error("Error fetching profile data:", error);
        showMessageModal('خطأ', 'حدث خطأ أثناء تحميل البيانات.', false);
        return;
    } finally {
        hideLoading();
    }

    const { name, username, phone, address, jobTitle, role, photo } = targetProfile;
    const isProvider = role === 'provider';
    
    const profileActions = isCurrentUser ? `
        <button data-action="navigateTo" data-page="editProfile" class="mt-4 w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
            <span>تعديل الملف الشخصي</span>
            <span class="w-5 h-5">${ICONS.edit}</span>
        </button>
        <button data-action="logout" class="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
            <span>تسجيل الخروج</span>
            <span class="w-5 h-5">${ICONS.logout}</span>
        </button>
    ` : `
        <button data-action="navigateTo" data-page="chat" data-otheruserid="${uid}" class="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
            <span>بدء محادثة</span>
            <span class="w-5 h-5">${ICONS.chat}</span>
        </button>
        ${userProfile.role !== 'provider' && isProvider ? `
            <button data-action="showRatingModal" data-providerid="${uid}" data-providername="${name}" class="mt-3 w-full py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                تقييم الخدمة
            </button>
        ` : ''}
    `;

    appContainer.innerHTML = `
        <div class="pb-24">
            <header class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
                <div class="flex items-center space-x-3 space-x-reverse">
                    ${!isCurrentUser ? `
                        <button data-action="goBack" class="p-1 rounded-full hover:bg-blue-700 transition-colors">
                            ${ICONS.back}
                        </button>
                    ` : ''}
                    <h1 class="text-2xl font-bold">${isCurrentUser ? 'ملفي الشخصي' : name}</h1>
                </div>
            </header>

            <main class="p-4 md:p-8">
                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                    <img src="${photo || 'https://placehold.co/100x100/EBF8FF/3182CE?text=User'}" alt="${name}" class="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-blue-100 shadow-md">
                    
                    <h2 class="text-3xl font-bold text-gray-900">${name}</h2>
                    <p class="text-lg text-blue-600 font-medium mt-1">${isProvider ? jobTitle || 'مقدم خدمة' : 'عميل'}</p>
                    
                    ${isProvider ? `
                        <div class="flex items-center justify-center mt-3 mb-4 text-xl text-yellow-500">
                            ${renderStars(ratingData.avgRating)}
                            <span class="mr-2 font-semibold text-gray-700">${ratingData.avgRating}</span>
                            <span class="text-sm text-gray-500 mr-1">(${ratingData.ratingCount} تقييم)</span>
                        </div>
                    ` : '<div class="h-4"></div>'}

                    <div class="mt-6 text-right">
                        <p class="border-b py-2 flex justify-between items-center text-gray-700">
                            <span class="font-semibold text-gray-500">اسم المستخدم (للدخول):</span> 
                            <span>${username}</span>
                        </p>
                        <p class="border-b py-2 flex justify-between items-center text-gray-700">
                            <span class="font-semibold text-gray-500">رقم الهاتف:</span> 
                            <span>${phone || 'غير متوفر'}</span>
                        </p>
                        <p class="border-b py-2 flex justify-between items-center text-gray-700">
                            <span class="font-semibold text-gray-500">العنوان:</span> 
                            <span>${address || 'غير متوفر'}</span>
                        </p>
                    </div>

                    ${profileActions}
                </div>
            </main>
            
            ${isCurrentUser ? renderBottomNav('profile') : ''}
        </div>
    `;
}

// --- صفحة تعديل الملف الشخصي (Edit Profile) ---
async function renderEditProfilePage() {
    if (!userProfile) {
        navigateTo('auth');
        return;
    }
    
    // إنشاء خيارات القائمة المنسدلة
    const serviceOptions = SERVICES_LIST.map(service => 
        `<option value="${service.name}" ${userProfile.jobTitle === service.name ? 'selected' : ''}>${service.name}</option>`
    ).join('');
    
    const isOtherJob = userProfile.role === 'provider' && userProfile.jobTitle && !SERVICES_LIST.some(s => s.name === userProfile.jobTitle);

    appContainer.innerHTML = `
        <div class="min-h-screen p-8 bg-gray-100">
            <header class="flex items-center space-x-3 space-x-reverse mb-6">
                <button data-action="goBack" class="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
                    ${ICONS.back}
                </button>
                <h1 class="text-3xl font-bold text-gray-900">تعديل ملفي الشخصي</h1>
            </header>
            
            <form id="edit-profile-form" class="space-y-6 bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
                <div id="edit-error" class="text-red-500 text-sm text-center hidden"></div>
                <input type="hidden" id="original-photo-url" value="${userProfile.photo || ''}">
                <input type="hidden" id="original-role" value="${userProfile.role}">
                
                <div>
                    <label for="edit-photo" class="block text-sm font-medium text-gray-700 text-center">الصورة الشخصية</label>
                    <div class="mt-2 flex justify-center">
                        <label for="edit-photo" class="relative cursor-pointer">
                            <img id="edit-photo-preview" class="w-24 h-24 rounded-full object-cover border-2 border-gray-300" 
                                 src="${userProfile.photo || 'https://placehold.co/100x100/EBF8FF/3182CE?text=اختيار+صورة'}" alt="معاينة الصورة">
                            <input type="file" id="edit-photo" accept="image/*" class="sr-only">
                        </label>
                    </div>
                </div>

                <div>
                    <label for="edit-name" class="block text-sm font-medium text-gray-700">الاسم الكامل</label>
                    <input type="text" id="edit-name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value="${userProfile.name}">
                </div>
                
                <div>
                    <label for="edit-phone" class="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                    <input type="tel" id="edit-phone" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value="${userProfile.phone || ''}">
                </div>
                
                <div>
                    <label for="edit-address" class="block text-sm font-medium text-gray-700">العنوان (المدينة / المركز)</label>
                    <input type="text" id="edit-address" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value="${userProfile.address || ''}">
                </div>
                
                <div id="edit-job-title-field" class="space-y-4 ${userProfile.role === 'client' ? 'hidden' : ''}">
                    <h2 class="text-lg font-semibold text-gray-800 border-t pt-4">معلومات مقدم الخدمة</h2>
                    <div>
                        <label for="edit-job-select" class="block text-sm font-medium text-gray-700">اختر وظيفتك / الخدمة:</label>
                        <select id="edit-job-select" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">اختر...</option>
                            ${serviceOptions}
                            <option value="أخرى" ${isOtherJob ? 'selected' : ''}>أخرى (اذكرها بالأسفل)</option>
                        </select>
                    </div>
                    <div id="edit-job-title-other-field" class="${isOtherJob ? '' : 'hidden'}">
                        <label for="edit-job-title" class="block text-sm font-medium text-gray-700">اذكر وظيفتك:</label>
                        <input type="text" id="edit-job-title" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="مثال: مصمم جرافيك" value="${isOtherJob ? userProfile.jobTitle : ''}">
                    </div>
                </div>

                <button type="submit" data-action="saveProfile" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    حفظ التعديلات
                </button>
            </form>
        </div>
    `;
    
    // تهيئة معالجات الأحداث للصورة والوظيفة
    initializeEditProfileListeners();
}

// --- صفحة طلب خدمة جديدة (New Request) ---
function renderNewRequestPage() {
    // إنشاء خيارات القائمة المنسدلة للخدمات
    const serviceOptions = SERVICES_LIST.map(service => 
        `<option value="${service.name}">${service.name}</option>`
    ).join('');
    
    appContainer.innerHTML = `
        <div class="min-h-screen p-8 bg-gray-100">
            <header class="flex items-center space-x-3 space-x-reverse mb-6">
                <button data-action="goBack" class="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
                    ${ICONS.back}
                </button>
                <h1 class="text-3xl font-bold text-gray-900">طلب خدمة جديدة</h1>
            </header>
            
            <form id="new-request-form" class="space-y-6 bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
                <div id="request-error" class="text-red-500 text-sm text-center hidden"></div>
                
                <div>
                    <label for="request-title" class="block text-sm font-medium text-gray-700">عنوان الطلب (ملخص)</label>
                    <input type="text" id="request-title" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="مثال: أريد سباك لتصليح حنفية">
                </div>
                
                <div>
                    <label for="request-category" class="block text-sm font-medium text-gray-700">فئة الخدمة المطلوبة</label>
                    <select id="request-category" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="">اختر فئة...</option>
                        ${serviceOptions}
                        <option value="أخرى">خدمة عامة / أخرى</option>
                    </select>
                </div>
                
                <div>
                    <label for="request-description" class="block text-sm font-medium text-gray-700">وصف تفصيلي للطلب</label>
                    <textarea id="request-description" rows="4" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="اذكر تفاصيل المشكلة، الموقع التقريبي، وأي متطلبات خاصة."></textarea>
                </div>
                
                <p class="text-sm text-gray-600 p-3 bg-blue-50 rounded-md border border-blue-200">
                    سيتم عرض طلبك لمقدمي الخدمات المسجلين في النظام، وسيقومون بالتواصل معك عبر المحادثة الخاصة لتقديم عروضهم.
                </p>

                <button type="submit" data-action="submitNewRequest" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    نشر طلب الخدمة
                </button>
            </form>
        </div>
    `;
}

// 10. وظائف مساعدة (عامة)

// دالة تحويل ملف الصورة إلى Base64 (بناءً على تفضيل المستخدم)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// دالة لعرض النجوم (التقييم)
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    // النجوم الممتلئة
    for (let i = 0; i < fullStars; i++) {
        starsHtml += `<span class="text-yellow-500">${ICONS.star}</span>`;
    }
    // النجمة النصف ممتلئة (غير موجودة في الأيقونات، نستخدم نجمة كاملة للتبسيط)
    if (hasHalfStar) {
        starsHtml += `<span class="text-yellow-500">${ICONS.star}</span>`; 
    }
    // النجوم الفارغة
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += `<span class="text-gray-300">${ICONS.starEmpty}</span>`;
    }
    
    return `<div class="flex items-center space-x-0.5 space-x-reverse">${starsHtml}</div>`;
}

// 11. وظائف Firebase للتعامل مع البيانات

// جلب بروفايل المستخدم من Firestore
async function fetchUserProfile(uid) {
    const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

// دالة تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور
async function handleLogin(username, password) {
    const errorElement = document.getElementById('login-error');
    errorElement.classList.add('hidden');
    showLoading('جاري تسجيل الدخول...');

    try {
        // البحث عن المستخدم باستخدام اسم المستخدم
        const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            hideLoading();
            errorElement.textContent = 'اسم المستخدم غير موجود.';
            errorElement.classList.remove('hidden');
            return;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const email = `${userData.username}@${appId}.com`; // البريد الوهمي

        // تسجيل الدخول باستخدام البريد الوهمي وكلمة المرور
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // التحقق من أن الـ uid متطابق مع الـ doc id
        if (userCredential.user.uid === userDoc.id) {
            // تحديث الحالة
            userId = userCredential.user.uid;
            userProfile = { id: userId, ...userData };
            
            hideLoading();
            navigateTo(userProfile.role === 'provider' ? 'providerHome' : 'clientHome');
        } else {
             // هذا يجب ألا يحدث في التطبيق العادي
             await signOut(auth); 
             hideLoading();
             errorElement.textContent = 'خطأ في الربط بين البيانات، يرجى المحاولة مرة أخرى.';
             errorElement.classList.remove('hidden');
        }

    } catch (error) {
        hideLoading();
        let errorMessage = 'حدث خطأ غير معروف.';
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'كلمة المرور غير صحيحة.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'اسم المستخدم غير موجود.';
        } else {
            console.error("Login Error:", error);
            errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.';
        }
        errorElement.textContent = errorMessage;
        errorElement.classList.remove('hidden');
    }
}

// دالة تسجيل حساب جديد (بدون بريد إلكتروني حقيقي)
async function handleRegister(username, password, name, phone, address, role, jobTitle, photoFile) {
    const errorElement = document.getElementById('register-error');
    errorElement.classList.add('hidden');
    showLoading('جاري إنشاء الحساب...');

    if (isRegistering) {
        hideLoading();
        errorElement.textContent = 'الرجاء الانتظار، عملية التسجيل قيد التنفيذ.';
        errorElement.classList.remove('hidden');
        return;
    }
    isRegistering = true;

    try {
        // 1. التحقق من وجود اسم المستخدم
        const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            hideLoading();
            errorElement.textContent = 'اسم المستخدم هذا مستخدم بالفعل. يرجى اختيار اسم آخر.';
            errorElement.classList.remove('hidden');
            isRegistering = false;
            return;
        }
        
        // 2. إنشاء بريد إلكتروني وهمي لـ Firebase Auth
        const email = `${username}@${appId}.com`;
        
        // 3. إنشاء حساب في Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUserId = userCredential.user.uid;

        let photoURL = '';
        if (photoFile) {
            try {
                // حفظ الصورة كـ Base64 في Firestore (وفقاً لتفضيل المستخدم)
                photoURL = await fileToBase64(photoFile);
            } catch (uploadError) {
                console.warn("Could not convert image to Base64:", uploadError);
                // لن نوقف التسجيل، لكن الصورة ستكون فارغة
            }
        }

        // 4. حفظ بروفايل المستخدم في Firestore
        const newProfile = {
            username: username,
            name: name,
            phone: phone,
            address: address,
            role: role,
            jobTitle: role === 'provider' ? jobTitle : '',
            photo: photoURL,
            createdAt: Timestamp.now(),
            rating: 0,
            ratingCount: 0,
            // قائمة كلمات البحث للوظيفة لتسهيل البحث في CategoryPage
            categorySearch: role === 'provider' && jobTitle ? SERVICES_LIST.find(s => s.name === jobTitle)?.categorySearch?.toLowerCase().split(' ') : [] 
        };

        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, newUserId);
        await setDoc(userDocRef, newProfile);
        
        // 5. تحديث الحالة والانتقال
        userId = newUserId;
        userProfile = { id: newUserId, ...newProfile };

        hideLoading();
        showMessageModal('نجاح!', 'تم إنشاء حسابك بنجاح. مرحباً بك!', true);
        navigateTo(role === 'provider' ? 'providerHome' : 'clientHome');
        
    } catch (error) {
        hideLoading();
        let errorMessage = 'فشل التسجيل. حاول مرة أخرى.';
        if (error.code === 'auth/weak-password') {
            errorMessage = 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.';
        } else if (error.code === 'auth/email-already-in-use') {
            // هذا يجب ألا يحدث بعد خطوة التحقق من اسم المستخدم
            errorMessage = 'خطأ في النظام: اسم المستخدم مستخدم بالفعل.';
        } else {
            console.error("Register Error:", error);
        }
        errorElement.textContent = errorMessage;
        errorElement.classList.remove('hidden');
    } finally {
        isRegistering = false;
    }
}

// دالة حفظ تعديلات الملف الشخصي
async function handleSaveProfile(name, phone, address, jobTitle, photoFile) {
    const errorElement = document.getElementById('edit-error');
    errorElement.classList.add('hidden');
    showLoading('جاري حفظ التعديلات...');

    try {
        let photoURL = document.getElementById('original-photo-url').value;
        const originalRole = document.getElementById('original-role').value;
        
        // 1. معالجة الصورة إذا تم تغييرها
        if (photoFile) {
            photoURL = await fileToBase64(photoFile);
        }

        // 2. تحديث البيانات في Firestore
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
        const updatedProfileData = {
            name: name,
            phone: phone,
            address: address,
            photo: photoURL,
        };
        
        // تحديث بيانات مقدم الخدمة فقط إذا كان دوره كذلك
        if (originalRole === 'provider') {
             const categorySearch = jobTitle ? SERVICES_LIST.find(s => s.name === jobTitle)?.categorySearch?.toLowerCase().split(' ') || [] : [];
            updatedProfileData.jobTitle = jobTitle;
            updatedProfileData.categorySearch = categorySearch;
        }

        await updateDoc(userDocRef, updatedProfileData);

        // 3. تحديث الحالة المحلية
        userProfile = { ...userProfile, ...updatedProfileData };

        hideLoading();
        showMessageModal('نجاح!', 'تم حفظ التعديلات بنجاح.', true);
        navigateTo('profile');

    } catch (error) {
        hideLoading();
        console.error("Save Profile Error:", error);
        errorElement.textContent = 'حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.';
        errorElement.classList.remove('hidden');
    }
}

// دالة إرسال رسالة في المحادثة
async function handleSendMessage(chatId, otherUserId, message) {
    if (!message.trim()) return;

    const messageData = {
        text: message.trim(),
        senderId: userId,
        timestamp: Timestamp.now(),
    };

    try {
        // 1. إضافة الرسالة إلى مجموعة الرسائل الفرعية
        const messagesColRef = collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`);
        await addDoc(messagesColRef, messageData);

        // 2. تحديث بيانات المحادثة الرئيسية (لـ lastMessage و participants)
        const chatDocRef = doc(db, `artifacts/${appId}/public/data/chats`, chatId);
        
        const chatUpdate = {
            lastMessage: messageData,
            participants: [userId, otherUserId],
        };
        
        // استخدام setDoc مع { merge: true } لإنشاء المستند إذا لم يكن موجودًا
        await setDoc(chatDocRef, chatUpdate, { merge: true });

        // 3. مسح حقل الإدخال
        document.getElementById('message-input').value = '';

    } catch (error) {
        console.error("Error sending message:", error);
        showMessageModal('خطأ في الإرسال', 'فشل إرسال الرسالة. حاول مرة أخرى.', false);
    }
}

// دالة نشر طلب خدمة جديدة
async function handleSubmitNewRequest(title, category, description) {
    const errorElement = document.getElementById('request-error');
    errorElement.classList.add('hidden');
    showLoading('جاري نشر الطلب...');

    try {
        const newRequest = {
            requesterId: userId,
            requesterName: userProfile.name,
            requesterPhoto: userProfile.photo || '',
            title: title.trim(),
            category: category,
            description: description.trim(),
            status: 'open', // حالة الطلب
            createdAt: Timestamp.now(),
            // يمكن إضافة الموقع هنا إذا لزم الأمر
        };

        const requestsColRef = collection(db, `artifacts/${appId}/public/data/serviceRequests`);
        await addDoc(requestsColRef, newRequest);

        hideLoading();
        showMessageModal('نجاح!', 'تم نشر طلب الخدمة بنجاح. سيتواصل معك مقدمو الخدمات المهتمون قريباً.', true);
        navigateTo(userProfile.role === 'client' ? 'clientHome' : 'providerHome');

    } catch (error) {
        hideLoading();
        console.error("Submit Request Error:", error);
        errorElement.textContent = 'حدث خطأ أثناء نشر الطلب. يرجى المحاولة مرة أخرى.';
        errorElement.classList.remove('hidden');
    }
}

// دالة إضافة تقييم لمقدم خدمة
async function handleRating(providerId, rating, comment) {
    showLoading('جاري إرسال التقييم...');

    try {
        // 1. إنشاء مستند التقييم
        const ratingData = {
            providerId: providerId,
            clientId: userId,
            rating: rating,
            comment: comment,
            createdAt: Timestamp.now(),
        };

        const ratingsColRef = collection(db, `artifacts/${appId}/public/data/ratings`);
        await addDoc(ratingsColRef, ratingData);

        // 2. تحديث متوسط التقييم وعدد التقييمات في ملف مقدم الخدمة (باستخدام Transaction لضمان الدقة)
        const providerDocRef = doc(db, `artifacts/${appId}/public/data/users`, providerId);

        await runTransaction(db, async (transaction) => {
            const providerDoc = await transaction.get(providerDocRef);
            if (!providerDoc.exists()) {
                throw "Provider Document does not exist!";
            }

            const currentData = providerDoc.data();
            const currentTotalRating = currentData.rating * currentData.ratingCount;
            const newRatingCount = (currentData.ratingCount || 0) + 1;
            const newTotalRating = currentTotalRating + rating;
            const newAvgRating = newTotalRating / newRatingCount;

            transaction.update(providerDocRef, {
                rating: parseFloat(newAvgRating.toFixed(1)),
                ratingCount: newRatingCount,
            });
        });
        
        hideModal();
        showMessageModal('شكراً لك!', 'تم إرسال تقييمك بنجاح.', true);
        navigateTo('profile', { uid: providerId }); // العودة إلى صفحة مقدم الخدمة المقيَّم

    } catch (error) {
        hideModal();
        console.error("Rating Error:", error);
        showMessageModal('خطأ في التقييم', 'فشل إرسال التقييم. يرجى المحاولة مرة أخرى.', false);
    }
}

// 12. وظائف تهيئة معالجات الأحداث (Event Listeners)

function initializeGlobalListeners() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const page = target.getAttribute('data-page');
        const category = target.getAttribute('data-category');
        const uid = target.getAttribute('data-uid');
        const otherUserId = target.getAttribute('data-otheruserid');

        switch (action) {
            case 'navigateTo':
                navigateTo(page, { category, uid, otherUserId });
                break;
            case 'goBack':
                // العودة إلى الصفحة السابقة، أو الرئيسية إذا لم تكن مسجلة
                navigateTo(previousPage.page, previousPage.params);
                break;
            case 'logout':
                handleLogout();
                break;
            case 'closeModal':
                hideModal();
                break;
            case 'showRatingModal':
                showRatingModal(target.getAttribute('data-providerid'), target.getAttribute('data-providername'));
                break;
            // يتم التعامل مع 'login' و 'register' و 'sendMessage' و 'saveProfile' و 'submitNewRequest' في معالجات الأحداث الخاصة بالنماذج
        }
    });
    
    // إعداد معالج الإرسال لصفحة تسجيل الدخول
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const username = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value;
            handleLogin(username, password);
        } else if (e.target.id === 'register-form') {
            e.preventDefault();
            handleRegisterFormSubmission();
        } else if (e.target.id === 'edit-profile-form') {
            e.preventDefault();
            handleEditProfileFormSubmission();
        } else if (e.target.id === 'chat-form') {
            e.preventDefault();
            const messageInput = document.getElementById('message-input');
            const message = messageInput.value;
            const chatId = e.target.querySelector('[data-action="sendMessage"]').getAttribute('data-chatid');
            const otherUserId = e.target.querySelector('[data-action="sendMessage"]').getAttribute('data-otheruserid');
            handleSendMessage(chatId, otherUserId, message);
        } else if (e.target.id === 'new-request-form') {
            e.preventDefault();
            const title = document.getElementById('request-title').value;
            const category = document.getElementById('request-category').value;
            const description = document.getElementById('request-description').value;
            handleSubmitNewRequest(title, category, description);
        }
    });
}

function handleLogout() {
    signOut(auth).then(() => {
        userId = null;
        userProfile = null;
        showMessageModal('تم تسجيل الخروج', 'نأمل أن نراك قريباً.', true);
        navigateTo('auth');
    }).catch((error) => {
        console.error("Logout Error:", error);
        showMessageModal('خطأ في تسجيل الخروج', 'حدث خطأ أثناء محاولة تسجيل الخروج.', false);
    });
}

// معالج إرسال نموذج التسجيل
function handleRegisterFormSubmission() {
    const form = document.getElementById('register-form');
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const address = document.getElementById('register-address').value.trim();
    const role = form.querySelector('input[name="role"]:checked').value;
    const photoInput = document.getElementById('register-photo');
    const photoFile = photoInput.files.length > 0 ? photoInput.files[0] : null;

    let jobTitle = '';
    if (role === 'provider') {
        const jobSelect = document.getElementById('register-job-select').value;
        if (jobSelect === 'أخرى') {
            jobTitle = document.getElementById('register-job-title').value.trim();
        } else {
            jobTitle = jobSelect;
        }
        if (!jobTitle) {
            document.getElementById('register-error').textContent = 'الرجاء تحديد أو إدخال وظيفتك.';
            document.getElementById('register-error').classList.remove('hidden');
            return;
        }
    }
    
    handleRegister(username, password, name, phone, address, role, jobTitle, photoFile);
}

// معالج إرسال نموذج تعديل الملف الشخصي
function handleEditProfileFormSubmission() {
    const form = document.getElementById('edit-profile-form');
    const name = document.getElementById('edit-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const address = document.getElementById('edit-address').value.trim();
    const photoInput = document.getElementById('edit-photo');
    const photoFile = photoInput.files.length > 0 ? photoInput.files[0] : null;
    const originalRole = document.getElementById('original-role').value;

    let jobTitle = userProfile.jobTitle; // القيمة الافتراضية إذا لم يتغير
    
    if (originalRole === 'provider') {
        const jobSelect = document.getElementById('edit-job-select').value;
        if (jobSelect === 'أخرى') {
            jobTitle = document.getElementById('edit-job-title').value.trim();
        } else {
            jobTitle = jobSelect;
        }
        if (!jobTitle) {
            document.getElementById('edit-error').textContent = 'الرجاء تحديد أو إدخال وظيفتك.';
            document.getElementById('edit-error').classList.remove('hidden');
            return;
        }
    }
    
    handleSaveProfile(name, phone, address, jobTitle, photoFile);
}

// تهيئة معالجات الأحداث لصفحة التسجيل
function initializeRegisterListeners() {
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const jobTitleField = document.getElementById('job-title-field');
    const jobSelect = document.getElementById('register-job-select');
    const jobOtherField = document.getElementById('job-title-other-field');
    const photoInput = document.getElementById('register-photo');
    const photoPreview = document.getElementById('photo-preview');

    // تبديل حقل الوظيفة بناءً على الدور
    roleRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'provider') {
                jobTitleField.classList.remove('hidden');
            } else {
                jobTitleField.classList.add('hidden');
            }
        });
    });

    // تبديل حقل الوظيفة الأخرى بناءً على اختيار القائمة
    if (jobSelect) {
        jobSelect.addEventListener('change', (e) => {
            if (e.target.value === 'أخرى') {
                jobOtherField.classList.remove('hidden');
            } else {
                jobOtherField.classList.add('hidden');
            }
        });
    }

    // معاينة الصورة
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.src = e.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
}

// تهيئة معالجات الأحداث لصفحة التعديل
function initializeEditProfileListeners() {
    const jobSelect = document.getElementById('edit-job-select');
    const jobOtherField = document.getElementById('edit-job-title-other-field');
    const photoInput = document.getElementById('edit-photo');
    const photoPreview = document.getElementById('edit-photo-preview');
    
    // تبديل حقل الوظيفة الأخرى بناءً على اختيار القائمة
    if (jobSelect) {
        jobSelect.addEventListener('change', (e) => {
            if (e.target.value === 'أخرى') {
                jobOtherField.classList.remove('hidden');
            } else {
                jobOtherField.classList.add('hidden');
            }
        });
    }
    
    // معاينة الصورة
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.src = e.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
}

// دالة عرض نافذة التقييم المنبثقة
function showRatingModal(providerId, providerName) {
    const modalHtml = `
        <h2 class="text-xl font-semibold text-center text-gray-800 mb-4">تقييم ${providerName}</h2>
        <form id="rating-form" class="space-y-4">
            <input type="hidden" id="provider-id-input" value="${providerId}">
            <div class="flex justify-center mb-4" id="rating-stars">
                </div>
            <input type="hidden" id="rating-value" value="0" required>
            
            <div>
                <label for="rating-comment" class="block text-sm font-medium text-gray-700">ملاحظاتك (اختياري)</label>
                <textarea id="rating-comment" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
            </div>
            
            <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">إرسال التقييم</button>
        </form>
    `;
    showModal(modalHtml);
    
    // تهيئة نجوم التقييم
    const starsContainer = document.getElementById('rating-stars');
    const ratingInput = document.getElementById('rating-value');
    let currentRating = 0;

    const renderInteractiveStars = () => {
        starsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const starIcon = i <= currentRating ? ICONS.star : ICONS.starEmpty;
            const colorClass = i <= currentRating ? 'text-yellow-500' : 'text-gray-400';
            const starButton = document.createElement('button');
            starButton.type = 'button';
            starButton.classList.add('p-1', colorClass, 'hover:text-yellow-500', 'transition-colors');
            starButton.innerHTML = starIcon;
            starButton.setAttribute('data-rating', i);
            
            starButton.addEventListener('click', () => {
                currentRating = i;
                ratingInput.value = i;
                renderInteractiveStars(); // إعادة الرسم
            });
            starsContainer.appendChild(starButton);
        }
    };
    renderInteractiveStars();

    // معالج إرسال نموذج التقييم
    document.getElementById('rating-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = parseInt(ratingInput.value);
        const comment = document.getElementById('rating-comment').value.trim();
        const providerId = document.getElementById('provider-id-input').value;

        if (rating === 0) {
            alert('الرجاء اختيار عدد النجوم لتقييم مقدم الخدمة.');
            return;
        }

        handleRating(providerId, rating, comment);
    });
}


// 13. نقطة دخول التطبيق (التهيئة)

function initApp() {
    initializeGlobalListeners();
    navigateTo('loading');

    // مراقبة حالة تسجيل الدخول في Firebase
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (userId && userProfile) {
                // المستخدم موجود بالفعل في الحالة المحلية، لا تفعل شيئاً
                return;
            }

            userId = user.uid;
            console.log('User is signed in:', userId);
            
            // جلب ملف تعريف المستخدم من Firestore
            userProfile = await fetchUserProfile(userId);

            if (userProfile) {
                // تحديث previousPage لضمان الانتقال الصحيح من شاشتي 'auth'/'register'
                previousPage = { page: userProfile.role === 'provider' ? 'providerHome' : 'clientHome', params: {} };
                currentPage = { page: userProfile.role === 'provider' ? 'providerHome' : 'clientHome', params: {} };
                
                navigateTo(currentPage.page);
            } else {
                // قد يكون المستخدم سجل للتو في Auth ولكن لم يكمل بياناته في Firestore
                console.log('No profile found, redirecting to register.');
                navigateTo('register');
            }
        } else {
            console.log('User is signed out.');
            userId = null;
            userProfile = null;
            navigateTo('auth');
        }
    });

    // معالج أحداث لصفحة التسجيل لتهيئة المستمعين بعد الـ render
    document.addEventListener('DOMContentLoaded', () => {
        // نتحقق من وجود عناصر صفحة التسجيل
        if (document.getElementById('register-form')) {
            initializeRegisterListeners();
        }
    });
    
    // معالج أحداث لصفحة التعديل لتهيئة المستمعين بعد الـ render
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('edit-profile-form')) {
            initializeEditProfileListeners();
        }
    });

    // محاولة تسجيل الدخول المبدئي (لبيئة Canvas)
    (async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                console.log("Signing in with custom token...");
                await signInWithCustomToken(auth, __initial_auth_token);
            } else if (!auth.currentUser) {
                 console.log("No token, onAuthStateChanged will handle.");
            }
        } catch (error) {
            console.error("Error during initial auth:", error);
            navigateTo('auth');
        }
    })();
};

initApp();
