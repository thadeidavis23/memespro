const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const mobileKeyboardInput = document.getElementById('mobileKeyboardInput');
const fontSize = document.getElementById('fontSize');
const fontFamily = document.getElementById('fontFamily');
const fontColor = document.getElementById('fontColor');
const textInputOverlay = document.getElementById('textInputOverlay');
const stickerPicker = document.getElementById('stickerPicker');
const colorSwatches = document.querySelectorAll('.color-swatch');

let elements = [];
let selectedElement = null;
let isDrawing = false;
let offsetX = 0;
let offsetY = 0;
let currentBgColor = '#1E90FF';
let activeTextElement = null;
let isInTextInputMode = false;

const watermarkUrl = 'https://ibb.co/jZrYW1jy';
const watermarkBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let watermarkImg = null;

function initWatermark() {
    watermarkImg = new Image();
    watermarkImg.crossOrigin = 'anonymous';
    watermarkImg.src = 'https://i.ibb.co/9mwHZYYd/4b0f2dea-3f06-455b-8535-259122704ccd.jpg';
    watermarkImg.onload = () => {
        drawCanvas();
    };
}

initWatermark();

// ===== TEXT INPUT MODE =====

// Start text input at canvas location
function startTextInputMode(x, y) {
    isInTextInputMode = true;
    activeTextElement = {
        id: Date.now(),
        type: 'text',
        text: '',
        x: x,
        y: y,
        fontSize: 48,
        fontFamily: 'Comic Neue',
        fontColor: '#ffffff',
        width: 0,
        height: 0
    };
    
    elements.push(activeTextElement);
    selectedElement = activeTextElement;
    drawCanvas();
    
    // Clear mobile keyboard input
    mobileKeyboardInput.value = '';
    
    // Prevent viewport shift and focus keyboard
    setTimeout(() => {
        // Add visual feedback class
        const editorPage = document.getElementById('editorPage');
        editorPage.classList.add('text-input-active');
        
        // Focus keyboard input which will trigger mobile keyboard
        mobileKeyboardInput.focus();
    }, 100);
}

// End text input mode
function endTextInputMode() {
    if (activeTextElement && activeTextElement.text.trim() === '') {
        elements = elements.filter(el => el.id !== activeTextElement.id);
    }
    isInTextInputMode = false;
    activeTextElement = null;
    mobileKeyboardInput.value = '';
    mobileKeyboardInput.blur();
    
    // Remove visual feedback class
    const editorPage = document.getElementById('editorPage');
    editorPage.classList.remove('text-input-active');
    
    drawCanvas();
}

// Handle keyboard input for text
document.addEventListener('keydown', (e) => {
    if (!isInTextInputMode || !activeTextElement) return;
    
    if (e.key === 'Enter') {
        endTextInputMode();
    } else if (e.key === 'Backspace') {
        activeTextElement.text = activeTextElement.text.slice(0, -1);
        drawCanvas();
    } else if (e.key.length === 1) {
        activeTextElement.text += e.key;
        drawCanvas();
    }
});

// Handle mobile keyboard input
mobileKeyboardInput.addEventListener('input', (e) => {
    if (!isInTextInputMode || !activeTextElement) return;
    activeTextElement.text = mobileKeyboardInput.value;
    drawCanvas();
});

mobileKeyboardInput.addEventListener('keydown', (e) => {
    if (!isInTextInputMode || !activeTextElement) return;
    if (e.key === 'Enter') {
        endTextInputMode();
        mobileKeyboardInput.blur();
    }
});

// ===== TEXT CUSTOMIZATION FUNCTIONS =====

// Update live text preview
function updateLiveText() {
    if (!selectedElement || selectedElement.type !== 'text') {
        return;
    }
    
    selectedElement.fontSize = parseInt(fontSize.value);
    selectedElement.fontFamily = fontFamily.value;
    selectedElement.fontColor = fontColor.value;
    
    drawCanvas();
}

// Open text settings for selected element
function openTextSettings() {
    if (!selectedElement || selectedElement.type !== 'text') {
        alert('Please select a text element first by clicking on it');
        return;
    }
    
    endTextInputMode();
    
    textInput.value = selectedElement.text;
    fontSize.value = selectedElement.fontSize;
    fontFamily.value = selectedElement.fontFamily;
    fontColor.value = selectedElement.fontColor;
    document.getElementById('fontSizeDisplay').textContent = selectedElement.fontSize;
    
    textInputOverlay.classList.add('show');
    setTimeout(() => textInput.focus(), 100);
}

