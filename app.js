// ===== 粒子背景 =====
(function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.color = ['#FF1744', '#2979FF', '#FFD600', '#AA00FF', '#00E5FF'][Math.floor(Math.random() * 5)];
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
})();

// ===== 数字滚动动画 =====
function animateNumbers() {
    document.querySelectorAll('.stat-num').forEach(el => {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// 首屏数字动画
const heroObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            animateNumbers();
            heroObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.5 });
heroObserver.observe(document.getElementById('hero'));

// ===== 生成卡片 =====
const cardGrid = document.getElementById('cardGrid');

function getEraClass(era) {
    const map = { showa: 'era-showa', heisei: 'era-heisei', 'new-gen': 'era-new-gen', reiwa: 'era-reiwa' };
    return map[era] || '';
}

function getEraName(era) {
    const map = { showa: '昭和', heisei: '平成', 'new-gen': '新生代', reiwa: '令和' };
    return map[era] || '';
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<span class="star">★</span>';
        } else if (i - 0.5 <= rating) {
            html += '<span class="star">★</span>';
        } else {
            html += '<span class="star empty">★</span>';
        }
    }
    return html;
}

function renderCards(data) {
    cardGrid.innerHTML = '';
    if (data.length === 0) {
        cardGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1;">
                <div class="no-results-icon">🔍</div>
                <p>没有找到匹配的奥特曼</p>
            </div>`;
        return;
    }
    data.forEach((u, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.setProperty('--card-color', u.color);
        card.style.animationDelay = `${idx * 0.06}s`;

        card.innerHTML = `
            <div class="card-image-wrap" style="--card-color:${u.color}">
                <img class="card-image" src="${u.image}" alt="${u.name}" loading="lazy" />
                <div class="card-image-overlay"></div>
            </div>
            <div class="card-header">
                <div class="card-title-group">
                    <div class="card-name">${u.name}</div>
                    <div class="card-name-en">${u.nameEn.toUpperCase()}</div>
                </div>
                <span class="card-era ${getEraClass(u.era)}">${getEraName(u.era)}</span>
            </div>
            <div class="card-stats">
                <div class="card-stat"><span class="card-stat-label">身高</span><span class="card-stat-value">${u.height}</span></div>
                <div class="card-stat"><span class="card-stat-label">体重</span><span class="card-stat-value">${u.weight}</span></div>
                <div class="card-stat"><span class="card-stat-label">变身器</span><span class="card-stat-value">${u.transformItem}</span></div>
                <div class="card-stat"><span class="card-stat-label">时限</span><span class="card-stat-value">${u.timeLimit}</span></div>
            </div>
            <div class="card-skills">
                ${u.skills.slice(0, 3).map(s => `<span class="card-skill">${s}</span>`).join('')}
            </div>
            <div class="card-footer">
                <div class="card-rating">${renderStars(u.rating)}</div>
                <span class="card-year">${u.year}</span>
            </div>
        `;

        card.addEventListener('click', () => openModal(u));
        cardGrid.appendChild(card);
    });
}

renderCards(ultramanData);

// ===== 筛选 =====
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        const filtered = filter === 'all'
            ? ultramanData
            : ultramanData.filter(u => u.era === filter);
        renderCards(filtered);
    });
});

// ===== 搜索 =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

function doSearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
        renderCards(ultramanData);
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
        return;
    }
    const results = ultramanData.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.nameEn.toLowerCase().includes(q) ||
        u.humanHost.toLowerCase().includes(q) ||
        u.home.toLowerCase().includes(q) ||
        u.skills.some(s => s.toLowerCase().includes(q))
    );
    renderCards(results);
}

searchInput.addEventListener('input', doSearch);
searchBtn.addEventListener('click', doSearch);

// ===== 模态框 =====
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

function openModal(u) {
    // Header
    document.getElementById('modalHeader').style.background =
        `linear-gradient(135deg, ${u.color}22, ${u.colorSecondary}22)`;
    document.querySelector('.modal-color-bar').style.background =
        `linear-gradient(90deg, ${u.color}, ${u.colorSecondary})`;

    // Avatar
    const avatar = document.getElementById('modalAvatar');
    avatar.innerHTML = `<img src="${u.image}" alt="${u.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    avatar.style.borderColor = u.color;

    // Name
    document.getElementById('modalName').textContent = u.name;
    document.getElementById('modalSubtitle').textContent = u.nameEn.toUpperCase();

    // Info grid
    const infoItems = [
        { label: '身高', value: u.height },
        { label: '体重', value: u.weight },
        { label: '故乡', value: u.home },
        { label: '人间体', value: u.humanHost },
        { label: '变身器', value: u.transformItem },
        { label: '活动时限', value: u.timeLimit },
    ];
    document.getElementById('modalInfoGrid').innerHTML = infoItems.map(i => `
        <div class="modal-info-item">
            <div class="modal-info-label">${i.label}</div>
            <div class="modal-info-value">${i.value}</div>
        </div>
    `).join('');

    // Description
    document.getElementById('modalDesc').textContent = u.description;

    // Skills
    document.getElementById('modalSkills').innerHTML = u.skills.map(s =>
        `<span class="skill-tag">${s}</span>`
    ).join('');

    // Radar chart
    drawRadar(u.stats, u.color);

    // Show
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ===== 雷达图 =====
function drawRadar(stats, color) {
    const canvas = document.getElementById('radarChart');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = 110;

    ctx.clearRect(0, 0, W, H);

    const labels = ['力量', '速度', '技巧', '防御', '能量', '智力'];
    const keys = ['power', 'speed', 'technique', 'defense', 'energy', 'intelligence'];
    const n = labels.length;

    // 背景网格
    for (let level = 1; level <= 5; level++) {
        const r = (R / 5) * level;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 轴线
    for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.stroke();
    }

    // 数据区域
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
        const val = stats[keys[idx]] / 100;
        const x = cx + R * val * Math.cos(angle);
        const y = cy + R * val * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color + '30';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点
    for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const val = stats[keys[i]] / 100;
        const x = cx + R * val * Math.cos(angle);
        const y = cy + R * val * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#0a0e17';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 标签
    ctx.font = '12px "Noto Sans SC"';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + (R + 24) * Math.cos(angle);
        const ly = cy + (R + 24) * Math.sin(angle);
        ctx.fillText(`${labels[i]} ${stats[keys[i]]}`, lx, ly);
    }
}

// ===== 时间线 =====
const timelineContainer = document.getElementById('timelineContainer');

timelineData.forEach(t => {
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const eraClass = t.era === '昭和' ? 'era-showa' : t.era === '平成' ? 'era-heisei' : t.era === '新生代' ? 'era-new-gen' : 'era-reiwa';

    item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-year">${t.year} <span class="timeline-era-tag ${eraClass}">${t.era}</span></div>
        <div class="timeline-event">${t.event}</div>
    `;
    timelineContainer.appendChild(item);
});

// 时间线滚动显示
const timelineObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.timeline-item').forEach(item => {
    timelineObserver.observe(item);
});

// ===== 平滑滚动 =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
