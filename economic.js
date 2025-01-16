import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, push, get, child, remove } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";


// Firebase konfiqurasiyası
const firebaseConfig = {
  apiKey: "AIzaSyAse2CQeXYNiZM6Kt7V9ouVOuEQlTLVtpg",
  authDomain: "economic-49b56.firebaseapp.com",
  projectId: "economic-49b56",
  storageBucket: "economic-49b56.firebasestorage.app",
  messagingSenderId: "175566342258",
  appId: "1:175566342258:web:0bfcf53a613767963ddaeb"
};

// Firebase başlatma
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// İstifadəçi girişi
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // GitHub-dan istifadəçi doğrulama (nümunə məlumat)
  const res = await fetch('https://raw.githubusercontent.com/ferhadsultan98/infos/main/pass.json');
  const data = await res.json();

  const user = data.userCredentials.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('username', username); // Giriş etdikdən sonra istifadəçini localStorage-a qeyd edək
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('flex-Container').style.display = 'flex';
    loadProfile(username);
  } else {
    alert('İstifadəçi adı və ya şifrə yanlışdır');
  }
});

// Sayfa yükləndikdə istifadəçi giriş vəziyyəti yoxlanılsın
window.onload = () => {
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('flex-Container').style.display = 'flex';
    loadProfile(username);
  }
};

// Çıxış et
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('username');
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('flex-Container').style.display = 'none';
});

// Profil məlumatlarını yüklə
async function loadProfile(username) {
  const profileRef = ref(db, 'profiles/' + username);
  const snapshot = await get(profileRef);

  if (snapshot.exists()) {
    const profile = snapshot.val();
    document.getElementById('name').value = profile.name;
    document.getElementById('surname').value = profile.surname;
    document.getElementById('dob').value = profile.dob;
    document.getElementById('gender').value = profile.gender;

    const avatar = document.getElementById('avatar');
    avatar.innerHTML = `<img src="${profile.avatar}" alt="Avatar">`;
    const profileFullname = document.getElementById("profile-fullname")
    profileFullname.innerHTML = document.getElementById('name').value + ' ' + document.getElementById('surname').value;

    // Profil ikonunu göstər
    document.getElementById('profile-icon').style.display = 'block';
    document.getElementById('profile-image').src = profile.avatar;
  }
}

// Profilı yadda saxla
const profileForm = document.getElementById('profileForm');
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = localStorage.getItem('username');
  const name = document.getElementById('name').value;
  const surname = document.getElementById('surname').value;
  const dob = document.getElementById('dob').value;
  const gender = document.getElementById('gender').value;
  const avatar = gender === 'male' ? 'https://randomuser.me/api/portraits/men/1.jpg' : 'https://randomuser.me/api/portraits/women/1.jpg';

  set(ref(db, 'profiles/' + username), {
    name,
    surname,
    dob,
    gender,
    avatar
  });

  alert('Profil yadda saxlanıldı');

  // Profil ikonunu göstər
  document.getElementById('profile-icon').style.display = 'block';
  document.getElementById('profile-image').src = avatar;
});

// Sayfa yükləndikdə profil səhifəsi gizli olacaq
document.getElementById('profile-page').style.display = 'none';

// Profil ikonuna klikləmə hadisə dinləyicisi əlavə et
document.getElementById("profile-icon").addEventListener("click", function () {
  const profilePage = document.getElementById('profile-page');
  const closeWin = document.getElementById("closeWin")
  closeWin.addEventListener("click", function () {
    profilePage.style.display = 'none';
  })
  if (profilePage.style.display === 'block') {
    profilePage.classList.remove('show');
    setTimeout(() => {
      profilePage.style.display = 'none';
    }, 500);
  } else {
    profilePage.style.display = 'block';
    setTimeout(() => {
      profilePage.classList.add('show');
    }, 10);
  }
  // Xərc səhifəsini gizlət
  document.getElementById('expense-page').style.display = 'none';
});

// Xərc əlavə et
const expenseForm = document.getElementById('expenseForm');
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const category = document.getElementById('category').value;
  const amount = document.getElementById('amount').value;
  const description = document.getElementById('description').value;
  const currency = document.getElementById('currency').value;

  const expense = { category, amount, description, currency, date: new Date().toISOString() };
  const username = localStorage.getItem('username');  // İstifadəçini localStorage-dan alırıq
  const expensesRef = ref(db, 'expenses/' + username);

  push(expensesRef, expense).then(() => {
    alert('Xərc yadda saxlanıldı');
    updateExpenseTable();
  });
});