// Close text settings popup
function closeTextSettings() {
    textInputOverlay.classList.remove('show');
}

// Update text properties
function updateTextProperties() {
    if (!selectedElement || selectedElement.type !== 'text') {
        return;
    }
    
    selectedElement.text = textInput.value;
    selectedElement.fontSize = parseInt(fontSize.value);
    selectedElement.fontFamily = fontFamily.value;
    selectedElement.fontColor = fontColor.value;
    
    closeTextSettings();
    drawCanvas();
}

// Change canvas background color
function changeBgColor(color) {
    currentBgColor = color;
    
    // Mark active swatch
    colorSwatches.forEach(swatch => {
        swatch.classList.remove('active');
    });
    event.target.classList.add('active');
    
    drawCanvas();
}

// Add sticker to canvas
function addSticker(emoji) {
    const element = {
        id: Date.now(),
        type: 'sticker',
        text: emoji,
        x: canvas.width / 2,
        y: canvas.height / 2,
        fontSize: 88,
        width: 88,
        height: 88
    };

    elements.push(element);
    drawCanvas();
}

// Close sticker picker
function closeStickerPicker() {
    stickerPicker.classList.remove('show');
}

// ===== CANVAS DRAWING FUNCTIONS =====

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply background color
    if (currentBgColor.includes('linear-gradient')) {
        // For gradients, we need to use createLinearGradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const gradientStr = currentBgColor.match(/#[0-9a-f]{6}/gi);
        if (gradientStr && gradientStr.length >= 2) {
            gradient.addColorStop(0, gradientStr[0]);
            gradient.addColorStop(1, gradientStr[1]);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = currentBgColor;
        }
    } else {
        ctx.fillStyle = currentBgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
        if (element.type === 'text') {
            drawTextElement(element);
        } else if (element.type === 'sticker') {
            drawStickerElement(element);
        }
    });

    // Draw watermark
    if (watermarkImg && watermarkImg.complete) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(watermarkImg, canvas.width - 60, canvas.height - 50, 50, 40);
        ctx.globalAlpha = 1;
    }

    if (selectedElement) {
        drawSelectionBox(selectedElement);
    }
}

function drawTextElement(element) {
    ctx.font = `bold ${element.fontSize}px ${element.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(element.text);
    const textWidth = metrics.width;
    const textHeight = element.fontSize;

    element.width = textWidth + 20;
    element.height = textHeight + 20;

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(
        element.x - element.width / 2,
        element.y - element.height / 2,
        element.width,
        element.height
    );

    // Draw text with shadow for bold appearance
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 6;
    ctx.fillStyle = element.fontColor;
    ctx.fillText(element.text, element.x, element.y);
    ctx.shadowColor = 'transparent';
}

function drawStickerElement(element) {
    ctx.font = `bold ${element.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#000';
    ctx.fillText(element.text, element.x, element.y);

    element.width = element.fontSize * 0.8;
    element.height = element.fontSize;
}

function drawSelectionBox(element) {
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
        element.x - element.width / 2 - 5,
        element.y - element.height / 2 - 5,
        element.width + 10,
        element.height + 10
    );
    ctx.setLineDash([]);

    // Draw resize handle
    const handleSize = 8;
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(element.x + element.width / 2 - handleSize / 2, element.y + element.height / 2 - handleSize / 2, handleSize, handleSize);
}

// ===== CANVAS INTERACTION =====

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // End text input mode if active
    if (isInTextInputMode) {
        endTextInputMode();
    }

    // Check if clicking on existing element
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (x >= element.x - element.width / 2 &&
            x <= element.x + element.width / 2 &&
            y >= element.y - element.height / 2 &&
            y <= element.y + element.height / 2) {
            selectedElement = element;
            if (element.type === 'text') {
                // Start text editing mode
                startTextInputMode(element.x, element.y);
                activeTextElement = element;
                isInTextInputMode = true;
            }
            drawCanvas();
            return;
        }
    }

    // If empty space clicked, start new text input
    selectedElement = null;
    startTextInputMode(x, y);
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (x >= element.x - element.width / 2 &&
            x <= element.x + element.width / 2 &&
            y >= element.y - element.height / 2 &&
            y <= element.y + element.height / 2) {
            selectedElement = element;
            offsetX = x - element.x;
            offsetY = y - element.y;
            isDrawing = true;
            drawCanvas();
            return;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !selectedElement) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    selectedElement.x = x - offsetX;
    selectedElement.y = y - offsetY;

    selectedElement.x = Math.max(selectedElement.width / 2, Math.min(canvas.width - selectedElement.width / 2, selectedElement.x));
    selectedElement.y = Math.max(selectedElement.height / 2, Math.min(canvas.height - selectedElement.height / 2, selectedElement.y));

    drawCanvas();
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

