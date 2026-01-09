/* ========================================
   MEME VIBER - TEXT STATUS EDITOR
   JavaScript - Vanilla JS Implementation
   ======================================== */

// ========================================
// STATE MANAGEMENT & PERSISTENCE
// ========================================

const EditorState = {
    // DOM Elements
    textLayer: document.getElementById('textLayer'),
    board: document.getElementById('board'),
    colorBar: document.querySelector('.color-bar'),
    btnClose: document.getElementById('btnClose'),
    btnDone: document.getElementById('btnDone'),
    btnShare: document.getElementById('btnShare'),
    shareMenu: document.getElementById('shareMenu'),
    modalOverlay: document.getElementById('modalOverlay'),
    exportCanvas: document.getElementById('exportCanvas'),
    
    // State
    editorData: {
        text: '',
        fontSize: 48,
        fontFamily: 'Arial',
        textColor: '#FFFFFF',
        backgroundColor: '#1E90FF',
        textAlign: 'center',
        isDone: false
    },

    // DOM Elements - Formatting Toolbar
    fontSizeSlider: document.getElementById('fontSizeSlider'),
    fontSizeDisplay: document.getElementById('fontSizeDisplay'),
    fontFamily: document.getElementById('fontFamily'),
    textColorPicker: document.getElementById('textColorPicker'),
    alignLeft: document.getElementById('alignLeft'),
    alignCenter: document.getElementById('alignCenter'),
    alignRight: document.getElementById('alignRight'),

    // Pointer Events State
    pointerDown: false,
    pointerStartX: 0,
    pointerStartY: 0,
    pointerStartText: '',

    // Constants
    STORAGE_KEY: 'memeViber_editorState',
    WATERMARK_URL: 'https://i.ibb.co/9mwHZYYd/4b0f2dea-3f06-455b-8535-259122704ccd.jpg'
};

// ========================================
// INITIALIZATION
// ========================================

function initEditor() {
    console.log('🎨 Initializing Meme Viber Editor...');
    
    // Load saved state from localStorage
    loadEditorState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Apply initial state to DOM
    applyEditorState();
    
    // Set focus to text layer
    setTimeout(() => {
        EditorState.textLayer.focus();
    }, 100);
    
    console.log('✅ Editor initialized');
}

// ========================================
// LOCAL STORAGE PERSISTENCE
// ========================================

function saveEditorState() {
    // Update state from DOM
    EditorState.editorData.text = EditorState.textLayer.innerText || '';
    EditorState.editorData.fontSize = parseInt(EditorState.fontSizeSlider.value);
    EditorState.editorData.fontFamily = EditorState.fontFamily.value;
    EditorState.editorData.textColor = EditorState.textColorPicker.value;
    EditorState.editorData.backgroundColor = window.getComputedStyle(EditorState.board).backgroundColor;
    
    // Save to localStorage
    localStorage.setItem(EditorState.STORAGE_KEY, JSON.stringify(EditorState.editorData));
    console.log('💾 State saved to localStorage', EditorState.editorData);
}

function loadEditorState() {
    const saved = localStorage.getItem(EditorState.STORAGE_KEY);
    if (saved) {
        try {
            EditorState.editorData = JSON.parse(saved);
            console.log('📂 State loaded from localStorage', EditorState.editorData);
        } catch (e) {
            console.warn('⚠️ Could not parse saved state:', e);
        }
    }
}

function applyEditorState() {
    const { editorData } = EditorState;
    
    // Apply text
    EditorState.textLayer.innerText = editorData.text;
    
    // Apply font size
    EditorState.fontSizeSlider.value = editorData.fontSize;
    EditorState.textLayer.style.fontSize = editorData.fontSize + 'px';
    EditorState.fontSizeDisplay.textContent = editorData.fontSize + 'px';
    
    // Apply font family
    EditorState.fontFamily.value = editorData.fontFamily;
    EditorState.textLayer.style.fontFamily = editorData.fontFamily;
    
    // Apply text color
    EditorState.textColorPicker.value = editorData.textColor;
    EditorState.textLayer.style.color = editorData.textColor;
    
    // Apply background color
    const bgColor = editorData.backgroundColor;
    if (bgColor && bgColor !== 'transparent') {
        EditorState.board.style.background = bgColor;
        
        // Update color button active state
        updateColorButtonStates(bgColor);
    }
    
    // Apply text alignment
    EditorState.textLayer.style.textAlign = editorData.textAlign;
    updateAlignmentButtons();
}

