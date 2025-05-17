document.addEventListener('DOMContentLoaded', function() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js tidak dimuat. Periksa koneksi CDN atau URL.');
        return;
    }

    // Initialize chart variable
    let chart;
    
    // Current timeframe
    let currentTimeframe = 'monthly';
    
    // Current selected dates
    let currentDate = {
        daily: { month: 0, year: 2025 },
        weekly: { month: 0, year: 2025 },
        monthly: { year: 2025 }
    };
    
    // Data storage for all timeframes
    const allData = {
        daily: {},
        weekly: {},
        monthly: {},
        yearly: generateYearlyData()
    };
    
    // Initialize with monthly data
    initializeChart(generateMonthlyData(2025));
    updateStats(allData.yearly);
    updatePeriodText('monthly');
    
    // Timeframe selector event listeners
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const timeframe = this.getAttribute('data-timeframe');
            if (timeframe === currentTimeframe) return;
            
            // Update active button
            document.querySelector('.timeframe-btn.active').classList.remove('active');
            this.classList.add('active');
            
            // Update current timeframe
            currentTimeframe = timeframe;
            
            // Show/hide date selectors
            document.getElementById('daily-selector').style.display = 'none';
            document.getElementById('weekly-selector').style.display = 'none';
            document.getElementById('monthly-selector').style.display = 'none';
            
            if (timeframe === 'daily') {
                document.getElementById('daily-selector').style.display = 'flex';
                loadDailyData(currentDate.daily.month, currentDate.daily.year);
            } else if (timeframe === 'weekly') {
                document.getElementById('weekly-selector').style.display = 'flex';
                loadWeeklyData(currentDate.weekly.month, currentDate.weekly.year);
            } else if (timeframe === 'monthly') {
                document.getElementById('monthly-selector').style.display = 'flex';
                loadMonthlyData(currentDate.monthly.year);
            } else {
                // Yearly
                updateChart(allData.yearly);
                updateStats(allData.yearly);
                updatePeriodText('yearly');
            }
            
            // Reset detail panel
            resetDetailPanel();
        });
    });
    
    // Date selector event listeners
    document.getElementById('daily-month').addEventListener('change', function() {
        const month = parseInt(this.value);
        const year = parseInt(document.getElementById('daily-year').value);
        currentDate.daily.month = month;
        currentDate.daily.year = year;
        loadDailyData(month, year);
    });
    
    document.getElementById('daily-year').addEventListener('change', function() {
        const year = parseInt(this.value);
        const month = parseInt(document.getElementById('daily-month').value);
        currentDate.daily.year = year;
        currentDate.daily.month = month;
        loadDailyData(month, year);
    });
    
    document.getElementById('weekly-month').addEventListener('change', function() {
        const month = parseInt(this.value);
        const year = parseInt(document.getElementById('weekly-year').value);
        currentDate.weekly.month = month;
        currentDate.weekly.year = year;
        loadWeeklyData(month, year);
    });
    
    document.getElementById('weekly-year').addEventListener('change', function() {
        const year = parseInt(this.value);
        const month = parseInt(document.getElementById('weekly-month').value);
        currentDate.weekly.year = year;
        currentDate.weekly.month = month;
        loadWeeklyData(month, year);
    });
    
    document.getElementById('yearly-year').addEventListener('change', function() {
        const year = parseInt(this.value);
        currentDate.monthly.year = year;
        loadMonthlyData(year);
    });
    
    // Function to load daily data
    function loadDailyData(month, year) {
        const monthKey = `${month}-${year}`;
        
        if (!allData.daily[monthKey]) {
            allData.daily[monthKey] = generateDailyData(month, year);
        }
        
        updateChart(allData.daily[monthKey]);
        updateStats(allData.daily[monthKey]);
        updatePeriodText('daily', month, year);
    }
    
    // Function to load weekly data
    function loadWeeklyData(month, year) {
        const monthKey = `${month}-${year}`;
        
        if (!allData.weekly[monthKey]) {
            allData.weekly[monthKey] = generateWeeklyData(month, year);
        }
        
        updateChart(allData.weekly[monthKey]);
        updateStats(allData.weekly[monthKey]);
        updatePeriodText('weekly', month, year);
    }
    
    // Function to load monthly data
    function loadMonthlyData(year) {
        if (!allData.monthly[year]) {
            allData.monthly[year] = generateMonthlyData(year);
        }
        
        updateChart(allData.monthly[year]);
        updateStats(allData.monthly[year]);
        updatePeriodText('monthly', null, year);
    }
    
    // Function to generate random daily data (31 days)
    function generateDailyData(month, year) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1} ${monthNames[month].substring(0, 3)}`);
        const pengeluaran = Array(daysInMonth).fill(0);
        const tabungan = Array(daysInMonth).fill(0);
        const pengeluaranAsli = Array(daysInMonth).fill(0);
        const saldoHarian = [];
        
        // Specific transactions for the first few days
        tabungan[0] = 750000; // Tanggal 1: Nabung 750,000
        pengeluaran[2] = 500000; // Tanggal 3: Pengeluaran 500,000 (absolut)
        pengeluaranAsli[2] = -500000; // Tanggal 3: Pengeluaran -500,000 (asli)
        
        // Random transactions for other days
        for (let i = 0; i < daysInMonth; i++) {
            if (i === 0 || i === 2) continue;
            const hasPengeluaran = Math.random() > 0.5;
            const hasTabungan = Math.random() > 0.5;
            if (hasPengeluaran) {
                const amount = Math.floor(Math.random() * (2000000 - 200000 + 1)) + 200000;
                pengeluaran[i] = amount;
                pengeluaranAsli[i] = -amount;
            }
            if (hasTabungan) {
                tabungan[i] = Math.floor(Math.random() * (1500000 - 300000 + 1)) + 300000;
            }
        }
        
        // Calculate cumulative saldo
        let currentSaldo = 0;
        for (let i = 0; i < daysInMonth; i++) {
            currentSaldo += tabungan[i] + pengeluaranAsli[i];
            saldoHarian.push(currentSaldo);
        }
        
        // Calculate previous month's data for comparison
        let prevMonthExpense = 0;
        let prevMonthSaving = 0;
        let prevMonthBalance = 0;
        
        if (month > 0) {
            const prevMonthKey = `${month-1}-${year}`;
            if (!allData.daily[prevMonthKey]) {
                allData.daily[prevMonthKey] = generateDailyData(month-1, year);
            }
            prevMonthExpense = allData.daily[prevMonthKey].totalPengeluaran;
            prevMonthSaving = allData.daily[prevMonthKey].totalTabungan;
            prevMonthBalance = allData.daily[prevMonthKey].totalSaldo;
        } else if (year > 2023) {
            const prevMonthKey = `11-${year-1}`;
            if (!allData.daily[prevMonthKey]) {
                allData.daily[prevMonthKey] = generateDailyData(11, year-1);
            }
            prevMonthExpense = allData.daily[prevMonthKey].totalPengeluaran;
            prevMonthSaving = allData.daily[prevMonthKey].totalTabungan;
            prevMonthBalance = allData.daily[prevMonthKey].totalSaldo;
        }
        
        const totalPengeluaran = pengeluaran.reduce((a, b) => a + b, 0);
        const totalTabungan = tabungan.reduce((a, b) => a + b, 0);
        const totalSaldo = saldoHarian[daysInMonth-1] || 0;
        
        return {
            labels: days,
            pengeluaran,
            tabungan,
            pengeluaranAsli,
            saldoHarian,
            totalPengeluaran,
            totalTabungan,
            totalSaldo,
            prevPeriodChange: {
                expense: prevMonthExpense ? ((totalPengeluaran - prevMonthExpense) / prevMonthExpense * 100) : 0,
                saving: prevMonthSaving ? ((totalTabungan - prevMonthSaving) / prevMonthSaving * 100) : 0,
                balance: prevMonthBalance ? ((totalSaldo - prevMonthBalance) / Math.abs(prevMonthBalance) * 100) : 0
            }
        };
    }
    
    // Function to generate random weekly data (4-5 weeks in a month)
    function generateWeeklyData(month, year) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const weeksInMonth = Math.ceil(new Date(year, month + 1, 0).getDate() / 7);
        const weeks = Array.from({ length: weeksInMonth }, (_, i) => `Minggu ${i+1}, ${monthNames[month]}`);
        const pengeluaran = Array(weeksInMonth).fill(0);
        const tabungan = Array(weeksInMonth).fill(0);
        const pengeluaranAsli = Array(weeksInMonth).fill(0);
        const saldoMingguan = [];
        
        // Generate random data for each week
        for (let i = 0; i < weeksInMonth; i++) {
            // Random expenses (2-5 transactions per week)
            const expenseCount = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < expenseCount; j++) {
                const amount = Math.floor(Math.random() * (3000000 - 500000 + 1)) + 500000;
                pengeluaran[i] += amount;
                pengeluaranAsli[i] -= amount;
            }
            
            // Random savings (1-3 transactions per week)
            const savingCount = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < savingCount; j++) {
                tabungan[i] += Math.floor(Math.random() * (2000000 - 500000 + 1)) + 500000;
            }
        }
        
        // Calculate cumulative saldo
        let currentSaldo = 0;
        for (let i = 0; i < weeksInMonth; i++) {
            currentSaldo += tabungan[i] + pengeluaranAsli[i];
            saldoMingguan.push(currentSaldo);
        }
        
        // Calculate previous month's data for comparison
        let prevMonthExpense = 0;
        let prevMonthSaving = 0;
        let prevMonthBalance = 0;
        
        if (month > 0) {
            const prevMonthKey = `${month-1}-${year}`;
            if (!allData.weekly[prevMonthKey]) {
                allData.weekly[prevMonthKey] = generateWeeklyData(month-1, year);
            }
            prevMonthExpense = allData.weekly[prevMonthKey].totalPengeluaran;
            prevMonthSaving = allData.weekly[prevMonthKey].totalTabungan;
            prevMonthBalance = allData.weekly[prevMonthKey].totalSaldo;
        } else if (year > 2023) {
            const prevMonthKey = `11-${year-1}`;
            if (!allData.weekly[prevMonthKey]) {
                allData.weekly[prevMonthKey] = generateWeeklyData(11, year-1);
            }
            prevMonthExpense = allData.weekly[prevMonthKey].totalPengeluaran;
            prevMonthSaving = allData.weekly[prevMonthKey].totalTabungan;
            prevMonthBalance = allData.weekly[prevMonthKey].totalSaldo;
        }
        
        const totalPengeluaran = pengeluaran.reduce((a, b) => a + b, 0);
        const totalTabungan = tabungan.reduce((a, b) => a + b, 0);
        const totalSaldo = saldoMingguan[weeksInMonth-1] || 0;
        
        return {
            labels: weeks,
            pengeluaran,
            tabungan,
            pengeluaranAsli,
            saldoHarian: saldoMingguan,
            totalPengeluaran,
            totalTabungan,
            totalSaldo,
            prevPeriodChange: {
                expense: prevMonthExpense ? ((totalPengeluaran - prevMonthExpense) / prevMonthExpense * 100) : 0,
                saving: prevMonthSaving ? ((totalTabungan - prevMonthSaving) / prevMonthSaving * 100) : 0,
                balance: prevMonthBalance ? ((totalSaldo - prevMonthBalance) / Math.abs(prevMonthBalance) * 100) : 0
            }
        };
    }
    
    // Function to generate random monthly data (12 months)
    function generateMonthlyData(year) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const pengeluaran = Array(12).fill(0);
        const tabungan = Array(12).fill(0);
        const pengeluaranAsli = Array(12).fill(0);
        const saldoBulanan = [];
        
        // Generate random data for each month
        for (let i = 0; i < 12; i++) {
            // Random expenses (higher in certain months)
            const baseExpense = Math.floor(Math.random() * (10000000 - 3000000 + 1)) + 3000000;
            const variation = Math.floor(Math.random() * 2000000) - 1000000;
            pengeluaran[i] = baseExpense + variation;
            pengeluaranAsli[i] = -pengeluaran[i];
            
            // Random savings (higher at year end)
            const savingBase = 3000000;
            const savingBonus = i >= 9 ? Math.floor(Math.random() * 3000000) : 0;
            tabungan[i] = savingBase + Math.floor(Math.random() * 2000000) + savingBonus;
        }
        
        // Calculate cumulative saldo
        let currentSaldo = 0;
        for (let i = 0; i < 12; i++) {
            currentSaldo += tabungan[i] + pengeluaranAsli[i];
            saldoBulanan.push(currentSaldo);
        }
        
        // Calculate previous year's data for comparison
        let prevYearExpense = 0;
        let prevYearSaving = 0;
        let prevYearBalance = 0;
        
        if (year > 2023) {
            if (!allData.monthly[year-1]) {
                allData.monthly[year-1] = generateMonthlyData(year-1);
            }
            prevYearExpense = allData.monthly[year-1].totalPengeluaran;
            prevYearSaving = allData.monthly[year-1].totalTabungan;
            prevYearBalance = allData.monthly[year-1].totalSaldo;
        }
        
        const totalPengeluaran = pengeluaran.reduce((a, b) => a + b, 0);
        const totalTabungan = tabungan.reduce((a, b) => a + b, 0);
        const totalSaldo = saldoBulanan[11] || 0;
        
        return {
            labels: months,
            pengeluaran,
            tabungan,
            pengeluaranAsli,
            saldoHarian: saldoBulanan,
            totalPengeluaran,
            totalTabungan,
            totalSaldo,
            prevPeriodChange: {
                expense: prevYearExpense ? ((totalPengeluaran - prevYearExpense) / prevYearExpense * 100) : 0,
                saving: prevYearSaving ? ((totalTabungan - prevYearSaving) / prevYearSaving * 100) : 0,
                balance: prevYearBalance ? ((totalSaldo - prevYearBalance) / Math.abs(prevYearBalance) * 100) : 0
            }
        };
    }
    
    // Function to generate random yearly data (5 years)
    function generateYearlyData() {
        const years = ['2021', '2022', '2023', '2024', '2025'];
        const pengeluaran = Array(5).fill(0);
        const tabungan = Array(5).fill(0);
        const pengeluaranAsli = Array(5).fill(0);
        const saldoTahunan = [];
        
        // Generate random data for each year with growth
        for (let i = 0; i < 5; i++) {
            // Expenses grow slightly each year
            const expenseBase = 50000000;
            const expenseGrowth = i * 5000000;
            const expenseVariation = Math.floor(Math.random() * 10000000) - 5000000;
            pengeluaran[i] = expenseBase + expenseGrowth + expenseVariation;
            pengeluaranAsli[i] = -pengeluaran[i];
            
            // Savings grow more significantly
            const savingBase = 30000000;
            const savingGrowth = i * 8000000;
            const savingVariation = Math.floor(Math.random() * 5000000);
            tabungan[i] = savingBase + savingGrowth + savingVariation;
        }
        
        // Calculate cumulative saldo
        let currentSaldo = 0;
        for (let i = 0; i < 5; i++) {
            currentSaldo += tabungan[i] + pengeluaranAsli[i];
            saldoTahunan.push(currentSaldo);
        }
        
        const totalPengeluaran = pengeluaran.reduce((a, b) => a + b, 0);
        const totalTabungan = tabungan.reduce((a, b) => a + b, 0);
        const totalSaldo = saldoTahunan[4] || 0;
        
        return {
            labels: years,
            pengeluaran,
            tabungan,
            pengeluaranAsli,
            saldoHarian: saldoTahunan,
            totalPengeluaran,
            totalTabungan,
            totalSaldo,
            prevPeriodChange: {
                expense: 5,
                saving: 22,
                balance: 15
            }
        };
    }
    
    // Initialize chart with data
    function initializeChart(data) {
        const ctx = document.getElementById('stats-chart').getContext('2d');
        
        // Create gradient for each dataset
        function createGradient(ctx, color1, color2) {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, color1 + '80');
            gradient.addColorStop(1, color1 + '10');
            return gradient;
        }
        
        // Create chart
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Pengeluaran',
                        data: data.pengeluaran,
                        borderColor: '#f43f5e',
                        backgroundColor: createGradient(ctx, '#f43f5e', '#fda4af'),
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHitRadius: 10,
                        tension: 0.4,
                        fill: true,
                        borderJoinStyle: 'round',
                        borderCapStyle: 'round'
                    },
                    {
                        label: 'Tabungan',
                        data: data.tabungan,
                        borderColor: '#10b981',
                        backgroundColor: createGradient(ctx, '#10b981', '#6ee7b7'),
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHitRadius: 10,
                        tension: 0.4,
                        fill: true,
                        borderJoinStyle: 'round',
                        borderCapStyle: 'round'
                    },
                    {
                        label: 'Saldo Bersih',
                        data: data.saldoHarian,
                        borderColor: '#8b5cf6',
                        backgroundColor: createGradient(ctx, '#8b5cf6', '#c4b5fd'),
                        borderWidth: 3,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHitRadius: 10,
                        tension: 0.4,
                        fill: true,
                        borderJoinStyle: 'round',
                        borderCapStyle: 'round'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { family: 'Manrope', size: 14, weight: '700' },
                        bodyFont: { family: 'Manrope', size: 13, weight: '500' },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                                }
                                return label;
                            },
                            labelColor: function(context) {
                                return {
                                    borderColor: 'transparent',
                                    backgroundColor: context.dataset.borderColor,
                                    borderRadius: 4
                                };
                            }
                        }
                    },
                    crosshair: {
                        line: {
                            color: 'rgba(255, 255, 255, 0.2)',
                            width: 1,
                            dashPattern: [4, 4]
                        },
                        sync: {
                            enabled: true,
                            group: 1,
                            suppressTooltips: false
                        },
                        zoom: {
                            enabled: false
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { 
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: { family: 'Manrope', size: 11, weight: '500' },
                            color: '#64748b',
                            maxRotation: 0,
                            padding: 10
                        }
                    },
                    y: {
                        grid: { 
                            color: 'rgba(255, 255, 255, 0.05)', 
                            lineWidth: 1,
                            drawBorder: false,
                            tickLength: 0
                        },
                        ticks: {
                            font: { family: 'Manrope', size: 11, weight: '500' },
                            color: '#64748b',
                            padding: 10,
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return 'Rp ' + (value/1000000).toFixed(1) + 'jt';
                                } else if (value >= 1000) {
                                    return 'Rp ' + (value/1000).toFixed(0) + 'rb';
                                }
                                return 'Rp ' + value;
                            }
                        }
                    }
                },
                animation: { 
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: { 
                    mode: 'index', 
                    intersect: false 
                },
                elements: {
                    line: {
                        cubicInterpolationMode: 'monotone'
                    },
                    point: {
                        hoverBackgroundColor: '#ffffff',
                        hoverBorderWidth: 2
                    }
                }
            }
        });
        
        // Handle click event
        ctx.canvas.addEventListener('click', function(event) {
            const elements = chart.getElementsAtEventForMode(event, 'index', { intersect: false }, true);
            
            if (elements.length) {
                const index = elements[0].index;
                const pengeluaranVal = chart.data.datasets[0].data[index];
                const tabunganVal = chart.data.datasets[1].data[index];
                const saldoVal = chart.data.datasets[2].data[index];
                const prevSaldo = index > 0 ? chart.data.datasets[2].data[index-1] : 0;
                const change = prevSaldo !== 0 ? ((saldoVal - prevSaldo) / Math.abs(prevSaldo)) * 100 : 0;
                
                // Update detail panel
                document.getElementById('detail-date').textContent = chart.data.labels[index];
                document.getElementById('detail-expense').textContent = `Rp ${pengeluaranVal.toLocaleString('id-ID')}`;
                document.getElementById('detail-saving').textContent = `Rp ${tabunganVal.toLocaleString('id-ID')}`;
                const balanceDetail = document.getElementById('detail-balance');
                balanceDetail.textContent = `Rp ${Math.abs(saldoVal).toLocaleString('id-ID')}`;
                balanceDetail.className = saldoVal >= 0 ? 'detail-value positive' : 'detail-value negative';
                
                // Update summary card
                document.getElementById('summary-balance').textContent = `Rp ${Math.abs(saldoVal).toLocaleString('id-ID')}`;
                const summaryChange = document.getElementById('summary-change');
                summaryChange.className = change >= 0 ? 'summary-change positive' : 'summary-change negative';
                summaryChange.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="${change >= 0 ? '19' : '5'}" x2="12" y2="${change >= 0 ? '5' : '19'}"></line>
                        <polyline points="${change >= 0 ? '19 12 12 5 5 12' : '5 12 12 19 19 12'}"></polyline>
                    </svg>
                    <span>${Math.abs(change).toFixed(1)}% dari ${index > 0 ? (currentTimeframe === 'daily' ? 'kemarin' : currentTimeframe === 'weekly' ? 'minggu lalu' : currentTimeframe === 'monthly' ? 'bulan lalu' : 'tahun lalu') : 'awal periode'}</span>
                `;
                
                // Highlight the selected point
                chart.data.datasets.forEach(dataset => {
                    dataset.pointRadius = 0;
                    dataset.pointHoverRadius = 6;
                });
                
                chart.update();
            }
        });
    }
    
    // Update chart with new data
    function updateChart(data) {
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.pengeluaran;
        chart.data.datasets[1].data = data.tabungan;
        chart.data.datasets[2].data = data.saldoHarian;
        chart.update();
    }
    
    // Update statistics cards
    function updateStats(data) {
        document.getElementById('total-expense').textContent = `Rp ${data.totalPengeluaran.toLocaleString('id-ID')}`;
        document.getElementById('total-saving').textContent = `Rp ${data.totalTabungan.toLocaleString('id-ID')}`;
        const balanceElement = document.getElementById('total-balance');
        balanceElement.textContent = `Rp ${Math.abs(data.totalSaldo).toLocaleString('id-ID')}`;
        balanceElement.style.color = data.totalSaldo >= 0 ? '#10b981' : '#f43f5e';
        
        // Update change indicators
        updateChangeIndicator('expense', data.prevPeriodChange.expense);
        updateChangeIndicator('saving', data.prevPeriodChange.saving);
        updateChangeIndicator('balance', data.prevPeriodChange.balance);
    }
    
    // Update change indicator for a stat card
    function updateChangeIndicator(type, change) {
        const element = document.getElementById(`${type}-change`);
        const isPositive = change >= 0;
        
        element.className = isPositive ? 'change positive' : 'change negative';
        element.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="${isPositive ? '5' : '19'}" x2="12" y2="${isPositive ? '19' : '5'}"></line>
                <polyline points="${isPositive ? '19 12 12 19 5 12' : '5 12 12 19 19 12'}"></polyline>
            </svg>
            <span>${Math.abs(change).toFixed(1)}% dari ${currentTimeframe === 'daily' ? 'bulan lalu' : currentTimeframe === 'weekly' ? 'bulan lalu' : currentTimeframe === 'monthly' ? 'tahun lalu' : '5 tahun lalu'}</span>
        `;
    }
    
    // Update period text
    function updatePeriodText(timeframe, month, year) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        let periodText = '';
        let subtitleText = '';
        
        switch(timeframe) {
            case 'daily':
                periodText = `${monthNames[month]} ${year}`;
                subtitleText = `Visualisasi harian pengeluaran, tabungan, dan saldo keuangan Ipul selama ${monthNames[month]} ${year}`;
                break;
            case 'weekly':
                periodText = `${monthNames[month]} ${year} (Per Minggu)`;
                subtitleText = `Visualisasi mingguan pengeluaran, tabungan, dan saldo keuangan Ipul selama ${monthNames[month]} ${year}`;
                break;
            case 'monthly':
                periodText = `Tahun ${year} (Per Bulan)`;
                subtitleText = `Visualisasi bulanan pengeluaran, tabungan, dan saldo keuangan Ipul selama tahun ${year}`;
                break;
            case 'yearly':
                periodText = '5 Tahun Terakhir';
                subtitleText = 'Visualisasi tahunan pengeluaran, tabungan, dan saldo keuangan Ipul selama 5 tahun terakhir';
                break;
        }
        
        document.getElementById('current-period').textContent = periodText;
        document.getElementById('dashboard-subtitle').textContent = subtitleText;
    }
    
    // Reset detail panel when timeframe changes
    function resetDetailPanel() {
        document.getElementById('detail-date').textContent = 'Pilih periode pada grafik';
        document.getElementById('detail-expense').textContent = 'Rp 0';
        document.getElementById('detail-saving').textContent = 'Rp 0';
        document.getElementById('detail-balance').textContent = 'Rp 0';
        document.getElementById('detail-balance').className = 'detail-value';
        document.getElementById('summary-balance').textContent = 'Rp 0';
        document.getElementById('summary-change').className = 'summary-change positive';
        document.getElementById('summary-change').innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
            <span>0% dari periode sebelumnya</span>
        `;
    }
    
    // Legend click handler to toggle datasets
    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', function() {
            const datasetIndex = parseInt(this.getAttribute('data-dataset'));
            const meta = chart.getDatasetMeta(datasetIndex);
            
            // Toggle visibility
            meta.hidden = !meta.hidden;
            
            // Update chart
            chart.update();
            
            // Toggle active class
            this.classList.toggle('active');
        });
    });
});