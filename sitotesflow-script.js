const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const API_URL = 'https://api-sitotesflow.vercel.app/api'
let ImgProfile
const savedTheme = localStorage.getItem('theme');
const isLight = savedTheme === 'light';
let username = localStorage.getItem('username');
let dataMode = 'daily'
let dataProMod = 'day'
let pepeIs = true
let rawData
let rawEd
let imgObjectUrl


window.addEventListener('DOMContentLoaded', async () => {
    if (isLight) document.body.classList.add('light');
    setLoading(true)
    setAccentColor(localStorage.getItem('accent-color') || 'pink')
    updateThemeIcon(isLight);
    
    // jika dia belum login maka tampilkan halaman login
    if (!username) {
      document.getElementById('main-conn').style.display = 'none';
      document.getElementById('login-main').style.display = 'flex';
      setLoading(false, 1.5)
    } else {
        const res = await fetchingJson()
        ImgProfile = await generateImgProfile(res.users, API_URL)
        document.getElementById('main-conn').style.display = 'block';
        document.getElementById('login-main').style.display = 'none';
        document.getElementById('profile-img').src = ImgProfile[username].imgObj || ''
        await setLoading(false, 2)
        await dashboardLoad(res)
    }

    uiResponLoad()
    toggleDescription()
    
});

async function fetchingJson(loding = false) {
    username = localStorage.getItem('username');
    const res = await fetch(API_URL+'/'+username)
        .then(async response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Respon bukan JSON');
            }
            return await response.json()
        }).then(async response => {
            const res = await response
            if (res.error) {
                if (res.error === 'Username Belum Terdaftar') {
                    localStorage.removeItem('username')
                    alert('Refresh halaman')
                    location.reload()
                }
                return alert(res.error)
            }
            
            if (loding) setLoading(false, 0.2)
            return res
        }).catch(err => {
            alert("Koneksi Server gagal hubungi Owner:\n"+ err)
        })
    return res
}

// main DashBoard
async function dashboardLoad(data) {
    setLoading(true)
    const res = data? data : await fetchingJson(true)
    if (data) await setLoading(false, 0.2)

    const transs = res.transaction
    const yearSelect = document.getElementById('daily-year');
    const monthSelect = document.getElementById('daily-month');
    const years = [...new Set(transs.map(t => parseInt(t.date.split('||')[0].split('-')[2])))];
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    for (let year = minYear; year <= maxYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    const updateMonths = (selectedYear) => {
        monthSelect.innerHTML = '';

        const months = [...new Set(
            transs
                .filter(t => parseInt(t.date.split('||')[0].split('-')[2]) === selectedYear)
                .map(t => parseInt(t.date.split('||')[0].split('-')[1]) - 1)
        )].sort((a, b) => a - b);

        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = monthNames[month];
            monthSelect.appendChild(option);
        });

        if (months.length > 0) {
            monthSelect.value = Math.max(...months);
        }
    };
    rawEd = res
    let fal = JSON.parse(JSON.stringify(res))

    const lastTransaction = transs[transs.length - 1];
    if (lastTransaction) {
        const [lastDay, lastMonth, lastYear] = lastTransaction.date.split('||')[0].split('-');

        yearSelect.value = parseInt(lastYear);
        updateMonths(parseInt(lastYear));
        monthSelect.value = parseInt(lastMonth) - 1;
        
        yearSelect.addEventListener('change', () => {
            updateMonths(parseInt(yearSelect.value));
            setDataShort(dataMode, fal)
        });
        monthSelect.addEventListener('change', () => {
            setDataShort(dataMode, fal)
        });

        fal.transaction = sortByDay(res.transaction, parseInt(monthSelect.value)+1, yearSelect.value)
    }
    rawData = fal
    renderTransactions(fal)
    renderGrafic(fal)
}

