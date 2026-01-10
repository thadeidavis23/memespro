// Meme Viber - Landing Page & Modal Scripts
// This file contains only the necessary scripts for the landing page and modals

// Menu Functions
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('open');
    document.getElementById('menuOverlay').classList.toggle('open');
}

function closeMenu() {
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.remove('open');
}

function showSection(section) {
    closeMenu();
    if (section === 'about') {
        openAboutModal();
    } else if (section === 'founders') {
        openFoundersModal();
    } else if (section === 'settings') {
        openSettingsModal();
    }
}

// About Modal Functions
function openAboutModal() {
    document.getElementById('aboutModal').classList.add('show');
}

function closeAboutModal() {
    document.getElementById('aboutModal').classList.remove('show');
}

// Founders Modal Functions
function openFoundersModal() {
    document.getElementById('foundersModal').classList.add('show');
}

function closeFoundersModal() {
    document.getElementById('foundersModal').classList.remove('show');
}

// Image Zoom Modal Functions
let currentZoomLevel = 1;

function openImageModal(imageSrc) {
    const modal = document.getElementById('imageZoomModal');
    const zoomableImg = document.getElementById('zoomableImage');
    zoomableImg.src = imageSrc;
    currentZoomLevel = 1;
    updateZoomLevel();
    modal.classList.add('show');
}

function closeImageModal() {
    document.getElementById('imageZoomModal').classList.remove('show');
    currentZoomLevel = 1;
}

function zoomImage(delta) {
    currentZoomLevel += delta;
    if (currentZoomLevel < 0.5) currentZoomLevel = 0.5;
    if (currentZoomLevel > 3) currentZoomLevel = 3;
    updateZoomLevel();
}

function updateZoomLevel() {
    const img = document.getElementById('zoomableImage');
    img.style.transform = `scale(${currentZoomLevel})`;
    document.querySelector('.zoom-level').textContent = Math.round(currentZoomLevel * 100) + '%';
}

// WhatsApp Functions
function openWhatsApp(phoneNumber) {
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
}

// Settings Modal Functions
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('themeToggleBtn');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        themeBtn.textContent = '🌙 Switch to Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        themeBtn.textContent = '☀️ Switch to Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

// Load theme preference on page load
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const themeBtn = document.getElementById('themeToggleBtn');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeBtn.textContent = '☀️ Switch to Light Mode';
    }
}

// Load theme on page load
window.addEventListener('DOMContentLoaded', loadThemePreference);

