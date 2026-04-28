/**
 * Language Switcher
 * Provides EN/DE language switching with localStorage persistence
 */

document.addEventListener('DOMContentLoaded', function() {
    const langButtons = document.querySelectorAll('.lang-btn');
    const currentLang = document.documentElement.getAttribute('data-lang') || 'en';

    // Set initial active button
    updateActiveButton(currentLang);

    // Add click handlers to language buttons
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const selectedLang = this.getAttribute('data-lang');
            switchLanguage(selectedLang);
        });
    });

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
        langButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Translate all elements on the page
     */
    function translatePage(lang) {
        // Get all elements with data-en or data-de attributes
        const translatableElements = document.querySelectorAll('[data-en][data-de]');
        
        translatableElements.forEach(element => {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                // For elements with only text content
                if (element.children.length === 0) {
                    element.textContent = text;
                } else {
                    // For elements with mixed content (text + child elements)
                    // We need to be careful not to replace child elements
                    element.innerHTML = text;
                }
            }
        });
    }

    // Initial translation on page load
    translatePage(currentLang);
});
