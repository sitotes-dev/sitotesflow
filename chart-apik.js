document.addEventListener('DOMContentLoaded', async function() { if (typeof Chart === 'undefined') { console.error('Chart.js tidak dimuat. Periksa koneksi CDN atau URL.'); return; }

// Load data from JSON file
let allData = { 
  "labels": [
    "1 Jan",
    "2 Jan",
    "3 Jan",
    "4 Jan",
    "5 Jan",
    "6 Jan",
    "7 Jan",
    "8 Jan",
    "9 Jan",
    "10 Jan"
  ],
  "pengeluaran": [
    100000,
    50000,
    100000,
    150000,
    200000,
    250000,
    300000,
    350000,
    400000,
    450000
  ],
  "tabungan": [
    0,
    60000,
    120000,
    180000,
    240000,
    300000,
    360000,
    420000,
    480000,
    540000
  ],
  "saldoHarian": [
    0,
    10000,
    30000,
    60000,
    100000,
    150000,
    210000,
    280000,
    360000,
    450000
  ]
}

let chart;


initializeChart(allData);

function initializeChart(data) {
    const ctx = document.getElementById('stats-chart').getContext('2d');

    function createGradient(ctx, color1, color2) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color1 + '80');
        gradient.addColorStop(1, color1 + '10');
        return gradient;
    }

chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: data.labels,
        datasets: [
            {
                label: 'Pengeluaran',
                data: data.pengeluaran,
                borderColor: '#ef4444', // Red lebih tajam
                backgroundColor: createGradient(ctx, '#ef4444', '#fca5a5'),
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 8, // Lebih besar saat hover
                pointHoverBackgroundColor: '#ef4444',
                pointHoverBorderWidth: 2,
                tension: 0.4,
                fill: true,
                borderDash: [0], // Garis solid
                yAxisID: 'y'
            },
            {
                label: 'Tabungan',
                data: data.tabungan,
                borderColor: '#10b981', // Hijau lebih konsisten
                backgroundColor: createGradient(ctx, '#10b981', '#6ee7b7'),
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderWidth: 2,
                tension: 0.4,
                fill: true,
                borderDash: [0],
                yAxisID: 'y'
            },
            {
                label: 'Saldo Bersih',
                data: data.saldoHarian,
                borderColor: '#6366f1', // Ungu lebih soft
                backgroundColor: 'transparent', // Tidak ada fill untuk saldo
                borderWidth: 4, // Lebih tebal
                pointRadius: 0,
                pointHoverRadius: 10, // Lebih besar dari yang lain
                pointHoverBackgroundColor: '#6366f1',
                pointHoverBorderWidth: 3,
                tension: 0.4,
                fill: false, // Tidak diisi agar tidak overlap
                borderDash: [0],
                yAxisID: 'y'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // Lebih fleksibel untuk mobile
        devicePixelRatio: 2, // Lebih sharp di mobile
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#64748b',
                    font: {
                        size: window.innerWidth < 600 ? 10 : 12, // Responsif font size
                        family: "'Inter', sans-serif"
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                bodySpacing: 5,
                padding: 12,
                borderColor: '#334155',
                borderWidth: 1,
                cornerRadius: 8,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                        return label;
                    }
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
                    color: '#64748b',
                    maxRotation: window.innerWidth < 600 ? 45 : 0, // Miring jika mobile
                    padding: 10,
                    font: {
                        size: window.innerWidth < 600 ? 10 : 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(100, 116, 139, 0.1)',
                    drawBorder: false,
                    lineWidth: 1
                },
                ticks: {
                    color: '#64748b',
                    padding: 10,
                    font: {
                        size: window.innerWidth < 600 ? 10 : 11
                    },
                    callback: function(value) {
                        if (value >= 1000000) {
                            return 'Rp ' + (value/1000000).toLocaleString('id-ID') + 'jt';
                        }
                        return 'Rp ' + value.toLocaleString('id-ID');
                    }
                }
            }
        },
        zoom: {
            zoom: {
                enabled: false
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
                cubicInterpolationMode: 'monotone' // Garis lebih smooth
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: window.innerWidth < 600 ? 10 : 20,
                bottom: window.innerWidth < 600 ? 5 : 10
            }
        }
    }
});
}

});

