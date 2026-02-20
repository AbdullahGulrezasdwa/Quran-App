const Sovereign = {
    // Epic 6: State Management
    state: {
        chapters: [],
        currentSurah: null,
        isPanelOpen: false,
        reciter: 'Alafasy_128kbps'
    },

    async init() {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        this.state.chapters = data.data;
        Router.go('home');
        this.initShortcuts();
        lucide.createIcons();
    },

    // Epic 5: Keyboard Shortcuts
    initShortcuts() {
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search').focus();
            }
            if (e.key === 'Escape') UI.closePanel();
            if (e.key === ' ') {
                e.preventDefault();
                AudioEngine.toggle();
            }
        });
    },

    async loadSurah(id) {
        UI.showLoading(true);
        const [ar, en] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`).then(r => r.json()),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/en.sahih`).then(r => r.json())
        ]);

        const vp = document.getElementById('app-viewport');
        vp.innerHTML = ar.data.ayahs.map((v, i) => `
            <div class="ayah-card" onclick="Sovereign.loadTafsir(${id}, ${i+1})">
                <div class="ar">${v.text}</div>
                <div class="en">${en.data.ayahs[i].text}</div>
                <div style="margin-top:20px; display:flex; gap:15px;">
                    <button class="btn-sm" onclick="event.stopPropagation(); AudioEngine.play(${id}, ${i+1})"><i data-lucide="play" style="width:14px"></i> Listen</button>
                    <button class="btn-sm" onclick="event.stopPropagation(); Hifz.toggle(${id}, ${i+1})"><i data-lucide="bookmark" style="width:14px"></i> Save</button>
                </div>
            </div>
        `).join('');
        
        UI.showLoading(false);
        lucide.createIcons();
        vp.scrollTop = 0;
    },

    // Epic 3: Exegesis Engine
    async loadTafsir(surah, ayah) {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        panel.classList.add('open');
        content.innerHTML = `<p>Loading Ibn Kathir...</p>`;

        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.asad`);
        const data = await res.json();
        
        content.innerHTML = `
            <div class="tafsir-header">Verse ${surah}:${ayah}</div>
            <div class="tafsir-body">${data.data.text}</div>
            <hr>
            <small>Source: Muhammad Asad (The Message of the Quran)</small>
        `;
    }
};

const AudioEngine = {
    player: new Audio(),
    
    play(s, a) {
        const sP = s.toString().padStart(3,'0');
        const aP = a.toString().padStart(3,'0');
        this.player.src = `https://everyayah.com/data/${Sovereign.state.reciter}/${sP}${aP}.mp3`;
        this.player.play();
        
        this.player.ontimeupdate = () => {
            const pct = (this.player.currentTime / this.player.duration) * 100;
            document.getElementById('audio-progress').style.width = pct + "%";
        };
    },

    toggle() {
        const btn = document.getElementById('play-pause');
        if(this.player.paused) {
            this.player.play();
            btn.innerHTML = '<i data-lucide="pause"></i>';
        } else {
            this.player.pause();
            btn.innerHTML = '<i data-lucide="play"></i>';
        }
        lucide.createIcons();
    }
};

const UI = {
    toggleTheme() {
        const theme = document.body.getAttribute('data-theme') === 'midnight' ? 'light' : 'midnight';
        document.body.setAttribute('data-theme', theme);
    },
    closePanel() {
        document.getElementById('side-panel').classList.remove('open');
    },
    showLoading(state) {
        document.getElementById('loading-bar').style.width = state ? '30%' : '100%';
        if(!state) setTimeout(() => document.getElementById('loading-bar').style.width = '0%', 400);
    }
};

// Router & Init logic remains similar...
window.onload = () => Sovereign.init();