// Xərc cədvəlini yeniləmə
let currentPage = 1;
const itemsPerPage = 10;

async function updateExpenseTable() {
  const username = localStorage.getItem('username'); // İstifadəçi adını alırıq

  // Firebase URL üzərindən məlumatları əldə etmək üçün fetch istifadə edirik
  const url = `https://economic-49b56-default-rtdb.firebaseio.com/expenses/${username}.json`;

  try {
    // Məlumatı alırıq
    const response = await fetch(url);
    const expenses = await response.json();

    // Cədvəli seçirik
    const expenseTableBody = document.querySelector('#expenseTable tbody');
    const paginationContainer = document.querySelector('#pagination');

    // Cədvəli təmizləyirik
    expenseTableBody.innerHTML = '';

    if (expenses) {
      // Məlumatları siyahıya çevirib tarixə görə sıralayırıq
      const sortedExpenses = Object.values(expenses).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Böyükdən kiçiyə sıralama (yeni tarixlər yuxarıda olacaq)
      });

      // Səhifələr üçün ümumi sayı hesablayırıq
      const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);

      // Cari səhifədəki xərcləri alırıq
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageExpenses = sortedExpenses.slice(startIndex, endIndex);

      // Məlumatları işləyərək cədvələ əlavə edirik
      currentPageExpenses.forEach((expense, index) => {
        const row = document.createElement('tr');

        // Məlumatı sətirə əlavə edirik
        row.innerHTML = `
            <td>${startIndex + index + 1}</td> 
            <td>${expense.category}</td>
            <td>${expense.amount}</td>
            <td>${expense.description}</td>
            <td>${expense.currency}</td>
            <td>${new Date(expense.date).toLocaleString('az-AZ', {
          timeZone: 'Asia/Baku',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}</td>`;

        // Sətiri cədvələ əlavə edirik
        expenseTableBody.appendChild(row);
      });

      // Səhifələmə düymələrini yaradırıq
      paginationContainer.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('pagination-button');
        pageButton.onclick = () => {
          currentPage = i;
          updateExpenseTable(); // Səhifə dəyişdikdə cədvəli yenilə
        };

        // Əgər bu cari səhifədirsə, düyməni aktiv et
        if (i === currentPage) {
          pageButton.disabled = true;
        }

        paginationContainer.appendChild(pageButton);
      }
    } else {
      // Əgər xərc məlumatı yoxdursa, bir məlumat mesajı göstərək
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6">Hələlik xərc məlumatı yoxdur.</td>`;
      expenseTableBody.appendChild(row);
    }
  } catch (error) {
    console.error('Məlumat alınarkən bir xəta baş verdi:', error);
    // Xəta mesajı əlavə edək
    const expenseTableBody = document.querySelector('#expenseTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="6">Məlumat alınarkən bir xəta baş verdi. Zəhmət olmasa, yenidən cəhd edin.</td>`;
    expenseTableBody.appendChild(row);
  }
}

// Sayfa ilk açıldığında cədvəli yüklə
updateExpenseTable();




// Sayfa yükləndikdə xərclər cədvəlini yeniləmək
document.addEventListener('DOMContentLoaded', updateExpenseTable);

// İstifadəçi adı dəyişdikdə cədvəlin yenilənməsi üçün event listener əlavə edə bilərsiniz
document.getElementById('username').addEventListener('input', updateExpenseTable);

