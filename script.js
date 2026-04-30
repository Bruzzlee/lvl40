/**
 * Language Switcher & Translation System
 * Provides EN/DE language switching with JSON translations and localStorage persistence
 */

let translations = {};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    // Immediately attach button handlers (don't wait for JSON)
    initLanguageSwitcher();
    
    // Load translations and apply immediately
    await loadTranslations();

    // Mario HUD countdown timer
    initMarioHUD();

    // Sound interactions
    initSoundEffects();
});

/**
 * Mario HUD: countdown to party date + coin star counter
 */
function initMarioHUD() {
    const timerEl = document.getElementById('hud-timer');
    if (!timerEl) return;

    // Days until party
    const partyDate = new Date('2026-08-15T00:00:00');
    function updateTimer() {
        const now = new Date();
        const diff = Math.max(0, Math.ceil((partyDate - now) / 86400000));
        timerEl.textContent = diff > 999 ? '999' : String(diff).padStart(3, '0');
    }
    updateTimer();
    setInterval(updateTimer, 60000);

    // Coin count is fixed at 40 (birthday level)
}

function initSoundEffects() {
    const sound1up  = new Audio('assets/sounds/1up.mp3');
    const soundCoin = new Audio('assets/sounds/coin.mp3');

    // Mushroom: play 1up + jump animation + increment lives on click
    const mushroom = document.querySelector('.oneup-mushroom');
    const livesEl = document.getElementById('hud-lives');
    let livesCount = parseInt(localStorage.getItem('marioLives') || '39', 10);
    if (livesEl) livesEl.textContent = livesCount;
    if (mushroom) {
        mushroom.addEventListener('click', function() {
            sound1up.currentTime = 0;
            sound1up.play();
            mushroom.classList.remove('mushroom-jump');
            void mushroom.offsetWidth;
            mushroom.classList.add('mushroom-jump');
            if (livesCount < 99) {
                livesCount++;
                localStorage.setItem('marioLives', livesCount);
                if (livesEl) livesEl.textContent = livesCount;
            }
        });
        mushroom.querySelector('img').addEventListener('animationend', function(e) {
            if (e.animationName === 'mushroom-jump') {
                mushroom.classList.remove('mushroom-jump');
            }
        });
    }

    // Coin block: play coin sound + increment counter on click
    const coinBlock = document.querySelector('.coin-block');
    const coinsEl = document.getElementById('hud-coins');
    let coinCount = parseInt(localStorage.getItem('marioCoins') || '40', 10);
    if (coinsEl) coinsEl.textContent = coinCount;
    if (coinBlock) {
        coinBlock.style.cursor = 'pointer';
        coinBlock.addEventListener('click', function() {
            soundCoin.currentTime = 0;
            soundCoin.play();
            if (coinCount < 99) {
                coinCount++;
                localStorage.setItem('marioCoins', coinCount);
                if (coinsEl) coinsEl.textContent = coinCount;
            }
        });
    }
}

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
        
        const currentLang = document.documentElement.getAttribute('data-lang') || 'de';
        translatePage(currentLang);
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
}

/**
 * Initialize language buttons with click handlers
 */
function initLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    const currentLang = document.documentElement.getAttribute('data-lang') || 'de';

    // Set initial active button
    updateActiveButton(currentLang);

    // Add click handlers to language buttons
    langButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedLang = this.getAttribute('data-lang');
            switchLanguage(selectedLang);
        });
    });
}

/**
 * Switch to selected language
 */
function switchLanguage(lang) {
    // Save to localStorage
    localStorage.setItem('partyLang', lang);
    
    // Update document language
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    
    // Update active button
    updateActiveButton(lang);
    
    // Apply translations
    translatePage(lang);
}

/**
 * Update which language button is active
 */
function updateActiveButton(lang) {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
}

/**
 * Translate all elements on the page using data-i18n keys
 */
function translatePage(lang) {
    // Update <title> element via page_title key
    if (translations['page_title'] && translations['page_title'][lang]) {
        document.title = translations['page_title'][lang];
    }

    // Get all elements with data-i18n attribute
    const translatableElements = document.querySelectorAll('[data-i18n]');
    
    translatableElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        
        // Check if key exists in translations
        if (!translations[key]) {
            return;
        }
        
        const text = translations[key][lang];
        
        if (text) {
            // For elements with only text content
            if (element.children.length === 0) {
                element.textContent = text;
            } else {
                // For elements with mixed content (text + child elements)
                // Find the last text node (after any SVG/child elements)
                const textNodes = Array.from(element.childNodes).filter(
                    node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
                );
                if (textNodes.length > 0) {
                    textNodes[textNodes.length - 1].textContent = text;
                }
            }
        }
    });
}