function renderGrafic(filtered = { transaction: [] }) {
    const totalExpense = document.getElementById('total-expense')
    const totalSaving = document.getElementById('total-saving')
    const totalBalance = document.getElementById('total-balance')
    let minus = 0
    let pluss = 0
    let total = 0

    if (filtered.transaction.length === 0) {
        totalExpense.textContent = 'Rp 10000';
        totalSaving.textContent = 'Rp 10000';
        totalBalance.textContent = 'Rp 10000';
        return;
    }

    const trans = filtered.transaction;
    trans.forEach((t, index) => {
        if(t.jumlah < 0) {
            minus += t.jumlah
        } else {
            pluss += t.jumlah
        }
    })

    totalExpense.textContent = 'Rp ' + Math.abs(minus).toLocaleString('id-ID').replace(/,/g, '.');
    totalSaving.textContent = 'Rp ' + Math.abs(pluss).toLocaleString('id-ID').replace(/,/g, '.');
    totalBalance.textContent = 'Rp ' + Math.abs((pluss+minus)).toLocaleString('id-ID').replace(/,/g, '.');
}


function renderTransactions(filtered = { transaction: [] }) {
    const transactionTable = document.getElementById('transaction-table');

    // Fade out existing rows
    Array.from(transactionTable.children).forEach(row => {
        row.style.opacity = 0;
        row.style.transform = 'translateY(-5px)';
    });

    // Delay clear for smooth transition
    setTimeout(() => {
        transactionTable.innerHTML = '';
        
        if (filtered.transaction.length === 0) {
            transactionTable.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada transaksi ditemukan.</td></tr>';
            return;
        }

        const trans = filtered.transaction;
        trans.forEach((t, index) => {
            let [date, time] = t.date.replaceAll('-', '/').split('||');
            let [dd, mm, yyyy] = date.split('/');
            let day = new Date(`${yyyy}-${mm}-${dd}`);
            let hari = day.toLocaleDateString('id-ID', { weekday: 'long' });

            const tr = document.createElement('tr');
            tr.classList.add('fade-enter');
            setTimeout(() => tr.classList.add('fade-enter-active'), 10);

            let labelTanggal = '';
            if (dataMode === 'daily') labelTanggal = dd;
            else if (dataMode === 'weekly') labelTanggal = dd;
            else if (dataMode === 'monthly') labelTanggal = mm;
            else if (dataMode === 'yearly') labelTanggal = yyyy;

            const deleteBtnDisabled = dataMode === 'daily' ? '' : 'style="pointer-events: none; cursor: none; opacity: 0.2;"';

            document.querySelectorAll('th').forEach(th => {
                if (th.textContent.trim() === "Bulan" || th.textContent.trim() === "Minggu" || th.textContent.trim() === "Tahun" || th.textContent.trim() === "Profile") {
                    th.textContent = "Tanggal"
                }
            })

            document.querySelectorAll('th').forEach(th => {
                if (th.textContent.trim() === "Users" || th.textContent.trim() === "Tgl") {
                    th.textContent = "Hari"
                }
            })

            if (dataMode === 'daily') {
                document.querySelectorAll('th').forEach(th => {
                    if (th.textContent.trim() === "Tanggal") {
                        if (pepeIs) th.textContent = "Profile"
                    }
                })
                document.querySelectorAll('th').forEach(th => {
                    if (th.textContent.trim() === "Hari") {
                        if (pepeIs) th.textContent = "Users"
                    }
                })
                let dev = `       <td style="text-align: center;">${date.split('/')[0]}</td>
                                  <td style="text-align: center;">${hari}</td>`
                
                if (pepeIs) dev = `<td style="text-align: center;"><img src="${ImgProfile[t.by].imgObj || ''}" class="profileimg" onerror="null; this.src='./img/users.png';"></td>
                                   <td style="text-align: center;">${t.by}</td>`
                transactionTable.innerHTML += `
                    <tr>
                        ${dev}
                        <td style="color: ${t.jumlah > 0 ? '#34d399' : '#f87171'};">${t.jumlah > 0 ? '+' : ''}Rp ${Math.abs(t.jumlah).toLocaleString('id-ID').replace(/,/g, '.')}</td>
                        <td>${t.categ}</td>
                        <td>${t.info}</td>
                        <td><button class="delete-btn" onclick="deleteTransaction('${t.date}')">Hapus</button></td>
                    </tr>
                `;
            }
            if (dataMode === 'weekly') {
                document.querySelectorAll('th').forEach(th => {
                    if (th.textContent.trim() === "Tanggal") {
                        th.textContent = "Minggu"
                    }
                })
                document.querySelectorAll('th').forEach(th => {
                    if (th.textContent.trim() === "Hari") {
                        th.textContent = "Tgl"
                    }
                })
                let dev = ['ke`satu', 'ke`dua', 'ke`tiga', 'ke`empat', 'ke`lima']
                transactionTable.innerHTML += `
                    <tr>
                        <td>${dev[index]}</td>
                        <td style="text-align: center;">${date.split('/')[0]}</td>
                        <td style="color: ${t.jumlah > 0 ? '#34d399' : '#f87171'};">${t.jumlah > 0 ? '+' : ''}Rp ${Math.abs(t.jumlah).toLocaleString('id-ID').replace(/,/g, '.')}</td>
                        <td>${t.categ}</td>
                        <td>${t.info}</td>
                        <td><button class="delete-btn" style="pointer-events: none; cursor: none; opacity: 0.2;" onclick="deleteTransaction('${t.date}')">Hapus</button></td>
                    </tr>
                `;
            }
            if (dataMode === 'monthly') {
                document.querySelectorAll('th').forEach(th => {
                    if (th.textContent.trim() === "Tanggal") {
                        th.textContent = "Bulan"
                    }
                })
                transactionTable.innerHTML += `
                    <tr>
                        <td style="text-align: center;">${date.split('/')[1]}</td>
                        <td>${hari}</td>
                        <td style="color: ${t.jumlah > 0 ? '#34d399' : '#f87171'};">${t.jumlah > 0 ? '+' : ''}Rp ${Math.abs(t.jumlah).toLocaleString('id-ID').replace(/,/g, '.')}</td>
                        <td>${t.categ}</td>
                        <td>${t.info}</td>
                        <td><button class="delete-btn" style="pointer-events: none; cursor: none; opacity: 0.2;" onclick="deleteTransaction('${t.date}')">Hapus</button></td>
                    </tr>
                `;
            }
            if (dataMode === 'yearly') {
                document.querySelectorAll('th').forEach(th => {
                    if (th.textContent.trim() === "Tanggal") {
                        th.textContent = "Tahun"
                    }
                })
                transactionTable.innerHTML += `
                    <tr>
                        <td>${date.split('/')[2]}</td>
                        <td>${hari}</td>
                        <td style="color: ${t.jumlah > 0 ? '#34d399' : '#f87171'};">${t.jumlah > 0 ? '+' : ''}Rp ${Math.abs(t.jumlah).toLocaleString('id-ID').replace(/,/g, '.')}</td>
                        <td>${t.categ}</td>
                        <td>${t.info}</td>
                        <td><button class="delete-btn" style="pointer-events: none; cursor: none; opacity: 0.2;" onclick="deleteTransaction('${t.date}')">Hapus</button></td>
                    </tr>
                `;
            }
        });
    }, 100);
}