// Xərclər statistikalarını yeniləmək (Qrafik)
async function updateExpenseStatistics() {
  const username = localStorage.getItem('username'); // İstifadəçi adını alırıq

  const url = `https://economic-49b56-default-rtdb.firebaseio.com/expenses/${username}.json`;

  try {
    // Xərc məlumatlarını alırıq
    const response = await fetch(url);
    const expenses = await response.json();

    // Kateqoriyalara görə xərc cəm və sayı hesablayırıq
    const categoryTotals = {
      food: { totalAmount: 0, count: 0 },
      transport: { totalAmount: 0, count: 0 },
      entertainment: { totalAmount: 0, count: 0 },
      shopping: { totalAmount: 0, count: 0 },
      health: { totalAmount: 0, count: 0 },
      education: { totalAmount: 0, count: 0 },
      utilities: { totalAmount: 0, count: 0 },
      travel: { totalAmount: 0, count: 0 }
    };

    if (expenses) {
      // Məlumatları işləyərək kateqoriyalara görə cəm xərc və sayları hesablayırıq
      Object.values(expenses).forEach(expense => {
        categoryTotals[expense.category].totalAmount += parseFloat(expense.amount);
        categoryTotals[expense.category].count += 1;
      });
    }

   // Qrafik məlumatlarını yaradırıq
 // Qrafik məlumatlarını yaradırıq
const chartData = {
  labels: ['Yemək', 'Nəqliyyat', 'Əyləncə', 'Alış-veriş', 'Sağlamlıq', 'Təhsil', 'İnfrastruktur', 'Səyahət'],
  datasets: [
      {
          label: 'Toplam Xərc Miqdarı (Qiymət)', // Datasetin etiketi
          data: [
              categoryTotals.food.totalAmount,
              categoryTotals.transport.totalAmount,
              categoryTotals.entertainment.totalAmount,
              categoryTotals.shopping.totalAmount,
              categoryTotals.health.totalAmount,
              categoryTotals.education.totalAmount,
              categoryTotals.utilities.totalAmount,
              categoryTotals.travel.totalAmount
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)', // Toplam xərc miqdarı üçün şəffaf narıncı rəng
          borderColor: '#FF5733', // Border rəngi
          borderWidth: 2,
          hoverBackgroundColor: 'rgba(255, 99, 132, 0.8)', // Hoverda rəng dəyişir
          hoverBorderColor: '#FF5733',
          hoverBorderWidth: 3,
          barPercentage: 0.35 // Barın eni tənzimlənir
      },
      {
          label: 'Xərc Sayı (Neçə Dəfə)', // Datasetin etiketi
          data: [
              categoryTotals.food.count,
              categoryTotals.transport.count,
              categoryTotals.entertainment.count,
              categoryTotals.shopping.count,
              categoryTotals.health.count,
              categoryTotals.education.count,
              categoryTotals.utilities.count,
              categoryTotals.travel.count
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.6)', // Xərc sayı üçün yaşıl-çehrayı rəng
          borderColor: '#33FF57',
          borderWidth: 2,
          hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)',
          hoverBorderColor: '#33FF57',
          hoverBorderWidth: 3,
          barPercentage: 0.35 // Barın eni tənzimlənir
      }
  ]
};

// Əgər əvvəllər yaradılmış bir qrafik varsa, onu silirik
if (window.expenseChart instanceof Chart) {
  window.expenseChart.destroy();
}

    let currentPage = 1;
    const itemsPerPage = 10;
    let expenseList = [];  // Xərclərin hamısı (filtrlənməmiş siyahı)

    // Xərclər cədvəlini yeniləyirik
    async function updateExpenseTable(filteredExpenses = []) {
      const username = localStorage.getItem('username');
      const url = `https://economic-49b56-default-rtdb.firebaseio.com/expenses/${username}.json`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        // Firebase obyektini massivə çeviririk
        expenseList = data ? Object.values(data) : [];

        // Xərcləri sıralayırıq
        const sortedExpenses = expenseList.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA; // Yeni tarixlər əvvəl gəlir
        });

        // Filtrə uyğun xərcləri seçirik
        const displayExpenses = filteredExpenses.length > 0 ? filteredExpenses : sortedExpenses;

        // Cədvəli yeniləyirik
        const expenseTableBody = document.querySelector('#expenseTable tbody');
        expenseTableBody.innerHTML = ''; // Cədvəli təmizləyirik

        // Səhifələmə üçün ümumi səhifə sayı
        const totalPages = Math.ceil(displayExpenses.length / itemsPerPage);

        // Cari səhifə və səhifələmə üçün başlanğıc və son indeksləri hesablayırıq
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageExpenses = displayExpenses.slice(startIndex, endIndex);

        // Xərcləri cədvələ əlavə edirik
        currentPageExpenses.forEach((expense, index) => {
          const row = document.createElement('tr');
          row.innerHTML = ` 
        <td>${startIndex + index + 1}</td> 
        <td>${expense.category}</td>
        <td>${expense.amount}</td>
        <td>${expense.description}</td>
        <td>${expense.currency}</td>
        <td>${new Date(expense.date).toLocaleString('az-AZ', {
            timeZone: 'Asia/Baku',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}</td>
      `;
          expenseTableBody.appendChild(row);
        });

        // Səhifələmə düymələrini yaratmaq
        const paginationContainer = document.querySelector('#pagination');
        paginationContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
          const pageButton = document.createElement('button');
          pageButton.textContent = i;
          pageButton.classList.add('pagination-button');
          pageButton.onclick = () => {
            currentPage = i;
            updateExpenseTable(filteredExpenses); // Filtrlə cədvəli yenilə
          };

          // Cari səhifəni aktiv et
          if (i === currentPage) {
            pageButton.disabled = true;
          }

          paginationContainer.appendChild(pageButton);
        }

        // Əgər heç bir xərc yoxdursa
        if (displayExpenses.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="6">Hələ ki xərcləmə məlumatı yoxdur.</td>`;
          expenseTableBody.appendChild(row);
        }

      } catch (error) {
        console.error('Veri alınarkən xəta baş verdi:', error);
        const expenseTableBody = document.querySelector('#expenseTable tbody');
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6">Veri alınarkən xəta baş verdi. Zəhmət olmasa təkrar cəhd edin.</td>`;
        expenseTableBody.appendChild(row);
      }
    }

    // Filtrləmə tətbiq edildikdə cədvəli yeniləyirik
    document.getElementById('apply-filters').addEventListener('click', () => {
      const day = document.getElementById('filter-day').value;

      // Filtrlənmiş xərcləri əldə edirik
      const filteredExpenses = expenseList.length > 0 ? expenseList.filter(expense => {
        const expenseDate = new Date(expense.date);

        if (day) {
          const selectedDay = new Date(day);
          return expenseDate.getDate() === selectedDay.getDate() &&
            expenseDate.getMonth() === selectedDay.getMonth() &&
            expenseDate.getFullYear() === selectedDay.getFullYear();
        }

        return true; // Filtr seçilməyibsə, bütün xərcləri göstəririk
      }) : [];

      // Filtrə uyğun cədvəli yenilə
      currentPage = 1; // Filtr tətbiq edildikdə səhifə yenidən 1-ci səhifəyə sıfırlanır
      updateExpenseTable(filteredExpenses);
    });

    // Başlanğıcda cədvəli yüklə
    updateExpenseTable();

    // Sayfa yükləndikdə cədvəli yeniləyirik
    document.addEventListener('DOMContentLoaded', () => {
      updateExpenseTable();  // Başlanğıcda bütün xərcləri göstəririk
    });


    // Canvas elementi üçün qrafik yaradırıq
    const ctx = document.getElementById('expenseChart').getContext('2d');

    // Yeni Chart yaradılır
    window.expenseChart = new Chart(ctx, {
        type: 'bar', // Bar chart növü
        data: chartData, // Dataset verilənləri
        options: {
            responsive: true, // Uyğun ölçüdə görünüş
            maintainAspectRatio: false, // Aspect ratio'yu korumadan boyutlandırma
            scales: {
                y: {
                    beginAtZero: true, // Y oxu sıfırdan başlasın
                    grid: {
                        borderColor: 'rgba(255, 255, 255, 0.2)', // Y oxunun grid xətti rəngi
                        borderWidth: 1,
                        color: 'rgba(255, 255, 255, 0.1)', // Xəttin rəngi
                    },
                    ticks: {
                        font: {
                            size: 14, // Y oxu yazılarının ölçüsü
                            family: 'Arial, sans-serif', // Yazı tipi
                            weight: 'bold', // Yazının qalınlığı
                            color: '#fff' // Yazı rəngi
                        }
                    }
                },
                x: {
                    grid: {
                        borderColor: 'rgba(255, 255, 255, 0.2)', // X oxunun grid xətti rəngi
                        borderWidth: 1,
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                        font: {
                            size: 14, // X oxu yazılarının ölçüsü
                            family: 'Arial, sans-serif',
                            weight: 'bold',
                            color: '#fff' // Yazı rəngi
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Tooltip fonu
                    titleColor: '#fff', // Tooltip başlıq rəngi
                    bodyColor: '#fff', // Tooltip bədən rəngi
                    borderColor: 'rgba(255, 255, 255, 0.5)', // Tooltip sərhəd rəngi
                    borderWidth: 1, // Tooltip sərhəd qalınlığı
                    bodyFont: {
                        size: 14, // Tooltip bədən yazı ölçüsü
                        family: 'Arial, sans-serif',
                        weight: 'bold',
                    },
                    titleFont: {
                        size: 16, // Tooltip başlıq yazı ölçüsü
                        family: 'Arial, sans-serif',
                        weight: 'bold',
                    },
                    callbacks: {
                        label: function(tooltipItem) {
                            // Fərqli datasetlər üçün fərqli labellər
                            const dataset = tooltipItem.datasetIndex;
                            const dataValue = tooltipItem.raw;
                            if (dataset === 0) {
                                // İlk dataset: Toplam Xərc Miqdarı
                                return 'Toplam Xərc Miqdarı (Qiymət): ' + dataValue + ' AZN';
                            } else if (dataset === 1) {
                                // İkinci dataset: Xərc Sayı
                                return 'Xərc Sayı (Neçə Dəfə): ' + dataValue + ' dəfə';
                            }
                        }
                    }
                }
            },
            animation: {
                duration: 1200, // Animasiya müddəti (1.2 saniyə)
                easing: 'easeInOutQuad', // Animasiya effekti
            },
            layout: {
                padding: {
                    top: 10, // Yuxarı boşluq
                    right: 10, // Sağ boşluq
                    bottom: 10, // Aşağı boşluq
                    left: 10 // Sol boşluq
                }
            }
        }
    });

  } catch (error) {
    console.error('Veri alınırken bir hata oluştu:', error);
    // Hata mesajı ekleyelim
    const expenseTableBody = document.querySelector('#expenseTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">Veri alınırken bir hata oluştu. Lütfen tekrar deneyin.</td>`;
    expenseTableBody.appendChild(row);
  }
}
// Harcama tablosu güncellendikten sonra grafiği güncelle
updateExpenseStatistics();

document.addEventListener('DOMContentLoaded', () => {
  updateExpenseTable();
  updateExpenseStatistics();
});

// Excel dışa aktarma
document.getElementById('exportBtn').addEventListener('click', () => {
  const expensesRef = ref(db, 'expenses/' + localStorage.getItem('username'));
  get(expensesRef).then(snapshot => {
    const expenses = snapshot.val();

    if (!expenses) {
      alert('Veri bulunamadı.');
      return;
    }

    const data = Object.values(expenses).map(expense => ({
      Kategori: expense.category,
      Miktar: expense.amount,
      Açıklama: expense.description,
      Döviz: expense.currency,
      Tarih: new Date(expense.date).toLocaleString('az-AZ', {
        timeZone: 'Asia/Baku',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }));

    // Veriyi Excel sayfasına dönüştür
    const ws = XLSX.utils.json_to_sheet(data);

    // Başlıkları stilize et
    const header = ws['!rows'] = [];

    // Başlık hücrelerine mavi arka plan rengi ekleme
    const headerStyle = {
      fill: { fgColor: { rgb: "0000FF" } },  // Mavi renk
      font: { color: { rgb: "FFFFFF" }, bold: true }  // Beyaz yazı rengi ve kalın yazı
    };

    // Başlık hücrelerine stil uygula (ilk satırdaki başlıklar)
    const headers = ['A1', 'B1', 'C1', 'D1', 'E1'];  // Başlık hücrelerinin adresleri
    headers.forEach(cell => {
      ws[cell] = { ...ws[cell], s: headerStyle };
    });

    // Excel sayfasını oluştur
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Xərc Məlumatları");

    // Dosyayı dışa aktar
    XLSX.writeFile(wb, "xərc-hesabatı.xlsx");
  }).catch(error => {
    alert('Məlumat tapılmadı: ' + error.message);
    console.error('Məlumat tapılmadı:', error);
  });
});



// Excel faylını daxilə atama
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click(); 
});

// Fayl daxilə seçildiyində əməliyyat icra olunur
document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      const data = e.target.result;

      try {
        // Excel faylı oxunur
        const workbook = XLSX.read(data, { type: 'binary' });

        // İlk səhifə oxunur
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Səhifədəki malumatlar JSON formatına çevirilir
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Firebaseyə məlumat ötürülür
        const username = localStorage.getItem('username');
        const expensesRef = ref(db, 'expenses/' + username);

        // Əvvəkli məlumatlar silinir
        await remove(expensesRef);

        // Yeni məlumatlar Firebase ötürülür
        jsonData.forEach(row => {
          const { Kategori, Miktar, Açıklama, Döviz, Tarih } = row;

          // Məlumatları Fİrebase saxlayır
          push(expensesRef, {
            category: Kategori,
            amount: Miktar,
            description: Açıklama,
            currency: Döviz,
            date: new Date(Tarih).toISOString()  // Tarihi ISO formatına çeviriyoruz
          });
        });

        // Cədvəl güncəllənir
        updateExpenseTable();
        alert('Veriler başarıyla içeri aktarıldı!');
      } catch (error) {
        console.error('Hata:', error);
        alert('Məlumat içəri axtarılarkən xəta.');
      }
    };

    reader.readAsBinaryString(file);
  }
});
const dragDropArea = document.getElementById("drag-drop-area");
const fileInput = document.getElementById("fileInput");
const importBtn = document.getElementById("importBtn");

