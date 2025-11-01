// main.js - TAM VE TEMİZ HALİ (GÖREV 29)

// === 1. GLOBAL DEĞİŞKENLER VE ELEMENTLER ===
// Proje boyunca ihtiyaç duyacağımız değişkenler
let accessToken = null; 
let currentUser = null; 

const API_BASE_URL = 'https://bk-api-evsk.onrender.com'; // SONUNDA SLASH YOK

// HTML'den sık kullanacağımız elementleri en başta yakalıyoruz
const loginButton = document.getElementById('login-button');
const slotListElement = document.getElementById('slot-list');
const createSlotForm = document.getElementById('create-slot-form');
const loginForm = document.getElementById('login-form');
const slotsArea = document.getElementById('slots-area');
const createSlotContainer = document.getElementById('create-slot-container');


// === 2. GİRİŞ (LOGIN) İŞLEMİ ===
// Kullanıcı "Giriş Yap" butonuna bastığında bu fonksiyon çalışır
loginButton.addEventListener('click', async () => {
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginData = { email: email, password: password };

    console.log("Giriş denemesi yapılıyor:", loginData);

    try {
        const response = await fetch(`${API_BASE_URL}/api/token/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(loginData) 
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Başarılı! Token alınıyor...');
            console.log('Access Token:', data.access);
            
            accessToken = data.access; // Token'ı global değişkene ata
            
            // Giriş başarılı olduğu için, kullanıcının kim olduğunu soran
            // ve arayüzü (UI) ona göre çizen ana fonksiyonu çağır.
            await fetchUserAndRenderUI(); 
        
        } else { 
            console.error('Giriş Başarısız!', data); 
            alert('Giriş başarısız! E-posta veya şifre hatalı.');
        }

    } catch (error) {
        console.error('API (token) ile iletişim kurulamadı:', error);
        alert('Sunucuya (API) bağlanırken bir hata oluştu.');
    }
}); 


// === 3. KULLANICI BİLGİSİNİ ÇEKME VE ARAYÜZÜ ÇİZME ===
// Giriş başarılı olduktan HEMEN SONRA bu fonksiyon çalışır.
async function fetchUserAndRenderUI() {
    if (!accessToken) return; 

    console.log("Kullanıcı rolü /users/me/ adresinden çekiliyor...");
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            currentUser = await response.json(); 
            console.log("Kullanıcı bulundu:", currentUser);

            // Arayüzü kullanıcının rolüne göre güncelle
            renderUIBasedOnRole();
            
            // Arayüz hazır olduğuna göre, müsait slotları çek
            fetchAvailableSlots();

        } else {
            console.error("Kullanıcı detayı çekilemedi:", await response.json());
            alert("Hata: Kullanıcı detayları alınamadı.");
        }
    } catch (error) {
        console.error("API (users/me) ile iletişim kurulamadı:", error);
    }
}


// === 4. ARAYÜZÜ ROLE GÖRE GÜNCELLEME ===
// 'fetchUserAndRenderUI' tarafından çağrılır.
function renderUIBasedOnRole() {
    if (!currentUser) return;

    // Önce giriş formunu gizle
    loginForm.style.display = 'none';

    // KURAL: Kullanıcı 'is_staff' (Admin/Psikolog) ise
    if (currentUser.is_staff === true) { 
        console.log("Rol: Psikolog. Yönetim paneli açılıyor.");
        // Slot ekleme formunu ve slot listesini GÖSTER
        slotsArea.style.display = 'block';
        createSlotContainer.style.display = 'block';
    } 
    // KURAL: Kullanıcı 'is_staff' değilse (Hasta ise)
    else { 
        console.log("Rol: Hasta. Randevu paneli açılıyor.");
        // SADECE slot listesini GÖSTER
        slotsArea.style.display = 'block';
        // Slot ekleme formu (createSlotFormContainer) gizli kalır (HTML'deki style="display:none;" sayesinde)
    }
}


// === 5. MÜSAİT SLOTLARI LİSTELEME ===
// 'fetchUserAndRenderUI' tarafından (girişten sonra)
// ve 'createSlotForm' tarafından (yeni slot ekledikten sonra) çağrılır.
async function fetchAvailableSlots() {
    if (!accessToken) return;

    console.log("Token kullanarak müsait slotlar çekiliyor...");
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/slots/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const slots = await response.json(); 
            console.log("Slotlar başarıyla çekildi:", slots);
            
            slotListElement.innerHTML = ''; // Listeyi temizle

            if (slots.length === 0) {
            slotListElement.innerHTML = '<li>Gösterilecek müsait slot bulunamadı.</li>';
        } else {
            // Gelen her 'slot' objesi için bir <li> elementi yarat
            slots.forEach(slot => {
                const li = document.createElement('li');

                const startTime = new Date(slot.start_time).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

                // Önce slot bilgisini yaz
                li.textContent = `ID: ${slot.id} - Başlangıç: ${startTime} `;

                // --- YENİ MANTIK (GÖREV 32) ---
                // 'currentUser' (GÖREV 29'da aldık) global değişkenini kontrol et
                // Eğer kullanıcı admin (psikolog) DEĞİLSE (yani hasta ise)
                if (currentUser && currentUser.is_staff === false) {

                    // Bir "Randevu Al" butonu yarat
                    const bookButton = document.createElement('button');
                    bookButton.textContent = 'Randevu Al';
                    bookButton.className = 'book-button'; // CSS için sınıf

                    // Butona, hangi slotu rezerve edeceğini bilmesi için 'data-slot-id' özelliği ekle
                    bookButton.dataset.slotId = slot.id;

                    // Butonu <li> elementinin içine ekle
                    li.appendChild(bookButton);
                }

                // Hazırlanan <li>'yi ana listeye (<ul>) ekle
                slotListElement.appendChild(li);
            });
        }
        } 
        
        else {
            console.error('Slotları çekerken hata:', await response.json());
        }

    } catch (error) {
        console.error('API (slotlar) ile iletişim kurulamadı:', error);
    }
}


// === 6. YENİ SLOT YARATMA İŞLEMİ ===
// Psikolog (Admin) "Slot Ekle" formunu 'submit' ettiğinde çalışır.
createSlotForm.addEventListener('submit', async (event) => {
    
    event.preventDefault(); // Sayfanın yenilenmesini engelle
    
    const startTimeValue = document.getElementById('start_time').value;
    const endTimeValue = document.getElementById('end_time').value;
    
    const slotData = {
        "start_time": new Date(startTimeValue).toISOString(),
        "end_time": new Date(endTimeValue).toISOString()
    };

    console.log("Yeni slot yaratma isteği gönderiliyor:", slotData);

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/slots/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Yetki token'ı
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(slotData)
        });

        if (response.ok) {
            const newSlot = await response.json();
            console.log("Slot başarıyla yaratıldı:", newSlot);
            
            // BAŞARILI: Slot listesini TAZELİYORUZ
            fetchAvailableSlots();
            
            createSlotForm.reset(); // Formu temizle

        } else {
            console.error("Slot yaratılamadı:", await response.json());
            alert('Hata: Slot yaratılamadı.');
        }

    } catch (error) {
        console.error('API (slot yaratma) ile iletişim kurulamadı:', error);
    }
});

slotListElement.addEventListener('click', (event) => {
    
    // Tıklanan element bir 'book-button' sınıfına sahip mi?
    if (event.target.classList.contains('book-button')) {
        
        // Evet, bu bir "Randevu Al" butonu.
        // Hangi slota ait olduğunu 'data-slot-id'den al
        const slotId = event.target.dataset.slotId;
        console.log(`Randevu alma isteği başladı. Slot ID: ${slotId}`);
        
        // Randevu alma API'sini (Backend) çağıran fonksiyonu tetikle
        bookAppointment(slotId);
    }
});

/**
 * GÖREV 34: Randevu alma API'sine (POST /appointments/) istek atar.
 */
async function bookAppointment(slotId) {
    if (!accessToken || !slotId) return; // Token veya Slot ID yoksa çık

    // Hastadan basit bir not alabiliriz (şimdilik opsiyonel)
    const notes = prompt("Randevu için notunuz (opsiyonel):");

    const appointmentData = {
        "time_slot_id": parseInt(slotId), // ID'yi tam sayıya çevir
        "notes": notes || "" // Not boşsa boş string gönder
    };

    console.log("Randevu API'sine gönderiliyor:", appointmentData);

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/appointments/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // TOKEN_HASTA
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        if (response.ok) {
            const newAppointment = await response.json();
            console.log("Randevu başarıyla alındı:", newAppointment);
            alert('Randevunuz başarıyla oluşturuldu!');

            // BAŞARILI: Randevu alındığına göre,
            // 'Müsait Slotlar' listesini TAZELİYORUZ.
            // (Backend, o slotu 'is_booked=True' yaptı,
            // bu yüzden o slot artık listeden kaybolacak)
            fetchAvailableSlots();

        } else {
            // Hata (örn: Slot çoktan kapılmış, 400 Bad Request)
            const errorData = await response.json();
            console.error("Randevu alınamadı:", errorData);
            // Backend'den gelen hatayı (örn: "Bu zaman slotu zaten dolu.") göster
            alert(`Hata: Randevu alınamadı. (Sebep: ${JSON.stringify(errorData)})`);
        }

    } catch (error) {
        console.error('API (randevu alma) ile iletişim kurulamadı:', error);
    }
}

