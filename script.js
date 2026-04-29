/**
 * Language Switcher & Translation System
 * Provides EN/DE language switching with JSON translations and localStorage persistence
 */

let translations = {};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Immediately attach button handlers (don't wait for JSON)
    initLanguageSwitcher();
    
    // Load translations asynchronously
    loadTranslations();
});

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
        console.log('Translations loaded:', translations);
        
        const currentLang = document.documentElement.getAttribute('data-lang') || 'en';
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
    const currentLang = document.documentElement.getAttribute('data-lang') || 'en';

    // Set initial active button
    updateActiveButton(currentLang);

    // Add click handlers to language buttons
    langButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedLang = this.getAttribute('data-lang');
            console.log('Language button clicked:', selectedLang);
            switchLanguage(selectedLang);
        });
    });
}

/**
 * Switch to selected language
 */
function switchLanguage(lang) {
    console.log('Switching to language:', lang);
    
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
    console.log('Translating page to:', lang);
    console.log('Translations object available:', Object.keys(translations).length > 0);
    
    // Get all elements with data-i18n attribute
    const translatableElements = document.querySelectorAll('[data-i18n]');
    console.log('Found elements to translate:', translatableElements.length);
    
    let translatedCount = 0;
    
    translatableElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        
        // Check if translations object has the language
        if (!translations[lang]) {
            console.warn(`Language "${lang}" not found in translations`);
            return;
        }
        
        const text = translations[lang][key];
        
        if (text) {
            // For elements with only text content
            if (element.children.length === 0) {
                element.textContent = text;
            } else {
                // For elements with mixed content (text + child elements)
                // Only update first text node
                const firstTextNode = Array.from(element.childNodes).find(
                    node => node.nodeType === Node.TEXT_NODE
                );
                if (firstTextNode) {
                    firstTextNode.textContent = text;
                } else {
                    element.textContent = text;
                }
            }
            translatedCount++;
        } else {
            console.warn(`Missing translation for key: "${key}" in language: "${lang}"`);
        }
    });
    
    console.log(`Translation complete: ${translatedCount}/${translatableElements.length} elements translated`);
}
