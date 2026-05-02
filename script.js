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

    // Mushroom walker: compute pipes and animate mushroom between them
    initMushroomWalker();
});

/**
 * Position-based mushroom walker
 * Calculates left/right turnaround points from the pipes' DOM positions
 * and animates the mushroom between them with a viewport-relative speed.
 */
function initMushroomWalker() {
    const container = document.querySelector('.hero-pipes');
    if (!container) return;
    const leftPipe = container.querySelector('.pipe-left');
    const rightPipe = container.querySelector('.pipe-right');
    const mushroom = container.querySelector('.oneup-mushroom');
    if (!leftPipe || !rightPipe || !mushroom) return;

    // Ensure CSS animation is disabled (in case cached CSS had it)
    mushroom.style.animation = 'none';

    let leftX = 0, rightX = 0, mWidth = 0;
    const GAP = 6; // small gap in px so mushroom doesn't touch pipes
    const updateBounds = () => {
        const cRect = container.getBoundingClientRect();
        const lRect = leftPipe.getBoundingClientRect();
        const rRect = rightPipe.getBoundingClientRect();
        const mRect = mushroom.getBoundingClientRect();
        mWidth = mRect.width || 64;

        // Calculate bounds so the mushroom stops before overlapping the pipes.
        // leftX: place mushroom's left edge just to the right of left pipe's right edge + GAP
        leftX = (lRect.right - cRect.left) + GAP;
        // rightX: place mushroom's left edge so its right edge is just left of right pipe's left edge - GAP
        rightX = (rRect.left - cRect.left) - mWidth - GAP;

        // Clamp in case layout is tight
        if (rightX < leftX) {
            const mid = (leftX + rightX) / 2;
            leftX = mid - 10;
            rightX = mid + 10;
        }
    };

    updateBounds();

    // Start at left bound so mushroom appears coming from left
    let x = leftX || 0;
    let direction = 1; // 1 = moving right, -1 = moving left
    let rafId = null;
    let lastTime = null;

    // Speed: make traversal relative to viewport width (so speed scales with screen size)
    // We choose to cross the full viewport width in ~16.7s to keep feel similar to previous timing
    const baseCycleSeconds = 16.7;
    // Mobile-specific speed multiplier (applied when viewport <= MOBILE_MAX_WIDTH)
    const MOBILE_MAX_WIDTH = 768; // px
    const MOBILE_SPEED_MULTIPLIER = 1.5; // 1.5x on mobile — tweakable

    function step(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000; // seconds
        lastTime = timestamp;

        const vw = window.innerWidth;
        const isMobile = vw <= MOBILE_MAX_WIDTH;
        const multiplier = isMobile ? MOBILE_SPEED_MULTIPLIER : 1;
        const speed = (vw / baseCycleSeconds) * multiplier; // px per second

        x += direction * speed * dt;

        // Reverse when hitting or exceeding bounds
        if (x >= rightX) {
            x = rightX;
            direction = -1;
        } else if (x <= leftX) {
            x = leftX;
            direction = 1;
        }

        mushroom.style.transform = `translateX(${Math.round(x)}px)`;
        rafId = requestAnimationFrame(step);
    }

    // Start animation
    rafId = requestAnimationFrame(step);

    // Recalculate bounds on resize and preserve current relative progress
    let onResize = () => {
        // compute relative progress between left and right using previous bounds
        const prevLeft = leftX, prevRight = rightX;
        const progress = (prevRight > prevLeft) ? (x - prevLeft) / (prevRight - prevLeft) : 0.5;
        updateBounds();
        // clamp and set new x based on progress
        x = leftX + (rightX - leftX) * Math.min(Math.max(progress, 0), 1);
    };

    window.addEventListener('resize', onResize);

    // Clean up if needed (not strictly necessary for this simple page)
    // Expose for debugging
    initMushroomWalker._cleanup = () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
    };
}

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
    const sound1up    = new Audio('assets/sounds/1up.mp3');
    const soundCoin   = new Audio('assets/sounds/coin.mp3');
    const soundRustle = new Audio('assets/sounds/rustle.mp3');

    // Mushroom: play 1up + jump animation + increment lives on click
    const mushroom = document.querySelector('.oneup-mushroom');
    const livesEl = document.getElementById('hud-lives');
    // Start from initial value on each page load (do not persist across refresh)
    let livesCount = 39;
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
    // Start coins from initial value on each page load (do not persist across refresh)
    let coinCount = 40;
    if (coinsEl) coinsEl.textContent = coinCount;
    if (coinBlock) {
        coinBlock.style.cursor = 'pointer';
        coinBlock.addEventListener('click', function() {
            soundCoin.currentTime = 0;
            soundCoin.play();
            if (coinCount < 99) {
                coinCount++;
                if (coinsEl) coinsEl.textContent = coinCount;
            }
            // Spawn coin graphic above the block
            const rect = coinBlock.getBoundingClientRect();
            const coinImg = document.createElement('img');
            coinImg.src = 'assets/images/coin.svg';
            coinImg.className = 'coin-popup';
            coinImg.style.left = (rect.left + rect.width / 2) + 'px';
            coinImg.style.top  = (rect.top - 40) + 'px';
            document.body.appendChild(coinImg);
            coinImg.addEventListener('animationend', () => coinImg.remove());
        });
    }
    // Pipes: piranha plant grows out on click
    document.querySelectorAll('.pipe').forEach(pipe => {
        pipe.addEventListener('click', function() {
            if (pipe.querySelector('.piranha-popup')) return; // already animating
            soundRustle.currentTime = 0;
            soundRustle.play();
            const plant = document.createElement('img');
            plant.src = 'assets/images/piranha_plant.svg';
            plant.className = 'piranha-popup';
            pipe.appendChild(plant);
            plant.addEventListener('animationend', () => plant.remove());
        });
    });
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