function clearEditorState() {
    EditorState.textLayer.innerText = '';
    EditorState.editorData.text = '';
    saveEditorState();
    updateShareButtonState();
}

// ========================================
// TEXT EDITING - CONTENTEDITABLE HANDLERS
// ========================================

function setupTextEditingHandlers() {
    const textLayer = EditorState.textLayer;

    // Save state on input
    textLayer.addEventListener('input', (e) => {
        EditorState.editorData.text = textLayer.innerText || '';
        saveEditorState();
        updateShareButtonState();
        
        // Prevent line breaks from adding extra nodes
        if (textLayer.innerHTML.includes('<div>') || textLayer.innerHTML.includes('<p>')) {
            cleanTextContent();
        }
    });

    // Handle paste events - plain text only
    textLayer.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });

    // Handle keyboard shortcuts
    textLayer.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + A to select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(textLayer);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Ctrl/Cmd + S to save (prevent default)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveEditorState();
        }

        // Prevent Enter key from creating new lines in some browsers
        if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertText', false, '\n');
        }
    });

    // Focus management
    textLayer.addEventListener('focus', () => {
        console.log('📝 Text layer focused');
        detectKeyboardVisibility();
    });

    textLayer.addEventListener('blur', () => {
        console.log('📝 Text layer blurred');
        saveEditorState();
    });
}

function cleanTextContent() {
    const textLayer = EditorState.textLayer;
    const text = textLayer.innerText;
    textLayer.innerText = '';
    textLayer.innerText = text;
}

// ========================================
// COLOR SELECTION - BOARD BACKGROUND
// ========================================

function setupColorButtons() {
    const colorButtons = document.querySelectorAll('.color-btn');
    
    colorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const color = btn.dataset.color;
            EditorState.board.style.background = color;
            EditorState.editorData.backgroundColor = color;
            
            updateColorButtonStates(color);
            saveEditorState();
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.click();
        }, { passive: false });
    });
}

function updateColorButtonStates(color) {
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ========================================
// FONT SIZE CONTROL
// ========================================

function setupFontSizeControl() {
    EditorState.fontSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        EditorState.textLayer.style.fontSize = size + 'px';
        EditorState.fontSizeDisplay.textContent = size + 'px';
        EditorState.editorData.fontSize = parseInt(size);
        saveEditorState();
    });
}

// ========================================
// FONT FAMILY CONTROL
// ========================================

function setupFontFamilyControl() {
    EditorState.fontFamily.addEventListener('change', (e) => {
        const font = e.target.value;
        EditorState.textLayer.style.fontFamily = font;
        EditorState.editorData.fontFamily = font;
        saveEditorState();
    });
}

// ========================================
// TEXT COLOR CONTROL
// ========================================

function setupTextColorControl() {
    EditorState.textColorPicker.addEventListener('change', (e) => {
        const color = e.target.value;
        EditorState.textLayer.style.color = color;
        EditorState.editorData.textColor = color;
        saveEditorState();
    });
}

// ========================================
// TEXT ALIGNMENT CONTROL
// ========================================

function setupAlignmentButtons() {
    EditorState.alignLeft.addEventListener('click', () => {
        setTextAlignment('left');
    });

    EditorState.alignCenter.addEventListener('click', () => {
        setTextAlignment('center');
    });

    EditorState.alignRight.addEventListener('click', () => {
        setTextAlignment('right');
    });
}

function setTextAlignment(align) {
    EditorState.textLayer.style.textAlign = align;
    EditorState.editorData.textAlign = align;
    updateAlignmentButtons();
    saveEditorState();
}

