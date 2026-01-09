// ============================================
// MEME EDITOR - CORE APPLICATION
// ============================================

const MemeEditor = (() => {
    // ============================================
    // STATE MANAGEMENT
    // ============================================

    const state = {
        layers: [], // All text and sticker layers
        selectedLayer: null,
        isDragging: false,
        isResizing: false,
        isRotating: false,
        dragStart: { x: 0, y: 0 },
        originalTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
        backgroundColor: '#3498db',
        hasContent: false,
        undoStack: [],
        redoStack: [],
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const DOM = {
        board: null,
        closeBtn: null,
        doneBtn: null,
        shareBtn: null,
        addTextBtn: null,
        colorGrid: null,
        stickerBtns: null,
        shareModal: null,
        modalClose: null,
        textToolbar: null,
        exportCanvas: null,
        watermarkImg: null,
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    const init = () => {
        cacheDOM();
        loadState();
        attachEventListeners();
        focusBoard();
        checkContent();
    };

    const cacheDOM = () => {
        DOM.board = document.getElementById('board');
        DOM.closeBtn = document.getElementById('closeBtn');
        DOM.doneBtn = document.getElementById('doneBtn');
        DOM.shareBtn = document.getElementById('shareBtn');
        DOM.addTextBtn = document.getElementById('addTextBtn');
        DOM.colorGrid = document.getElementById('colorGrid');
        DOM.stickerBtns = document.querySelectorAll('.sticker-btn');
        DOM.shareModal = document.getElementById('shareModal');
        DOM.modalClose = document.querySelector('.modal-close');
        DOM.textToolbar = document.getElementById('textToolbar');
        DOM.exportCanvas = document.getElementById('exportCanvas');
        DOM.watermarkImg = document.getElementById('watermarkImg');
    };

    // ============================================
    // TEXT LAYER MANAGEMENT
    // ============================================

    const createTextLayer = (text = 'Tap to edit', x = null, y = null) => {
        const layer = document.createElement('div');
        layer.className = 'text-layer';
        layer.contentEditable = true;
        layer.innerHTML = text;

        // Position in center if not specified
        if (x === null || y === null) {
            const boardRect = DOM.board.getBoundingClientRect();
            x = boardRect.width / 2 - 50;
            y = boardRect.height / 2 - 25;
        }

        layer.style.left = x + 'px';
        layer.style.top = y + 'px';
        layer.style.color = 'white';
        layer.style.fontSize = '32px';
        layer.style.fontFamily = 'Arial, sans-serif';
        layer.style.textAlign = 'center';

        const id = 'layer-' + Date.now();
        layer.dataset.id = id;

        DOM.board.appendChild(layer);

        const layerData = {
            id,
            element: layer,
            x,
            y,
            text,
            color: 'white',
            fontSize: 32,
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
            scale: 1,
            rotation: 0,
            type: 'text',
        };

        state.layers.push(layerData);

        attachLayerEventListeners(layer, id);
        saveState();
        checkContent();

        return layerData;
    };

    const createStickerLayer = (emoji, x = null, y = null) => {
        const layer = document.createElement('div');
        layer.className = 'sticker-layer';
        layer.innerHTML = emoji;

        // Position in center if not specified
        if (x === null || y === null) {
            const boardRect = DOM.board.getBoundingClientRect();
            x = boardRect.width / 2 - 30;
            y = boardRect.height / 2 - 30;
        }

        layer.style.left = x + 'px';
        layer.style.top = y + 'px';

        const id = 'sticker-' + Date.now();
        layer.dataset.id = id;

        DOM.board.appendChild(layer);

        const layerData = {
            id,
            element: layer,
            x,
            y,
            emoji,
            scale: 1,
            rotation: 0,
            type: 'sticker',
        };

        state.layers.push(layerData);

        attachLayerEventListeners(layer, id);
        saveState();
        checkContent();

        return layerData;
    };

    const attachLayerEventListeners = (element, id) => {
        element.addEventListener('pointerdown', (e) => handlePointerDown(e, id));
        element.addEventListener('pointermove', (e) => handlePointerMove(e, id));
        element.addEventListener('pointerup', (e) => handlePointerUp(e, id));
        element.addEventListener('pointerleave', (e) => handlePointerUp(e, id));
        element.addEventListener('focus', () => selectLayer(id));
        element.addEventListener('blur', () => hideTextToolbar());
        element.addEventListener('input', () => {
            const layer = state.layers.find(l => l.id === id);
            if (layer) {
                layer.text = element.innerText || '';
                saveState();
            }
        });
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            selectLayer(id);
        });
    };

    // ============================================
    // POINTER EVENTS (Drag, Resize, Rotate)
    // ============================================

    const handlePointerDown = (e, layerId) => {
        e.preventDefault();
        e.stopPropagation();

        const layer = state.layers.find(l => l.id === layerId);
        if (!layer) return;

        const target = e.target;
        const rect = target.getBoundingClientRect();

        state.dragStart = { x: e.clientX, y: e.clientY };
        state.originalTransform = {
            x: layer.x,
            y: layer.y,
            scale: layer.scale || 1,
            rotation: layer.rotation || 0,
        };

        // Detect interaction type
        if (target.classList.contains('resize-handle')) {
            state.isResizing = true;
        } else if (target.classList.contains('rotate-handle')) {
            state.isRotating = true;
        } else {
            state.isDragging = true;
        }

        target.setPointerCapture(e.pointerId);
        selectLayer(layerId);
    };

    const handlePointerMove = (e, layerId) => {
        if (!state.isDragging && !state.isResizing && !state.isRotating) return;

        e.preventDefault();
        const layer = state.layers.find(l => l.id === layerId);
        if (!layer) return;

        const deltaX = e.clientX - state.dragStart.x;
        const deltaY = e.clientY - state.dragStart.y;

        if (state.isDragging) {
            layer.x = state.originalTransform.x + deltaX;
            layer.y = state.originalTransform.y + deltaY;
            layer.element.style.left = layer.x + 'px';
            layer.element.style.top = layer.y + 'px';
            layer.element.classList.add('dragging');
        } else if (state.isResizing) {
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            layer.scale = Math.max(0.5, state.originalTransform.scale + distance / 100);
            updateTransform(layer);
        } else if (state.isRotating) {
            const centerX = layer.element.getBoundingClientRect().left + layer.element.offsetWidth / 2;
            const centerY = layer.element.getBoundingClientRect().top + layer.element.offsetHeight / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            layer.rotation = angle * (180 / Math.PI);
            updateTransform(layer);
        }
    };

    const handlePointerUp = (e, layerId) => {
        if (!state.isDragging && !state.isResizing && !state.isRotating) return;

        state.isDragging = false;
        state.isResizing = false;
        state.isRotating = false;

        const layer = state.layers.find(l => l.id === layerId);
        if (layer) {
            layer.element.classList.remove('dragging');
            saveState();
        }
    };

    const updateTransform = (layer) => {
        layer.element.style.transform = `scale(${layer.scale}) rotate(${layer.rotation}deg)`;
    };

    // ============================================
    // LAYER SELECTION & CONTROLS
    // ============================================

    const selectLayer = (id) => {
        // Deselect previous
        state.layers.forEach(l => l.element.classList.remove('selected'));

        // Select new
        const layer = state.layers.find(l => l.id === id);
        if (layer) {
            layer.element.classList.add('selected');
            state.selectedLayer = id;

            // Add handles if text layer
            if (layer.type === 'text' && !layer.element.querySelector('.resize-handle')) {
                addLayerHandles(layer.element);
            }

            // Show toolbar if text
            if (layer.type === 'text') {
                showTextToolbar(layer);
                layer.element.focus();
            }
        }
    };

    const deselectLayer = () => {
        state.layers.forEach(l => l.element.classList.remove('selected'));
        state.selectedLayer = null;
        hideTextToolbar();
    };

    const addLayerHandles = (element) => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        element.appendChild(resizeHandle);

        const rotateHandle = document.createElement('div');
        rotateHandle.className = 'rotate-handle';
        element.appendChild(rotateHandle);
    };

    const deleteLayer = (id) => {
        const index = state.layers.findIndex(l => l.id === id);
        if (index !== -1) {
            state.layers[index].element.remove();
            state.layers.splice(index, 1);
            state.selectedLayer = null;
            saveState();
            checkContent();
        }
    };

    // ============================================
    // TEXT TOOLBAR
    // ============================================

    const showTextToolbar = (layer) => {
        if (layer.type !== 'text') return;

        DOM.textToolbar.classList.remove('hidden');

        // Set current color
        document.getElementById('textColorPicker').value = rgbToHex(layer.color || 'white');
    };

    const hideTextToolbar = () => {
        DOM.textToolbar.classList.add('hidden');
    };

    // ============================================
    // COLOR & STYLING
    // ============================================

    const setBackgroundColor = (color) => {
        state.backgroundColor = color;
        DOM.board.style.backgroundColor = color;
        saveState();

        // Update active indicator
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === color);
        });
    };

    const setTextColor = (color) => {
        const layer = state.layers.find(l => l.id === state.selectedLayer);
        if (layer && layer.type === 'text') {
            layer.color = color;
            layer.element.style.color = color;
            saveState();
        }
    };

    const increaseFontSize = () => {
        const layer = state.layers.find(l => l.id === state.selectedLayer);
        if (layer && layer.type === 'text') {
            layer.fontSize = Math.min(120, (layer.fontSize || 32) + 4);
            layer.element.style.fontSize = layer.fontSize + 'px';
            saveState();
        }
    };

    const decreaseFontSize = () => {
        const layer = state.layers.find(l => l.id === state.selectedLayer);
        if (layer && layer.type === 'text') {
            layer.fontSize = Math.max(16, (layer.fontSize || 32) - 4);
            layer.element.style.fontSize = layer.fontSize + 'px';
            saveState();
        }
    };

    // ============================================
    // CONTENT CHECK
    // ============================================

    const checkContent = () => {
        const hasText = state.layers.some(l => l.type === 'text' && l.text && l.text.trim().length > 0);
        state.hasContent = hasText;
        DOM.shareBtn.disabled = !hasText;
    };

    // ============================================
    // CANVAS EXPORT & SHARING
    // ============================================

    const exportToCanvas = async () => {
        const boardRect = DOM.board.getBoundingClientRect();
        const width = boardRect.width * window.devicePixelRatio;
        const height = boardRect.height * window.devicePixelRatio;

        DOM.exportCanvas.width = width;
        DOM.exportCanvas.height = height;

        const ctx = DOM.exportCanvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Draw background
        ctx.fillStyle = state.backgroundColor;
        ctx.fillRect(0, 0, boardRect.width, boardRect.height);

        // Draw layers
        for (const layer of state.layers) {
            const rect = layer.element.getBoundingClientRect();
            const x = rect.left - boardRect.left;
            const y = rect.top - boardRect.top;

            ctx.save();
            ctx.translate(x + rect.width / 2, y + rect.height / 2);
            ctx.rotate((layer.rotation || 0) * Math.PI / 180);
            ctx.scale(layer.scale || 1, layer.scale || 1);
            ctx.translate(-rect.width / 2, -rect.height / 2);

            if (layer.type === 'text') {
                ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily}`;
                ctx.fillStyle = layer.color;
                ctx.textAlign = layer.textAlign || 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.fillText(layer.text, rect.width / 2, rect.height / 2);
            } else if (layer.type === 'sticker') {
                ctx.font = `60px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(layer.emoji, rect.width / 2, rect.height / 2);
            }

            ctx.restore();
        }

        // Draw watermark
        try {
            const img = await new Promise(resolve => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => resolve(null);
                image.src = DOM.watermarkImg.src;
            });

            if (img) {
                ctx.globalAlpha = 0.8;
                ctx.drawImage(img, 12, boardRect.height - 50, 140, 40);
                ctx.globalAlpha = 1;
            }
        } catch (e) {
            console.log('Watermark not available');
        }

        return new Promise(resolve => {
            DOM.exportCanvas.toBlob(resolve, 'image/png');
        });
    };

    const downloadMeme = async () => {
        const blob = await exportToCanvas();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'meme-' + Date.now() + '.png';
        link.click();
        URL.revokeObjectURL(url);
    };

    const shareMeme = async (platform) => {
        const blob = await exportToCanvas();
        const url = URL.createObjectURL(blob);
        const file = new File([blob], 'meme.png', { type: 'image/png' });

        if (platform === 'whatsapp') {
            window.location.href = `whatsapp://send?text=Check out my meme!`;
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`);
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=Check out my meme!&url=${window.location.href}`);
        }

        URL.revokeObjectURL(url);
    };

    // ============================================
    // PERSISTENCE (localStorage)
    // ============================================

    const saveState = () => {
        const data = {
            backgroundColor: state.backgroundColor,
            layers: state.layers.map(layer => ({
                type: layer.type,
                text: layer.text || null,
                emoji: layer.emoji || null,
                x: layer.x,
                y: layer.y,
                color: layer.color || null,
                fontSize: layer.fontSize || null,
                fontFamily: layer.fontFamily || null,
                textAlign: layer.textAlign || null,
                scale: layer.scale || 1,
                rotation: layer.rotation || 0,
            })),
        };

        localStorage.setItem('memeState', JSON.stringify(data));
    };

    const loadState = () => {
        const saved = localStorage.getItem('memeState');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                state.backgroundColor = data.backgroundColor;
                DOM.board.style.backgroundColor = state.backgroundColor;

                // Recreate layers
                data.layers.forEach(layerData => {
                    if (layerData.type === 'text') {
                        const layer = createTextLayer(layerData.text, layerData.x, layerData.y);
                        if (layerData.color) layer.element.style.color = layerData.color;
                        if (layerData.fontSize) {
                            layer.element.style.fontSize = layerData.fontSize + 'px';
                            layer.fontSize = layerData.fontSize;
                        }
                        if (layerData.fontFamily) {
                            layer.element.style.fontFamily = layerData.fontFamily;
                            layer.fontFamily = layerData.fontFamily;
                        }
                        if (layerData.textAlign) {
                            layer.element.style.textAlign = layerData.textAlign;
                            layer.textAlign = layerData.textAlign;
                        }
                        layer.color = layerData.color;
                    } else if (layerData.type === 'sticker') {
                        createStickerLayer(layerData.emoji, layerData.x, layerData.y);
                    }
                });
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        } else {
            // Create default text layer
            createTextLayer('Create your meme');
        }

        checkContent();
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================

    const attachEventListeners = () => {
        // Close button
        DOM.closeBtn.addEventListener('click', () => {
            if (confirm('Close editor? Your work will be saved.')) {
                window.location.href = '/';
            }
        });

        // Done button
        DOM.doneBtn.addEventListener('click', () => {
            deselectLayer();
            DOM.shareBtn.focus();
        });

        // Share button
        DOM.shareBtn.addEventListener('click', () => {
            DOM.shareModal.classList.remove('hidden');
        });

        // Share modal close
        DOM.modalClose.addEventListener('click', () => {
            DOM.shareModal.classList.add('hidden');
        });

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', downloadMeme);

        // Social share buttons
        document.getElementById('whatsappBtn').addEventListener('click', () => shareMeme('whatsapp'));
        document.getElementById('facebookBtn').addEventListener('click', () => shareMeme('facebook'));
        document.getElementById('twitterBtn').addEventListener('click', () => shareMeme('twitter'));

        // Add text button
        DOM.addTextBtn.addEventListener('click', () => {
            createTextLayer('New text');
        });

        // Sticker buttons
        DOM.stickerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.sticker;
                createStickerLayer(emoji);
            });
        });

        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                setBackgroundColor(color);
            });
        });

        // Text toolbar buttons
        document.getElementById('increaseFontBtn').addEventListener('click', increaseFontSize);
        document.getElementById('decreaseFontBtn').addEventListener('click', decreaseFontSize);

        document.getElementById('textColorPicker').addEventListener('change', (e) => {
            setTextColor(e.target.value);
        });

        document.getElementById('deleteTextBtn').addEventListener('click', () => {
            if (state.selectedLayer) {
                deleteLayer(state.selectedLayer);
            }
        });

        document.getElementById('alignLeftBtn').addEventListener('click', () => {
            const layer = state.layers.find(l => l.id === state.selectedLayer);
            if (layer && layer.type === 'text') {
                layer.element.style.textAlign = 'left';
                layer.textAlign = 'left';
                saveState();
            }
        });

        document.getElementById('alignCenterBtn').addEventListener('click', () => {
            const layer = state.layers.find(l => l.id === state.selectedLayer);
            if (layer && layer.type === 'text') {
                layer.element.style.textAlign = 'center';
                layer.textAlign = 'center';
                saveState();
            }
        });

        document.getElementById('alignRightBtn').addEventListener('click', () => {
            const layer = state.layers.find(l => l.id === state.selectedLayer);
            if (layer && layer.type === 'text') {
                layer.element.style.textAlign = 'right';
                layer.textAlign = 'right';
                saveState();
            }
        });

        // Board click to deselect
        DOM.board.addEventListener('click', (e) => {
            if (e.target === DOM.board) {
                deselectLayer();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                deselectLayer();
            } else if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') undoAction();
                if (e.key === 'y') redoAction();
            }
        });

        // Prevent zoom on double-tap
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        // Handle window resize
        window.addEventListener('orientationchange', () => {
            saveState();
        });

        // Auto-save every 10 seconds
        setInterval(saveState, 10000);

        // Save on beforeunload
        window.addEventListener('beforeunload', saveState);
    };

    // ============================================
    // KEYBOARD MANAGEMENT
    // ============================================

    const focusBoard = () => {
        // Focus on first text layer or create one
        if (state.layers.length > 0 && state.layers[0].type === 'text') {
            setTimeout(() => {
                state.layers[0].element.focus();
                selectLayer(state.layers[0].id);
            }, 100);
        }
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    const rgbToHex = (rgb) => {
        if (typeof rgb !== 'string') return '#ffffff';
        const match = rgb.match(/\d+/g);
        if (!match || match.length < 3) return '#ffffff';
        return '#' + [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    };

    // ============================================
    // UNDO/REDO (Placeholder)
    // ============================================

    const undoAction = () => {
        // Implement undo stack if needed
    };

    const redoAction = () => {
        // Implement redo stack if needed
    };

    // ============================================
    // PUBLIC API
    // ============================================

    return {
        init,
    };
})();

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    MemeEditor.init();
});
