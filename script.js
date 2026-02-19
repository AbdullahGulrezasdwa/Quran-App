const API_BASE = "https://api.alquran.cloud/v1";
let currentSurah = null;
let currentAyahIndex = 0;
let audioPlayer = document.getElementById('mainAudio');

// 1. Initial Load
window.onload = () => {
    loadSurahList();
    checkLastRead();
};

async function loadSurahList() {
    const res = await fetch(`${API_BASE}/surah`);
    const data = await res.json();
    renderSurahGrid(data.data);
}

function renderSurahGrid(surahs) {
    const grid = document.getElementById('surahGrid');
    grid.innerHTML = surahs.map(s => `
        <div class="surah-card" onclick="openSurah(${s.number})">
            <div class="s-info">
                <span class="s-num">#${s.number}</span>
                <h3>${s.englishName}</h3>
                <p>${s.englishNameTranslation} • ${s.numberOfAyahs} Ayahs</p>
            </div>
            <div class="s-arabic" style="font-family: 'Amiri'; font-size: 1.8rem; color: var(--primary)">
                ${s.name}
            </div>
        </div>
    `).join('');
}

// 2. Open Surah with Dual Edition (Arabic + English + Audio)
async function openSurah(id) {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('readerView').classList.remove('hidden');
    document.getElementById('ayahList').innerHTML = `<div class="loader">Loading...</div>`;

    const reciter = document.getElementById('reciterId').value;
    
    // We fetch 3 things at once: Arabic, English Translation, and Audio links
    const [ar, en, aud] = await Promise.all([
        fetch(`${API_BASE}/surah/${id}/quran-uthmani`).then(r => r.json()),
        fetch(`${API_BASE}/surah/${id}/en.asad`).then(r => r.json()),
        fetch(`${API_BASE}/surah/${id}/${reciter}`).then(r => r.json())
    ]);

    currentSurah = {
        arabic: ar.data,
        english: en.data,
        audio: aud.data
    };

    renderReader();
    saveLastRead(id, ar.data.englishName);
}

function renderReader() {
    const list = document.getElementById('ayahList');
    document.getElementById('surahMeta').innerHTML = `<h2>${currentSurah.arabic.englishName}</h2>`;
    
    list.innerHTML = currentSurah.arabic.ayahs.map((ayah, i) => `
        <div class="ayah-card" id="ayah-${i}" onclick="playAyah(${i})">
            <span class="quran-arabic">${ayah.text} <span class="a-num">${i+1}</span></span>
            <p class="translation-text">${currentSurah.english.ayahs[i].text}</p>
        </div>
    `).join('');
}

// 3. Audio Logic
function playAyah(index) {
    currentAyahIndex = index;
    const audioUrl = currentSurah.audio.ayahs[index].audio;
    
    // UI Update
    document.querySelectorAll('.ayah-card').forEach(el => el.classList.remove('active'));
    document.getElementById(`ayah-${index}`).classList.add('active');
    document.getElementById(`ayah-${index}`).scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Audio Update
    audioPlayer.src = audioUrl;
    audioPlayer.play();
    document.getElementById('audioPlayer').classList.remove('hidden');
    document.getElementById('playingSurah').innerText = currentSurah.arabic.englishName;
    document.getElementById('playingAyah').innerText = `Ayah ${index + 1}`;
    document.getElementById('playIcon').setAttribute('data-lucide', 'pause');
    lucide.createIcons();
}

audioPlayer.onended = () => {
    if (currentAyahIndex < currentSurah.arabic.ayahs.length - 1) {
        playAyah(currentAyahIndex + 1);
    }
};

// 4. Utilities
function saveLastRead(id, name) {
    localStorage.setItem('lastRead', JSON.stringify({id, name}));
}

function checkLastRead() {
    const last = JSON.parse(localStorage.getItem('lastRead'));
    if(last) {
        document.getElementById('lastReadCard').classList.remove('hidden');
        document.getElementById('lastReadName').innerText = last.name;
    }
}

function showHome() {
    document.getElementById('homeView').classList.remove('hidden');
    document.getElementById('readerView').classList.add('hidden');
}

function toggleAudio() {
    if(audioPlayer.paused) audioPlayer.play();
    else audioPlayer.pause();
}