function updateAlignmentButtons() {
    const align = EditorState.editorData.textAlign;
    EditorState.alignLeft.classList.remove('active');
    EditorState.alignCenter.classList.remove('active');
    EditorState.alignRight.classList.remove('active');
    
    if (align === 'left') EditorState.alignLeft.classList.add('active');
    else if (align === 'center') EditorState.alignCenter.classList.add('active');
    else if (align === 'right') EditorState.alignRight.classList.add('active');
}

// ========================================
// DONE BUTTON - Export & Save
// ========================================

function setupDoneButton() {
    EditorState.btnDone.addEventListener('click', () => {
        saveEditorState();
        EditorState.editorData.isDone = true;
        
        // Optionally show share menu
        // openShareMenu();
        
        console.log('✅ Done editing. State saved.');
        // Could redirect or show confirmation
    });

    EditorState.btnDone.addEventListener('touchend', (e) => {
        e.preventDefault();
        EditorState.btnDone.click();
    }, { passive: false });
}

// ========================================
// SHARE BUTTON & MENU
// ========================================

function setupShareButton() {
    EditorState.btnShare.addEventListener('click', openShareMenu);
    EditorState.btnShare.addEventListener('touchend', (e) => {
        e.preventDefault();
        openShareMenu();
    }, { passive: false });
}

function updateShareButtonState() {
    const hasText = EditorState.textLayer.innerText.trim().length > 0;
    EditorState.btnShare.disabled = !hasText;
}

function openShareMenu() {
    EditorState.shareMenu.classList.add('active');
    EditorState.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
}

function closeShareMenu() {
    EditorState.shareMenu.classList.remove('active');
    EditorState.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.height = '';
}

// ========================================
// SHARE OPTIONS
// ========================================

function setupShareOptions() {
    const downloadBtn = document.getElementById('shareDownload');
    const whatsappBtn = document.getElementById('shareWhatsApp');
    const facebookBtn = document.getElementById('shareFacebook');
    const twitterBtn = document.getElementById('shareTwitter');
    const closeBtn = document.getElementById('closeShareMenu');

    downloadBtn.addEventListener('click', () => {
        exportAndDownload();
        closeShareMenu();
    });

    whatsappBtn.addEventListener('click', () => {
        exportAndShare('whatsapp');
        closeShareMenu();
    });

    facebookBtn.addEventListener('click', () => {
        exportAndShare('facebook');
        closeShareMenu();
    });

    twitterBtn.addEventListener('click', () => {
        exportAndShare('twitter');
        closeShareMenu();
    });

    closeBtn.addEventListener('click', closeShareMenu);

    // Close on overlay click
    EditorState.modalOverlay.addEventListener('click', closeShareMenu);
}

// ========================================
// EXPORT TO CANVAS WITH WATERMARK
// ========================================

function exportToCanvas() {
    const canvas = EditorState.exportCanvas;
    const board = EditorState.board;
    
    // Set canvas size
    const boardRect = board.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = boardRect.width * dpr;
    canvas.height = boardRect.height * dpr;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.scale(dpr, dpr);
    
    // Draw background
    const bgColor = EditorState.editorData.backgroundColor;
    if (bgColor && bgColor.includes('gradient')) {
        // Parse and draw gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width / dpr, canvas.height / dpr);
        // Simplified: just use solid color as fallback
        ctx.fillStyle = '#1E90FF';
    } else {
        ctx.fillStyle = bgColor || '#1E90FF';
    }
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Draw text
    const fontSize = EditorState.editorData.fontSize;
    const fontFamily = EditorState.editorData.fontFamily;
    const textColor = EditorState.editorData.textColor;
    const textAlign = EditorState.editorData.textAlign;
    const text = EditorState.editorData.text;
    
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = textAlign;
    
    // Calculate text position
    const x = textAlign === 'left' ? 20 : 
              textAlign === 'right' ? canvas.width / dpr - 20 : 
              canvas.width / dpr / 2;
    
    const y = canvas.height / dpr / 2;
    
    // Draw text with line breaks
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2;
    
    lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + (index * lineHeight));
    });
    
    // Add watermark
    addWatermark(ctx, canvas.width / dpr, canvas.height / dpr);
    
    return canvas;
}

