const languageToggle = document.getElementById("language-toggle");
const languageMenu = document.getElementById("language-menu");

// Global accessor for translation data loaded from JSON
let translations = {};

// Toggle the visibility of the language menu when the button is clicked
languageToggle.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent the click from propagating to the document and closing the menu immediately
    languageMenu.classList.toggle("active");
});

// Hide the language menu when clicking outside of it
document.addEventListener("click", (e) => {
    if (!languageMenu.contains(e.target) && !languageToggle.contains(e.target)) {
        languageMenu.classList.remove("active");
    }
});

function SetLanguage(language) {
    localStorage.setItem("preferredLanguage", language);
    document.documentElement.lang = language;

    // Set page translations
    document.querySelectorAll("[lang-key]").forEach(element => {
        const key = element.getAttribute("lang-key");
        if (translations[language] && translations[language][key]) {
            element.innerHTML = translations[language][key];
        }
    });

    // Update language button style
    document.querySelectorAll('#language-menu button').forEach(button => {
        if (button.getAttribute("data-lang") === language) {
            button.classList.add("active-language");
        } else {
            button.classList.remove("active-language");
        }

        languageMenu.classList.remove("active");
    });

    const event = new CustomEvent("languageChanged", { detail: { language } });
    window.dispatchEvent(event);
}

async function LoadLanguages() {
    try {
        const response = await fetch('/Data/Languages.json');
        translations = await response.json();

        let savedLanguage = localStorage.getItem("preferredLanguage");
        
        if (!savedLanguage)
        {
            const browserLanguage = navigator.language || navigator.userLanguage;
            savedLanguage = browserLanguage.startsWith('ja') ? 'ja' : 'en';

            console.log(`No saved language preference found. Defaulting to browser language: ${savedLanguage}`);
        }
        
        SetLanguage(savedLanguage);
    } catch (error) {
        console.error("Error loading languages:", error);
    }
}

LoadLanguages();