canvas.addEventListener('touchstart', (e) => {
    // Don't prevent default here - let it bubble up for button taps
    touchStartTime = Date.now();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (x >= element.x - element.width / 2 &&
            x <= element.x + element.width / 2 &&
            y >= element.y - element.height / 2 &&
            y <= element.y + element.height / 2) {
            selectedElement = element;
            offsetX = x - element.x;
            offsetY = y - element.y;
            isDrawing = true;
            drawCanvas();
            window.pendingTouchX = undefined;
            window.pendingTouchY = undefined;
            return;
        }
    }
    
    // If empty space tapped, prepare to start text input
    window.pendingTouchX = x;
    window.pendingTouchY = y;
});

canvas.addEventListener('touchmove', (e) => {
    // Only prevent default when actively dragging an element
    if (isDrawing && selectedElement) {
        e.preventDefault();
    }

    if (!isDrawing || !selectedElement) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    selectedElement.x = x - offsetX;
    selectedElement.y = y - offsetY;

    selectedElement.x = Math.max(selectedElement.width / 2, Math.min(canvas.width - selectedElement.width / 2, selectedElement.x));
    selectedElement.y = Math.max(selectedElement.height / 2, Math.min(canvas.height - selectedElement.height / 2, selectedElement.y));

    drawCanvas();
});

canvas.addEventListener('touchend', () => {
    if (isDrawing) {
        isDrawing = false;
        return;
    }
    
    // If this was a tap (short touch) on empty space, start text input
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration < 300 && window.pendingTouchX !== undefined && window.pendingTouchY !== undefined && !selectedElement) {
        // Check once more if tapped on empty space
        let tappedOnElement = false;
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            if (window.pendingTouchX >= element.x - element.width / 2 &&
                window.pendingTouchX <= element.x + element.width / 2 &&
                window.pendingTouchY >= element.y - element.height / 2 &&
                window.pendingTouchY <= element.y + element.height / 2) {
                tappedOnElement = true;
                selectedElement = element;
                break;
            }
        }
        
        if (!tappedOnElement) {
            // Tapped on empty space - start new text
            startTextInputMode(window.pendingTouchX, window.pendingTouchY);
        } else if (selectedElement && selectedElement.type === 'text') {
            // Tapped on existing text - edit it
            activeTextElement = selectedElement;
            isInTextInputMode = true;
            mobileKeyboardInput.value = selectedElement.text;
            mobileKeyboardInput.focus();
            drawCanvas();
        }
        
        window.pendingTouchX = undefined;
        window.pendingTouchY = undefined;
    }
});

// ===== DOWNLOAD & SHARE =====

function downloadMeme() {
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;
    const downloadCtx = downloadCanvas.getContext('2d');

    // Draw background
    if (currentBgColor.includes('linear-gradient')) {
        const gradient = downloadCtx.createLinearGradient(0, 0, downloadCanvas.width, downloadCanvas.height);
        const gradientStr = currentBgColor.match(/#[0-9a-f]{6}/gi);
        if (gradientStr && gradientStr.length >= 2) {
            gradient.addColorStop(0, gradientStr[0]);
            gradient.addColorStop(1, gradientStr[1]);
            downloadCtx.fillStyle = gradient;
        } else {
            downloadCtx.fillStyle = currentBgColor;
        }
    } else {
        downloadCtx.fillStyle = currentBgColor;
    }
    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw elements
    elements.forEach(element => {
        if (element.type === 'text') {
            downloadCtx.font = `${element.fontSize}px ${element.fontFamily}`;
            downloadCtx.textAlign = 'center';
            downloadCtx.textBaseline = 'middle';

            const metrics = downloadCtx.measureText(element.text);
            const textWidth = metrics.width;
            const textHeight = element.fontSize;

            downloadCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            downloadCtx.fillRect(
                element.x - (textWidth + 20) / 2,
                element.y - (textHeight + 20) / 2,
                textWidth + 20,
                textHeight + 20
            );

            downloadCtx.fillStyle = element.fontColor;
            downloadCtx.fillText(element.text, element.x, element.y);
        } else if (element.type === 'sticker') {
            downloadCtx.font = `${element.fontSize}px Arial`;
            downloadCtx.textAlign = 'center';
            downloadCtx.textBaseline = 'middle';
            downloadCtx.fillStyle = '#000';
            downloadCtx.fillText(element.text, element.x, element.y);
        }
    });

    // Add watermark
    if (watermarkImg && watermarkImg.complete) {
        downloadCtx.globalAlpha = 0.6;
        downloadCtx.drawImage(watermarkImg, downloadCanvas.width - 60, downloadCanvas.height - 50, 50, 40);
        downloadCtx.globalAlpha = 1;
    }

    downloadCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meme_${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        closeShareMenu();
    });
}