function addWatermark(ctx, width, height) {
    // Simple text watermark at bottom-left
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('MEME VIBER', 10, height - 10);
}

function exportAndDownload() {
    const canvas = exportToCanvas();
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meme-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('📥 Download initiated');
    }, 'image/png');
}

function exportAndShare(platform) {
    const canvas = exportToCanvas();
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const text = `Check out my meme on Meme Viber! 🎨`;
        
        if (platform === 'whatsapp') {
            // WhatsApp share
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)} ${encodeURIComponent(url)}`;
            window.open(whatsappUrl, '_blank');
        } else if (platform === 'facebook') {
            // Facebook share
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            window.open(fbUrl, '_blank');
        } else if (platform === 'twitter') {
            // Twitter share
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            window.open(twitterUrl, '_blank');
        }
        
        console.log(`📤 Sharing to ${platform}`);
    }, 'image/png');
}

// ========================================
// CLOSE EDITOR
// ========================================

function setupCloseButton() {
    EditorState.btnClose.addEventListener('click', () => {
        if (confirm('Close editor? Your work will be saved.')) {
            saveEditorState();
            window.location.href = '/';
        }
    });

    EditorState.btnClose.addEventListener('touchend', (e) => {
        e.preventDefault();
        EditorState.btnClose.click();
    }, { passive: false });
}

// ========================================
// MOBILE KEYBOARD DETECTION
// ========================================

function detectKeyboardVisibility() {
    const initialHeight = window.innerHeight;
    
    const resizeHandler = () => {
        const currentHeight = window.innerHeight;
        
        if (currentHeight < initialHeight * 0.75) {
            // Keyboard is likely visible
            document.body.classList.add('keyboard-visible');
            
            // Scroll text layer into view
            EditorState.textLayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Keyboard is likely hidden
            document.body.classList.remove('keyboard-visible');
        }
    };
    
    window.addEventListener('resize', resizeHandler, { once: true });
}

// ========================================
// AUTO-SAVE ON WINDOW UNLOAD
// ========================================

function setupAutoSave() {
    window.addEventListener('beforeunload', () => {
        saveEditorState();
    });

    // Save every 10 seconds
    setInterval(saveEditorState, 10000);
}

// ========================================
// POINTER EVENTS (Unified Mouse + Touch)
// ========================================

function setupPointerEvents() {
    const board = EditorState.board;
    const textLayer = EditorState.textLayer;

    board.addEventListener('pointerdown', (e) => {
        if (e.target === textLayer) {
            EditorState.pointerDown = true;
            EditorState.pointerStartX = e.clientX;
            EditorState.pointerStartY = e.clientY;
            console.log('👆 Pointer down on text');
        }
    });

    board.addEventListener('pointermove', (e) => {
        if (EditorState.pointerDown && e.target === textLayer) {
            // Could implement drag/resize here
            // For now, just allow text selection
        }
    });

    board.addEventListener('pointerup', (e) => {
        EditorState.pointerDown = false;
    });

    board.addEventListener('pointercancel', (e) => {
        EditorState.pointerDown = false;
    });
}

// ========================================
// MASTER EVENT LISTENER SETUP
// ========================================

function setupEventListeners() {
    setupTextEditingHandlers();
    setupColorButtons();
    setupFontSizeControl();
    setupFontFamilyControl();
    setupTextColorControl();
    setupAlignmentButtons();
    setupDoneButton();
    setupShareButton();
    setupShareOptions();
    setupCloseButton();
    setupAutoSave();
    setupPointerEvents();
    
    // Global touch prevention for zoom
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
}

// ========================================
// INITIALIZATION ON PAGE LOAD
// ========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}

console.log('🎨 Meme Viber Text Status Editor v1.0');
