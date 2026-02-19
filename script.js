const surahListContainer = document.getElementById('surahList');
const readingView = document.getElementById('readingView');
const ayahContainer = document.getElementById('ayahContainer');
const surahHeader = document.getElementById('surahHeader');

let allSurahs = [];

// 1. Fetch Surah List on Load
async function init() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        allSurahs = data.data;
        displaySurahs(allSurahs);
    } catch (error) {
        surahListContainer.innerHTML = `<p>Error loading Quran data. Please try again.</p>`;
    }
}

// 2. Display the Grid
function displaySurahs(surahs) {
    surahListContainer.innerHTML = surahs.map(surah => `
        <div class="surah-card" onclick="loadSurahDetail(${surah.number})">
            <div>
                <strong>${surah.number}. ${surah.englishName}</strong>
                <p>${surah.englishNameTranslation} • ${surah.numberOfAyahs} Ayahs</p>
            </div>
            <div class="arabic-name">${surah.name}</div>
        </div>
    `).join('');
}

// 3. Search Filter
function filterSurahs() {
    const term = document.getElementById('surahSearch').value.toLowerCase();
    const filtered = allSurahs.filter(s => 
        s.englishName.toLowerCase().includes(term) || 
        s.number.toString() === term
    );
    displaySurahs(filtered);
}

// 4. Load Specific Surah
async function loadSurahDetail(number) {
    surahListContainer.classList.add('hidden');
    readingView.classList.remove('hidden');
    ayahContainer.innerHTML = '<div class="loader">Opening Surah...</div>';
    
    // Fetch Arabic and English simultaneously
    const [arRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${number}`),
        fetch(`https://api.alquran.cloud/v1/surah/${number}/en.asad`)
    ]);

    const arData = await arRes.json();
    const enData = await enRes.json();

    surahHeader.innerHTML = `
        <h2 style="text-align: center; color: var(--primary); font-size: 2rem;">${arData.data.name}</h2>
        <p style="text-align: center; margin-bottom: 30px;">${arData.data.englishName} (${arData.data.englishNameTranslation})</p>
    `;

    let html = '';
    for(let i = 0; i < arData.data.ayahs.length; i++) {
        html += `
            <div class="ayah-box">
                <span class="quran-text">
                    ${arData.data.ayahs[i].text} 
                    <span class="ayah-number">${i+1}</span>
                </span>
                <p class="translation-text">${enData.data.ayahs[i].text}</p>
            </div>
        `;
    }
    ayahContainer.innerHTML = html;
}

function closeReadingView() {
    readingView.classList.add('hidden');
    surahListContainer.classList.remove('hidden');
}

// Theme Toggle
const btn = document.getElementById("themeToggle");
btn.onclick = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", currentTheme === "dark" ? "light" : "dark");
};

init();