function uiResponLoad() {
    username = localStorage.getItem('username')
    const form = document.getElementById('transaction-form')
    
    const profile = document.querySelector('.profile img')
    const profileMenu = document.getElementById('profile-menu')
    
    const accent = document.getElementById('switch-accent')
    const accentMenu = document.getElementById('accent-menu')
    
    const ubahProfile = document.getElementById('ubah-profile')

    const dialogMenu = document.getElementById('dialog-menu')
    const dialogBacdrop = document.getElementById('dialog-backdrop')
    const hideDialog = document.getElementById('selesai')

    const elmtUproflie = document.getElementById('ubahprofil-menu')
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('autoUploadBtn');
    const progressBar = document.getElementById('progress');

    const uploadImg = document.getElementById('upload-img')


    ubahProfile.addEventListener('click', () => {
        dialogMenu.classList.add('show')
        dialogBacdrop.classList.add('show')

        elmtUproflie.classList.add('show')
        uploadImg.src = ImgProfile[username].imgObj || ''
    })

    hideDialog.addEventListener('click', () => {
        dialogMenu.classList.remove('show')
        dialogBacdrop.classList.remove('show')

        elmtUproflie.classList.remove('show')
    })

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        if (fileInput.files.length === 0) return;
        hideDialog.style.display = 'none'
        uploadBtn.style.display = 'none'
        const resizeFile = await resizeImage(fileInput.files[0], 300)
        document.querySelector('.progress-bar-upload').style.display = 'block'
        const reader = new FileReader()
        reader.onload = function(e) {
            uploadImg.src = e.target.result
        }
        reader.readAsDataURL(fileInput.files[0])

        const formData = new FormData();
        formData.append('file', resizeFile);
        formData.append('customName', username);
        formData.append('autoReplace', 'true');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL+'/upload');

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + '%';
            }
        };

        xhr.onload = () => {
            progressBar.style.width = '0%';
            document.querySelector('.progress-bar-upload').style.display = 'none'
            if (xhr.status === 200) {
                showNotification('Berhasil mengubah profile')
                hideDialog.style.display = 'block'
                uploadBtn.style.display = 'block'
                dialogMenu.classList.remove('show')
                dialogBacdrop.classList.remove('show')
                elmtUproflie.classList.remove('show')
                location.reload()
            } else {
                showNotification('Gagal mengubah profile', 3000, 'warning');
                hideDialog.style.display = 'block'
                uploadBtn.style.display = 'block'
                uploadBtn.style.display = 'block'
            }
        };

        xhr.send(formData);
    });

    // profile menu
    profile.addEventListener('click', () => {
        profileMenu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
        if (!profile.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('show');
        }
    });
    // accent color
    accent.addEventListener('click', () => {
        accentMenu.classList.toggle('show');
        profileMenu.classList.remove('show');
    });
    document.addEventListener('click', (e) => {
        if (!accent.contains(e.target) && !accentMenu.contains(e.target)) {
            accentMenu.classList.remove('show');
        }
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        updateThemeIcon(isLight);
        drawCharts();
    });

    // Tutup sidebar saat klik di luar
    const sidebar = document.getElementById('sidebar');
    document.addEventListener('click', (e) => {
        const toggle = document.getElementById('menu-toggle');
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickToggle = toggle.contains(e.target);

        if (!isClickInsideSidebar && !isClickToggle) {
            sidebar.classList.remove('open');
        }
    });

    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('open');
        })
    })


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await setLoading(true)
        const amount = parseInt(document.getElementById('amount').value.replace(/\./g, ''));
        const type = document.getElementById('type').value;
        const category = type === 'expense' ? document.getElementById('category').value : '-';
        const description = type === 'expense' ? document.getElementById('description').value : '-';
        const d = new Date()

        const data = { 
            action: "add_transaction",
            payload: {
                user: username,
                transaction: {
                    jumlah: type === 'income' ? amount : -amount,
                    categ: category,
                    info: description,
                    date: `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}||${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
                    by: username
                }
            }
        };

        await axios.post(API_URL, data).then(response => {
            showNotification('Transaksi berhasil ditambahkan!')
            form.reset();
        }).catch(error => {
            console.log(error)
            showNotification('Terjadi masalah refresh brouser!', 3000, "error")
        });

        await toggleDescription()
        await dashboardLoad()
    })

    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let fal = JSON.parse(JSON.stringify(rawEd))
            const timeframe = this.getAttribute('data-timeframe');
            if (timeframe === dataMode) return;
            document.querySelector('.timeframe-btn.active').classList.remove('active');
            this.classList.add('active');
            dataMode = timeframe;
            
            const profileShow = document.querySelector('.profile-btn')
            if(timeframe === 'daily') {
                profileShow.style.display = 'inline'
            } else {
                profileShow.style.display = 'none'
            }

            setDataShort(timeframe, fal)
        });
    });

    document.querySelector('.profile-btn')
      .addEventListener('click', function() {
        if (this.classList.contains('active')) {
            this.classList.remove('active')
            this.textContent = '> PP <'
            pepeIs = false
        } else {
            this.classList.add('active');
            this.textContent = '< PP >'
            pepeIs = true
        }

        renderTransactions(rawData)
    });
}

function setDataShort(timeframe, fal) {
    const yearSelect = document.getElementById('daily-year');
    const monthSelect = document.getElementById('daily-month');

    document.getElementById('daily-month').style.display = 'none';
    document.getElementById('daily-year').style.display = 'none';

    if (timeframe === 'daily') {
        fal.transaction = sortByDay(rawEd.transaction, parseInt(monthSelect.value)+1, yearSelect.value)
        rawData = fal
        renderTransactions(fal)
        document.getElementById('daily-month').style.display = 'inline';
        document.getElementById('daily-year').style.display = 'inline';
    } else if (timeframe === 'weekly') {
        fal.transaction = sortByWeeks(rawEd.transaction, parseInt(monthSelect.value)+1, yearSelect.value)
        rawData = fal
        renderTransactions(fal)
        document.getElementById('daily-month').style.display = 'inline';
        document.getElementById('daily-year').style.display = 'inline';
    } else if (timeframe === 'monthly') {
        fal.transaction = sortByMonth(rawEd.transaction, yearSelect.value)
        rawData = fal
        renderTransactions(fal)
        document.getElementById('daily-year').style.display = 'inline';
    } else {
        fal.transaction = sortByYear(rawEd.transaction)
        rawData = fal
        renderTransactions(fal)
    }
}

function toggleDescription() {
    const type = document.getElementById('type').value;

    document.getElementById('description-field').style.display = type === 'expense' ? 'block' : 'none';
    document.getElementById('category-field').style.display = type === 'expense' ? 'block' : 'none';
}


// Login & LogOut
async function login() {
    username = document.getElementById('username-login').value;
    if (!username) return alert('Masukkan username!');
    await setLoading(true)
    const res = await fetch(API_URL+'/'+username)
        .then(async response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Respon bukan JSON');
            }
            return await response.json()
        }).then(async response => {
            const res = await response
            if (res.error) {
                alert(res.error)
                await setLoading(false, 2)
            } else if (!res.users[0].username) {
                alert('Username tidak ditemukan!');
                await setLoading(false, 2)
            }
    

            return res
        }).catch(err => {
            alert("Koneksi Server gagal hubungi Owner:\n"+ err)
        })

    const data = await res
    if (data?.users?.length) {
        localStorage.setItem('username', username);
        const res = await fetchingJson()
        ImgProfile = await generateImgProfile(res.users, API_URL)
        document.getElementById('main-conn').style.display = 'block';
        document.getElementById('login-main').style.display = 'none';
        document.getElementById('profile-img').src = ImgProfile[username].imgObj || ''
        await dashboardLoad(res)
        location.reload()
    }
    
}

async function siginOut() {
    setLoading(true)
    localStorage.removeItem('username');
    await setLoading(false, 2)
    document.getElementById('main-conn').style.display = 'none';
    document.getElementById('login-main').style.display = 'flex';
    location.reload()
}

async function setLoading(isVisible, delayInSeconds = 0) {
    const loading = document.querySelector('.loading');
    const backdrop = document.querySelector('.loading-backdrop');
    const delay = delayInSeconds * 1000;

    return new Promise(resolve => {
        setTimeout(() => {
            if (isVisible) {
                loading.classList.add('show');
                backdrop.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                loading.classList.remove('show');
                backdrop.classList.remove('show');
                document.body.style.overflow = '';
            }
            resolve(); // biar `await` bisa lanjut
        }, delay);
    });
}

function showNotification(text, dur = 4000, sett = "hijau") {
    const notif = document.getElementById("notification")
    notif.textContent = text
    notif.classList.add(sett)
    notif.classList.add("show")

    setTimeout(() => {
        notif.classList.remove(sett)
        notif.classList.remove("show")
    }, dur)
}

function setAccentColor(value) {
    const color = value;
    let primary, secondary;
    if (color === 'pink') {
        primary = '#f9a8d4';
        secondary = '#06d6a0';
    } else if (color === 'cyan') {
        primary = '#06d6a0';
        secondary = '#f9a8d4';
    } else {
        primary = '#a78bfa';
        secondary = '#06d6a0';
    }
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    localStorage.setItem('accent-color', color);
}

function updateThemeIcon(isLight) {
    const path = document.getElementById('theme-icon-path');
    if (isLight) {
        // Bulan
        path.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z');
    } else {
        // Matahari
        path.setAttribute('d', 'M12 4V2m0 20v-2m8-8h2M2 12H4m14.12 5.88l1.42 1.42M4.47 4.47l1.42 1.42M16.24 7.76l1.42-1.42M6.34 17.66l-1.42 1.42M12 8a4 4 0 100 8 4 4 0 000-8z');
    }
}

function formatNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value) {
        input.value = Number(value).toLocaleString('id-ID').replace(/,/g, '.');
    } else {
        input.value = '';
    }
}

function parseDate(dateStr) {
    const [date, time] = dateStr.split('||');
    const [day, month, year] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function sortByDay(transa, bln, thn) {
    const hhh = JSON.parse(JSON.stringify(transa))
    return hhh
        .filter(t => t.date.includes('-'+bln+'-'+thn))
        .sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateA - dateB;
        });
}

async function generateImgProfile(users, apii) {
  const ImgProfile = {};

  for (const user of users) {
    try {
        if (!user.img == '') {
            const response = await fetch(apii+'/drive/image?id='+user.img);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            ImgProfile[user.username] = {
                imgObj: objectUrl
            };
        } else {
            ImgProfile[user.username] = {
                imgObj: ''
            };
        }

        
    } catch (err) {
      console.error(`Failed to fetch image for ${user.username}:`, err);
    }
  }

  return ImgProfile;
}

function sortByWeeks(transactions, bln, thn) {
    const weeklyData = {};

    transactions
        .filter(t => t.date.includes('-'+bln+'-'+thn))
        .forEach(t => {
            const date = parseDate(t.date);
            const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1;
            const weekKey = `Week ${weekNumber}`;
            if (!weeklyData[weekKey]) weeklyData[weekKey] = [];
            weeklyData[weekKey].push(t);
        });

    const result = Object.values(weeklyData).map(weekTrans => {
        weekTrans.sort((a, b) => parseDate(a.date) - parseDate(b.date));

        const totalJumlah = weekTrans.reduce((sum, t) => sum + t.jumlah, 0);
        const last = weekTrans[weekTrans.length - 1];

        return {
            jumlah: totalJumlah,
            categ: last.categ,
            info: last.info,
            date: last.date
        };
    });

    result.sort((a, b) => parseDate(a.date) - parseDate(b.date));

    return result;
}

function sortByMonth(transactions, thn) {
    const monthlyData = {};

    transactions
        .filter(t => t.date.includes(thn))
        .forEach(t => {
            const date = parseDate(t.date);
            const month = date.getMonth() + 1;
            const monthKey = `Month ${month}`;
            if (!monthlyData[monthKey]) monthlyData[monthKey] = [];
            monthlyData[monthKey].push(t);
        });

    const result = Object.values(monthlyData).map(monthTrans => {
        monthTrans.sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const totalJumlah = monthTrans.reduce((sum, t) => sum + t.jumlah, 0);
        const last = monthTrans[monthTrans.length - 1];
        return {
            jumlah: totalJumlah,
            categ: last.categ,
            info: last.info,
            date: last.date
        };
    });
    result.sort((a, b) => parseDate(a.date) - parseDate(b.date));
    return result;
}

function sortByYear(transactions) {
    const yearlyData = {};

    transactions.forEach(t => {
        const date = parseDate(t.date);
        const year = date.getFullYear();
        const yearKey = `${year}`;
        if (!yearlyData[yearKey]) yearlyData[yearKey] = [];
        yearlyData[yearKey].push(t);
    });

    const result = Object.values(yearlyData).map(yearTrans => {
        yearTrans.sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const totalJumlah = yearTrans.reduce((sum, t) => sum + t.jumlah, 0);
        const last = yearTrans[yearTrans.length - 1];

        return {
            jumlah: totalJumlah,
            categ: last.categ,
            info: last.info,
            date: last.date
        };
    });

    result.sort((a, b) => parseDate(a.date) - parseDate(b.date));
    return result;
}

function resizeImage(file, maxSize = 200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                resolve(new File([blob], file.name, { type: file.type }));
            }, file.type, 0.8);
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}



// Pencarian transaksi
function searchTransactions() {
    const query = document.getElementById('search').value.toLowerCase();
    setLoading(true)
    setTimeout(() => {
        const filtered = rawData.transaction.filter(t =>
            t.info.toLowerCase().includes(query) ||
            Math.abs(t.jumlah).toString().includes(query.replace(/\./g, ''))
        );
        renderTransactions({transaction: filtered});
        setLoading(false)
    }, 500);
}






let transactions = JSON.parse(localStorage.getItem('transactions')) || [
    { date: '01/01/2025', day: 'Rabu', amount: 5000, type: 'income', category: '-', description: '-' },
    { date: '02/01/2025', day: 'Kamis', amount: -2000, type: 'expense', category: 'Makanan', description: 'Beli Cilok' }
];


// Format nominal dengan koma

// Tampilkan/sembunyikan keterangan dan kategori

// Toggle sidebar


// Toggle profile menu


// Toggle tema



// Inisialisasi tema

// Simpan transaksi



// Render transaksi

// Hapus transaksi
async function deleteTransaction(values) {
    setLoading(true)
    const tanya = confirm(`Apakah Yakin Mau menghapus Data Tgl ${values}`)
    
    if (tanya) {
        const tanyalagi = confirm(`Yakin Beneran Mau menghapus Data Tgl ${values}`)
        if (tanyalagi) {
            const rowToDelete = Array.from(document.querySelectorAll('#transaction-table tr'))
                .find(row => row.innerHTML.includes(values));
            const data = { 
                action: "delete_transaction",
                payload: {
                    user: username,
                    date: values
                }
            };

            await axios.post(API_URL, data).then(async response => {
                await setLoading(false)
                if (rowToDelete) {
                    rowToDelete.classList.add('fade-out');
                }
                showNotification('Berhasil Terhapus', 3000, 'warning');
                await setTimeout(async () => {
                    await dashboardLoad();
                }, 2000);
            }).catch(error => {
                showNotification('Terjadi masalah refresh brouser!', 3000, 'error');
            });
        }
    }
    await setLoading(false)
}

// Filter transaksi
const monthFilter = document.getElementById('month-filter');
const typeFilter = document.getElementById('type-filter');
const loading = document.getElementById('loading');
function filterTransactions() {
    loading.classList.add('show');
    setTimeout(() => {
        const month = monthFilter.value;
        const type = typeFilter.value;
        const filtered = transactions.filter(t => {
            const monthMatch = month === 'all' || t.date.includes(month.slice(-2));
            const typeMatch = type === 'all' || t.type === type;
            return monthMatch && typeMatch;
        });
        // renderTransactions(filtered);
        loading.classList.remove('show');
    }, 500);
}

monthFilter.addEventListener('change', filterTransactions);
typeFilter.addEventListener('change', filterTransactions);


// Ekspor CSV
function exportCSV() {
    const csv = ['Tanggal,Hari,Nominal,Kategori,Keterangan'];
    transactions.forEach(t => {
        csv.push(`${t.date},${t.day},${t.amount > 0 ? '+' : ''}Rp ${Math.abs(t.amount).toLocaleString('id-ID').replace(/,/g, '.')},${t.category},${t.description}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitotes_flow_transaksi.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Backup Data
function backupData() {
    const data = JSON.stringify(transactions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitotes_flow_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    notification.innerHTML = 'Data berhasil di-backup!';
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 4000);
}

// Grafik Statistik & Kategori & Tren
function drawCharts() {
    // Grafik Pemasukan & Pengeluaran
    const ctx = document.getElementById('stats-chart-up').getContext('2d');
    const width = ctx.canvas.width = 600;
    const height = ctx.canvas.height = 300;
    const barWidth = 120;
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const max = Math.max(income, expense, 10000);

    ctx.fillStyle = document.body.classList.contains('light') ? '#f9fafb' : '#2a2a2a';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#34d399';
    ctx.fillRect(100, height - (income / max * 250), barWidth, income / max * 250);
    ctx.fillStyle = document.body.classList.contains('light') ? '#1f2937' : '#f3e8ff';
    ctx.font = '14px Inter';
    ctx.fillText('Pemasukan', 100, height - 20);
    ctx.fillText(`Rp ${income.toLocaleString('id-ID').replace(/,/g, '.')}`, 100, height - (income / max * 250) - 20);

    ctx.fillStyle = '#f87171';
    ctx.fillRect(300, height - (expense / max * 250), barWidth, expense / max * 250);
    ctx.fillStyle = document.body.classList.contains('light') ? '#1f2937' : '#f3e8ff';
    ctx.fillText('Pengeluaran', 300, height - 20);
    ctx.fillText(`Rp ${expense.toLocaleString('id-ID').replace(/,/g, '.')}`, 300, height - (expense / max * 250) - 20);

    // Grafik Kategori
    const ctxCat = document.getElementById('category-chart').getContext('2d');
    ctxCat.canvas.width = 400;
    ctxCat.canvas.height = 400;
    const categories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);
    const colors = ['#f87171', '#f9a8d4', '#06d6a0', '#3b82f6', '#eab308'];

    let startAngle = 0;
    const total = data.reduce((sum, val) => sum + val, 0) || 1;
    ctxCat.fillStyle = document.body.classList.contains('light') ? '#f9fafb' : '#2a2a2a';
    ctxCat.fillRect(0, 0, ctxCat.canvas.width, ctxCat.canvas.height);

    data.forEach((value, i) => {
        ctxCat.beginPath();
        ctxCat.fillStyle = colors[i % colors.length];
        const sliceAngle = (value / total) * 2 * Math.PI;
        ctxCat.arc(200, 200, 150, startAngle, startAngle + sliceAngle);
        ctxCat.lineTo(200, 200);
        ctxCat.fill();
        startAngle += sliceAngle;
    });

    ctxCat.font = '14px Inter';
    ctxCat.fillStyle = document.body.classList.contains('light') ? '#1f2937' : '#f3e8ff';
    labels.forEach((label, i) => {
        ctxCat.fillStyle = colors[i % colors.length];
        ctxCat.fillRect(300, 50 + i * 30, 20, 20);
        ctxCat.fillStyle = document.body.classList.contains('light') ? '#1f2937' : '#f3e8ff';
        ctxCat.fillText(label, 330, 65 + i * 30);
    });
}

drawCharts();
window.addEventListener('resize', drawCharts);

// Pengingat Harian
const reminderForm = document.getElementById('reminder-form');
reminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = document.getElementById('reminder-amount').value;
    const time = document.getElementById('reminder-time').value;
    notification.innerHTML = `Pengingat disetel: Tabung Rp ${amount} setiap hari jam ${time}!`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 4000);
    reminderForm.reset();
});

// Inisialisasi
// renderTransactions();