// Toggle share menu
function toggleShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    shareMenu.classList.toggle('show');
}

// Close share menu
function closeShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    shareMenu.classList.remove('show');
}

// Share to WhatsApp
function shareToWhatsApp() {
    downloadCanvas.toBlob((blob) => {
        // Create a temporary image to show in the message
        const imageUrl = URL.createObjectURL(blob);
        const text = encodeURIComponent('Check out my meme created with MEME VIBER! 😂');
        
        // Open WhatsApp - user will need to save and attach manually or use WhatsApp Web
        window.open(`https://wa.me/?text=${text}`, '_blank');
        closeShareMenu();
    });
}

// Share to Facebook
function shareToFacebook() {
    // Facebook sharing requires proper setup, this opens Facebook
    const text = encodeURIComponent('Just created an awesome meme with MEME VIBER! 🎨');
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}&u=https://memeviber.app`, '_blank');
    closeShareMenu();
}

// Share to Instagram
function shareToInstagram() {
    // Instagram doesn't support direct web sharing, but we can inform the user
    alert('To share on Instagram:\n\n1. Download the meme\n2. Open Instagram\n3. Create a new post\n4. Upload the meme image\n5. Add caption and share!\n\nLet\'s download your meme first!');
    downloadMeme();
}

function shareWhatsApp() {
    const text = encodeURIComponent('Check out my meme! 😂\n\n🎨 Created with MEME VIBER\nhttps://memeviber.app');
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Initialize
drawCanvas();

// ===== MOBILE TOUCH EVENT HANDLERS FOR UI ELEMENTS =====

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTouchHandlers);
} else {
    setupTouchHandlers();
}

function setupTouchHandlers() {
    // Add touch support to all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.95)';
        }, { passive: false });
        
        button.addEventListener('touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
            
            // Simulate click for onclick handlers
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            this.dispatchEvent(clickEvent);
        }, { passive: false });
    });
    
    // Add touch support to color swatches specifically
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach((swatch, index) => {
        swatch.addEventListener('touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            // Get the actual background color
            const styleStr = this.getAttribute('style');
            let color = '#1E90FF';
            
            if (styleStr.includes('linear-gradient')) {
                if (styleStr.includes('667eea')) {
                    color = 'linear-gradient(135deg, #667eea, #764ba2)';
                } else {
                    color = 'linear-gradient(135deg, #FF6B6B, #FFD93D)';
                }
            } else {
                const match = styleStr.match(/#[0-9a-f]{6}/i);
                if (match) {
                    color = match[0];
                }
            }
            
            changeBgColor(color);
        }, { passive: false });
    });
    
    // Add touch support to sticker buttons
    const stickerBtns = document.querySelectorAll('.sticker-btn');
    stickerBtns.forEach(btn => {
        btn.addEventListener('touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const emoji = this.textContent.trim();
            addSticker(emoji);
        }, { passive: false });
    });
}

// Close overlays when clicking outside
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTextSettings();
        closeStickerPicker();
        closeShareMenu();
    }
});

// Close share menu when clicking outside
document.addEventListener('click', (e) => {
    const shareMenu = document.getElementById('shareMenu');
    const shareBtn = document.querySelector('.editor-action-btn');
    
    if (!shareMenu.contains(e.target) && !shareBtn.contains(e.target)) {
        closeShareMenu();
    }
});

// Handle viewport changes for mobile keyboard
let lastViewportHeight = window.innerHeight;
window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight;
    const editorPage = document.getElementById('editorPage');
    
    // If height decreased significantly, keyboard is showing
    if (currentHeight < lastViewportHeight * 0.85) {
        // Keyboard is visible - canvas area should remain visible
        editorPage.classList.add('keyboard-visible');
        
        // Scroll canvas into view
        setTimeout(() => {
            const canvas = document.getElementById('canvas');
            if (canvas) {
                canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
    } else {
        // Keyboard is hidden
        editorPage.classList.remove('keyboard-visible');
    }
    
    lastViewportHeight = currentHeight;
});

// Prevent zoom on double tap
document.addEventListener('touchend', (e) => {
    if (e.touches.length <= 1) {
        e.preventDefault();
    }
}, false);