dragDropArea.addEventListener("click", () => {
  fileInput.click();
});

dragDropArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  dragDropArea.classList.add("dragover");
});

dragDropArea.addEventListener("dragleave", () => {
  dragDropArea.classList.remove("dragover");
});

dragDropArea.addEventListener("drop", (event) => {
  event.preventDefault();
  dragDropArea.classList.remove("dragover");

  const file = event.dataTransfer.files[0];
  handleFileUpload(file);
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleFileUpload(file);
});

function handleFileUpload(file) {
  if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
    dragDropArea.classList.remove("error");
    dragDropArea.classList.add("success");
    importBtn.disabled = false; // Enable the "Import" button when a valid file is selected
    alert(`Dosya "${file.name}" başarıyla yüklendi!`);
  } else {
    dragDropArea.classList.remove("success");
    dragDropArea.classList.add("error");
    importBtn.disabled = true; // Disable the "Import" button if the file is invalid
    alert("Lütfen geçerli bir Excel dosyası yükleyin (.xlsx veya .xls).");
  }
}
// Dark Light
const darklightButton = document.getElementById('darklightButton');
const darkIcon = document.querySelector('.darkicon');
const lightIcon = document.querySelector('.lighticon');

// Sayfa yüklendiğinde koyu modun aktif olup olmadığını kontrol et
if (document.body.classList.contains('dark-mode')) {
  darkIcon.style.display = 'none';
  lightIcon.style.display = 'inline';
} else {
  darkIcon.style.display = 'inline';
  lightIcon.style.display = 'none';
}

darklightButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    // Koyu moddayken ikonları değiştir
    darkIcon.style.display = 'none';  // Koyu ikonları gizle
    lightIcon.style.display = 'inline';  // Aydınlık ikonları göster
  } else {
    // Aydınlık moddayken ikonları değiştir
    darkIcon.style.display = 'inline';  // Koyu ikonları göster
    lightIcon.style.display = 'none';  // Aydınlık ikonları gizle
  }
});




const openCloseButton = document.getElementById("openCloseArrow")
openCloseButton.addEventListener('click', function () {
  const hiddenTxt = document.querySelectorAll('#sideTabs .hiddenTxt')
  const sideBar = document.getElementById("header");
  const isMobile = window.innerWidth <= 768;
  const profilIcon = document.getElementById('profile-icon')
  const profileBio = document.getElementById("profile-bio")
  const logoutLabel =  document.getElementById("logoutLbl")
  // Mobile
  if (isMobile) {
    if (sideBar.style.height === "20vw") {
      sideBar.style.height = "10vw";
      profilIcon.style.width = "10vw";
      openCloseButton.style.transform = "rotate(180deg)";
    }
    else {
      sideBar.style.height = "20vw";
      openCloseButton.style.transform = "rotate(0deg)";
    }
  }
// PC
  else {
    if (sideBar.style.width === "15%") {
      sideBar.style.width = "5%";
      profilIcon.style.width = '60px';
      openCloseButton.style.transform = "rotate(180deg)";
      hiddenTxt.forEach((p) => {
        p.style.display = 'none';  
      });
      profileBio.style.fontSize = "16px"
      logoutLabel.style.display = 'none'
    }
    else {
      sideBar.style.width = "15%";
      profilIcon.style.width = '120px';
      openCloseButton.style.transform = "rotate(0deg)";
      hiddenTxt.forEach((p) => {
        p.style.display = 'block';  
      });
      profileBio.style.fontSize = "20px"
      logoutLabel.style.display = 'block'
    }
  }
})

document.querySelectorAll('.tabLink').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

  
 