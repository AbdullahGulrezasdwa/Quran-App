const db = new Dexie("SovereignStorage");
db.version(1).stores({ hifzGoals: 'id, targetDate, dailyPortion', progress: 'ayahKey' });

const Router = {
    go(view, params = null) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(`n-${view}`)?.classList.add('active');
        
        const vp = document.getElementById('app-viewport');
        vp.innerHTML = '';

        if(view === 'home') this.renderHome(vp);
        if(view === 'hifz') this.renderHifz(vp);
        lucide.createIcons();
    },

    async renderHome(el) {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        el.innerHTML = `<h1>Quran Index</h1><div class="planner-grid">${data.data.map(s => `
            <div class="stat-box" onclick="Sovereign.loadSurah(${s.number})" style="cursor:pointer">
                <b>${s.englishName}</b><br><small>${s.name}</small>
            </div>
        `).join('')}</div>`;
    },

    async renderHifz(el) {
        const goal = await db.hifzGoals.get(1);
        el.innerHTML = `
            <div style="display:flex; justify-content:space-between">
                <h1>Hifz Planner</h1>
                <button onclick="UI.showModal('planner-modal')" class="nav-link">Set New Goal</button>
            </div>
            <div class="planner-grid">
                <div class="stat-box"><h3>${goal ? goal.dailyPortion : '--'}</h3><small>Ayahs / Day</small></div>
                <div class="stat-box"><h3>${goal ? goal.targetDate : '--'}</h3><small>Target Completion</small></div>
                <div class="stat-box"><h3>0%</h3><small>Current Progress</small></div>
            </div>
        `;
    }
};

const Hifz = {
    saveGoal() {
        const dateInput = document.getElementById('hifz-target-date').value;
        if(!dateInput) return;

        const target = new Date(dateInput);
        const today = new Date();
        const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        
        if(diffDays <= 0) return alert("Select a future date.");

        const totalAyahs = 6236;
        const perDay = Math.ceil(totalAyahs / diffDays);

        db.hifzGoals.put({ id: 1, targetDate: dateInput, dailyPortion: perDay });
        UI.closeModal('planner-modal');
        Router.go('hifz');
    }
};

const AudioEngine = {
    player: new Audio(),
    reciter: 'Alafasy_128kbps',
    current: { s: 1, a: 1 },

    setReciter(val) { this.reciter = val; },

    play(s, a) {
        this.current = { s, a };
        const sP = s.toString().padStart(3,'0');
        const aP = a.toString().padStart(3,'0');
        this.player.src = `https://everyayah.com/data/${this.reciter}/${sP}${aP}.mp3`;
        this.player.play();
        document.getElementById('hud-ayah-ref').innerText = `${s}:${a}`;
        document.getElementById('play-pause').innerHTML = '<i data-lucide="pause"></i>';
        lucide.createIcons();
    },

    toggle() {
        if(this.player.paused) this.player.play();
        else this.player.pause();
    }
};

const UI = {
    showModal(id) { document.getElementById(id).classList.add('active'); },
    closeModal(id) { document.getElementById(id).classList.remove('active'); },
    toggleTheme() {
        const theme = document.body.getAttribute('data-theme') === 'midnight' ? 'sepia' : 'midnight';
        document.body.setAttribute('data-theme', theme);
    }
};

const Sovereign = {
    async loadSurah(id) {
        const vp = document.getElementById('app-viewport');
        const [ar, en] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`).then(r => r.json()),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/en.sahih`).then(r => r.json())
        ]);

        vp.innerHTML = ar.data.ayahs.map((v, i) => `
            <div class="ayah-card">
                <div class="ar">${v.text}</div>
                <div class="en">${en.data.ayahs[i].text}</div>
                <button class="nav-link" onclick="AudioEngine.play(${id}, ${i+1})">Listen</button>
            </div>
        `).join('');
    }
};

window.onload = () => { Router.go('home'); lucide.createIcons(); };
