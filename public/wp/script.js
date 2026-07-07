// === STATE ===
const DEFAULT_LOGO_URL = 'https://erntysmhwfxkrtegirds.supabase.co/storage/v1/object/public/product-images/logo.png';

const S = {
    sel: null,
    z: 10,
    hist: [],
    maxHist: 15,
    bgImage: null,
    bgImageLoaded: false
};
const stage = document.getElementById('stage');
const bgColor = document.getElementById('bgColor');
const bgFit = document.getElementById('bgFit');
const info = document.getElementById('info');

let drag = { el: null, mx: 0, my: 0, sx: 0, sy: 0, sw: 0, sh: 0, res: false, edge: '' };

// === INIT ===
stage.style.backgroundColor = bgColor.value;

bgColor.oninput = () => { stage.style.backgroundColor = bgColor.value; };
bgFit.onchange = () => { updateBgImgDisplay(); };

function updateBgImgDisplay() {
    if (!S.bgImageLoaded) return;
    
    if (bgFit.value === 'cover') {
        stage.style.backgroundSize = 'cover';
    } else {
        stage.style.backgroundSize = 'contain';
    }
    stage.style.backgroundPosition = 'center';
    stage.style.backgroundRepeat = 'no-repeat';
}

document.getElementById('bgFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
        const img = new Image();
        img.onload = () => {
            S.bgImage = img;
            S.bgImageLoaded = true;
            stage.style.backgroundImage = `url('${ev.target.result}')`;
            updateBgImgDisplay();
            toast('✅ Arka plan yüklendi');
        };
        img.src = ev.target.result;
    };
    r.readAsDataURL(f);
};

document.getElementById('imgFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
        addLayer('img', ev.target.result);
        e.target.value = '';
    };
    r.readAsDataURL(f);
};

function addDefaultLogo() {
    const testImg = new Image();
    testImg.onload = () => {
        const el = addLayer('img', DEFAULT_LOGO_URL);
        el.style.width = '321px';
        el.style.height = '80px';
        el.style.left = '26px';
        el.style.top = '10px';
        updateList();
        select(el);
        toast('✅ Varsayılan logo eklendi');
    };
    testImg.onerror = () => { toast('❌ Logo yüklenemedi!'); };
    testImg.src = DEFAULT_LOGO_URL;
}

stage.onclick = e => { if (e.target === stage) deselect(); };
document.addEventListener('keydown', handleKeys);
setupProps();

// === LAYER MANAGEMENT ===
function addLayer(type, content = '') {
    saveState();
    const el = document.createElement('div');
    el.className = `layer ${type}-layer`;
    el.style.left = (30 + Math.random() * 150) + 'px';
    el.style.top = (150 + Math.random() * 200) + 'px';
    el.style.zIndex = ++S.z;

    if (type === 'txt') {
        el.textContent = content || 'Yeni Metin';
        el.style.fontSize = '20px';
        el.style.fontFamily = 'sans-serif';
        el.style.color = '#fff';
        el.style.backgroundColor = 'rgba(0,0,0,0.75)';
        el.style.padding = '10px 14px';
        el.style.borderRadius = '8px';
        el.style.textAlign = 'center';
    } else if (type === 'img') {
        el.style.backgroundImage = `url('${content}')`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.width = '80px';
        el.style.height = '80px';
        el.setAttribute('data-src', content);
    }

    ['se', 'sw', 'ne', 'nw'].forEach(pos => {
        const h = document.createElement('div');
        h.className = `handle ${pos}`;
        h.onmousedown = e => { e.stopPropagation(); startResize(e, el, pos); };
        el.appendChild(h);
    });

    el.onmousedown = e => { if (!e.target.classList.contains('handle')) startDrag(e, el); };
    el.onclick = e => { e.stopPropagation(); select(el); };
    el.ondblclick = () => { if (el.classList.contains('txt-layer')) inlineEdit(el); };

    stage.appendChild(el);
    select(el);
    updateList();
    return el;
}

function select(el) {
    if (S.sel) S.sel.classList.remove('sel');
    S.sel = el;
    el.classList.add('sel');

    const typeEl = document.getElementById('layerType');
    const txtP = document.getElementById('txtProps');
    const imgP = document.getElementById('imgProps');

    if (el.classList.contains('txt-layer')) {
        typeEl.textContent = 'Metin';
        txtP.style.display = 'block';
        imgP.style.display = 'none';

        document.getElementById('txtContent').value = el.textContent;
        document.getElementById('txtFont').value = el.style.fontFamily.replace(/['"]/g, '') || 'sans-serif';
        document.getElementById('txtAlign').value = el.style.textAlign || 'center';
        document.getElementById('txtSize').value = parseInt(el.style.fontSize) || 20;
        document.getElementById('txtSpace').value = parseInt(el.style.letterSpacing) || 0;
        document.getElementById('txtColor').value = rgb2hex(el.style.color) || '#ffffff';

        const bgColor = el.style.backgroundColor || getComputedStyle(el).backgroundColor;
        document.getElementById('txtBg').value = rgb2hex(bgColor) || '#000000';

        const opacityMatch = bgColor.match(/[\d.]+\)$/);
        document.getElementById('txtOpacity').value = opacityMatch ? parseFloat(opacityMatch[0]) : '0.8';

        document.getElementById('sv').textContent = document.getElementById('txtSize').value;
        document.getElementById('spv').textContent = document.getElementById('txtSpace').value;
    } else {
        typeEl.textContent = 'Görsel';
        txtP.style.display = 'none';
        imgP.style.display = 'block';
        document.getElementById('imgW').value = parseInt(el.style.width) || 80;
        document.getElementById('imgH').value = parseInt(el.style.height) || 80;
    }
    updateInfo(el);
    updateList();
}

function deselect() {
    if (S.sel) S.sel.classList.remove('sel');
    S.sel = null;
    document.getElementById('layerType').textContent = 'Seçili Yok';
    document.getElementById('txtProps').style.display = 'none';
    document.getElementById('imgProps').style.display = 'none';
    info.textContent = 'Tıkla → Sürükle → Düzenle → Paylaş';
    updateList();
}

function delLayer() {
    if (!S.sel) return;
    saveState();
    S.sel.remove();
    deselect();
    toast('🗑 Silindi');
}

function dupLayer() {
    if (!S.sel) return;
    saveState();
    const clone = S.sel.cloneNode(true);
    clone.style.left = (parseInt(S.sel.style.left) + 15) + 'px';
    clone.style.top = (parseInt(S.sel.style.top) + 15) + 'px';
    clone.style.zIndex = ++S.z;
    clone.classList.remove('sel');

    clone.onmousedown = e => { if (!e.target.classList.contains('handle')) startDrag(e, clone); };
    clone.onclick = e => { e.stopPropagation(); select(clone); };
    clone.ondblclick = () => { if (clone.classList.contains('txt-layer')) inlineEdit(clone); };
    clone.querySelectorAll('.handle').forEach(h => {
        h.onmousedown = e => { e.stopPropagation(); startResize(e, clone, h.classList[1]); };
    });

    stage.appendChild(clone);
    select(clone);
    toast('📋 Kopyalandı');
}

function moveZ(d) {
    if (!S.sel) return;
    S.sel.style.zIndex = Math.max(2, (parseInt(S.sel.style.zIndex) || 10) + d);
    updateList();
}

function inlineEdit(el) {
    const orig = el.textContent;
    const inp = document.createElement('textarea');
    inp.value = orig;
    inp.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);color:#fff;border:2px solid #25D366;border-radius:8px;padding:8px;font:inherit;resize:none;z-index:999;';
    el.textContent = '';
    el.appendChild(inp);
    inp.focus();
    inp.onblur = () => {
        el.textContent = inp.value || orig;
        inp.remove();
        select(el);
    };
    inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); inp.blur(); } };
}

// === DRAG & RESIZE ===
function startDrag(e, el) {
    e.preventDefault();
    drag = { el, mx: e.clientX, my: e.clientY, sx: parseInt(el.style.left) || 0, sy: parseInt(el.style.top) || 0, res: false };
    el.classList.add('drag');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function startResize(e, el, edge) {
    e.preventDefault(); e.stopPropagation();
    drag = { el, mx: e.clientX, my: e.clientY, sx: parseInt(el.style.left) || 0, sy: parseInt(el.style.top) || 0, sw: el.offsetWidth, sh: el.offsetHeight, res: true, edge };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    const { el, mx, my, sx, sy, res, edge, sw, sh } = drag;
    const dx = e.clientX - mx, dy = e.clientY - my;

    if (res) {
        if (edge.includes('e')) el.style.width = Math.max(30, sw + dx) + 'px';
        if (edge.includes('s')) el.style.height = Math.max(30, sh + dy) + 'px';
        if (edge.includes('w')) { el.style.width = Math.max(30, sw - dx) + 'px'; el.style.left = Math.max(0, sx + dx) + 'px'; }
        if (edge.includes('n')) { el.style.height = Math.max(30, sh - dy) + 'px'; el.style.top = Math.max(0, sy + dy) + 'px'; }
    } else {
        el.style.left = Math.max(0, Math.min(360 - el.offsetWidth, sx + dx)) + 'px';
        el.style.top = Math.max(0, Math.min(640 - el.offsetHeight, sy + dy)) + 'px';
    }
    updateInfo(el);
}

function stopDrag() {
    if (drag.el) { drag.el.classList.remove('drag'); saveState(); }
    drag = { el: null, mx: 0, my: 0, sx: 0, sy: 0, sw: 0, sh: 0, res: false, edge: '' };
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

function updateInfo(el) {
    if (!el) return;
    info.textContent = `X:${parseInt(el.style.left)||0} Y:${parseInt(el.style.top)||0} | W:${el.offsetWidth} H:${el.offsetHeight}`;
    if (el.classList.contains('img-layer')) {
        document.getElementById('imgW').value = el.offsetWidth;
        document.getElementById('imgH').value = el.offsetHeight;
    }
}

// === PROPERTIES SYNC ===
function setupProps() {
    const sync = () => {
        if (!S.sel || !S.sel.classList.contains('txt-layer')) return;
        const el = S.sel;
        el.textContent = document.getElementById('txtContent').value;
        el.style.fontFamily = document.getElementById('txtFont').value;
        el.style.textAlign = document.getElementById('txtAlign').value;
        el.style.fontSize = document.getElementById('txtSize').value + 'px';
        el.style.letterSpacing = document.getElementById('txtSpace').value + 'px';
        el.style.color = document.getElementById('txtColor').value;

        const hex = document.getElementById('txtBg').value;
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        el.style.backgroundColor = `rgba(${r},${g},${b},${document.getElementById('txtOpacity').value})`;

        document.getElementById('sv').textContent = document.getElementById('txtSize').value;
        document.getElementById('spv').textContent = document.getElementById('txtSpace').value;
    };

    const syncImg = () => {
        if (!S.sel || !S.sel.classList.contains('img-layer')) return;
        S.sel.style.width = document.getElementById('imgW').value + 'px';
        S.sel.style.height = document.getElementById('imgH').value + 'px';
    };

    ['txtContent', 'txtFont', 'txtAlign', 'txtOpacity'].forEach(id => document.getElementById(id).oninput = sync);
    ['txtSize', 'txtSpace', 'txtColor', 'txtBg'].forEach(id => document.getElementById(id).oninput = sync);
    ['imgW', 'imgH'].forEach(id => document.getElementById(id).oninput = syncImg);
}

// === KEYBOARD ===
function handleKeys(e) {
    if (!S.sel || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delLayer(); }
    else if (e.ctrlKey && e.key === 'd') { e.preventDefault(); dupLayer(); }
    else if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(0, -step); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(0, step); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSel(-step, 0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); moveSel(step, 0); }
}

function moveSel(dx, dy) {
    const el = S.sel;
    el.style.left = Math.max(0, Math.min(360 - el.offsetWidth, (parseInt(el.style.left) || 0) + dx)) + 'px';
    el.style.top = Math.max(0, Math.min(640 - el.offsetHeight, (parseInt(el.style.top) || 0) + dy)) + 'px';
    updateInfo(el);
}

// === LAYER LIST ===
function updateList() {
    const layers = stage.querySelectorAll('.layer');
    const list = document.getElementById('layerList');
    if (!layers.length) { list.innerHTML = '<div style="color:var(--mut); text-align:center; padding:10px;">Boş</div>'; return; }

    list.innerHTML = Array.from(layers).map((l, i) => {
        const icon = l.classList.contains('txt-layer') ? '📝' : '🖼';
        const active = l === S.sel ? ' active' : '';
        if (!l.id || !l.id.startsWith('l-')) l.id = 'l-' + Date.now() + '-' + i;
        return `<div class="${active}" onclick="selectById('${l.id}')">${icon} Katman ${i+1} (Z:${l.style.zIndex})</div>`;
    }).join('');
}

function selectById(id) { const el = document.getElementById(id); if (el) select(el); }

// === HISTORY ===
function saveState() {
    S.hist.push(stage.innerHTML);
    if (S.hist.length > S.maxHist) S.hist.shift();
}

// === UNDO CONTROL ===
function undo() {
    if (!S.hist.length) return;
    stage.innerHTML = S.hist.pop();
    stage.querySelectorAll('.layer').forEach(el => {
        el.onmousedown = e => { if (!e.target.classList.contains('handle')) startDrag(e, el); };
        el.onclick = e => { e.stopPropagation(); select(el); };
        el.ondblclick = () => { if (el.classList.contains('txt-layer')) inlineEdit(el); };
        el.querySelectorAll('.handle').forEach(h => { h.onmousedown = e => { e.stopPropagation(); startResize(e, el, h.classList[1]); }; });
    });
    deselect();
    toast('↩ Geri alındı');
}

// === TEMPLATES ===
function template(type) {
    resetAll();
    if (type === 'default') {
        bgColor.value = '#ffffff'; stage.style.backgroundColor = '#ffffff';
        const logoEl = addLayer('img', DEFAULT_LOGO_URL);
        logoEl.style.width = '321px'; logoEl.style.height = '80px'; logoEl.style.left = '26px'; logoEl.style.top = '10px';
        const txtEl = addLayer('txt', 'Kampanya patron çıldırdı!');
        txtEl.style.left = '88px'; txtEl.style.top = '505px'; txtEl.style.width = '199px';
        select(txtEl);
        toast('✅ Varsayılan tasarım yüklendi');
        return;
    }
    const t = {
        quote: { bg: '#1a1a2e', txt: '"Başarı, her gün tekrarlanan küçük çabaların toplamıdır."', font: 'Georgia', size: '22', style: 'italic', color: '#fff', bgTxt: 'rgba(37,211,102,0.3)', top: '250', left: '40', w: '280', pad: '18' },
        promo: { bg: '#ff6b6b', txt: '🔥 BÜYÜK İNDİRİM\n%50\'ye Varan Fırsatlar!', font: 'Impact', size: '26', style: 'normal', color: '#fff', bgTxt: 'rgba(0,0,0,0.7)', top: '200', left: '30', w: '300', pad: '16' },
        minimal: { bg: '#f8f9fa', txt: 'sadelik', font: 'sans-serif', size: '48', style: 'normal', color: '#333', bgTxt: 'transparent', top: '280', left: '80', w: '200', pad: '10' },
        bold: { bg: '#000', txt: 'SINIRLARI\nZORLA!', font: 'Impact', size: '40', style: 'normal', color: '#25D366', bgTxt: 'transparent', top: '250', left: '60', w: '240', pad: '10' }
    }[type];

    if (!t) return;
    bgColor.value = t.bg; stage.style.backgroundColor = t.bg;
    const el = addLayer('txt', t.txt);
    el.style.fontFamily = t.font; el.style.fontSize = t.size + 'px'; el.style.fontStyle = t.style; el.style.color = t.color; el.style.backgroundColor = t.bgTxt; el.style.top = t.top + 'px'; el.style.left = t.left + 'px'; el.style.width = t.w + 'px'; el.style.padding = t.pad + 'px';
    toast('✅ Şablon yüklendi');
}

// === EXPORT (ULTRA HD RE-RENDER MOTORU) ===
async function exportImg(format) {
    if (S.sel) S.sel.classList.remove('sel');
    
    // Kalite çarpanını alıyoruz (1, 2 veya 3)
    const q = parseInt(document.getElementById('quality').value) || 2;
    toast('⏳ Ultra net grafik işleniyor...');

    const clone = stage.cloneNode(true);
    
    // Gereksiz arayüz elemanlarını temizle
    clone.querySelectorAll('.handle').forEach(h => h.remove());
    clone.querySelectorAll('.layer').forEach(l => {
        l.classList.remove('sel', 'drag');
        l.style.border = 'none';
        l.style.outline = 'none';
        l.style.boxShadow = 'none';
    });

    // Görsel kalitesini artırmak için klon elemente en keskin render kurallarını enjekte ediyoruz
    clone.style.imageRendering = 'high-quality'; 
    clone.style.webkitFontSmoothing = 'antialiased';
    clone.style.mozOsxFontSmoothing = 'grayscale';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '360px';
    wrapper.style.height = '640px';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
        const canvas = await html2canvas(clone, { 
            scale: q, // Çözünürlüğü seçilen çarpan kadar artırır
            devicePixelRatio: q, // Ekran piksel yoğunluğunu simüle eder
            backgroundColor: null, 
            logging: false, 
            allowTaint: true, 
            useCORS: true, // Dış kaynaklı resimlerin kalitesini korur
            width: 360,
            height: 640,
            imageTimeout: 0,
            onclone: (clonedDoc) => {
                const clonedStage = clonedDoc.getElementById('stage');
                if (clonedStage) {
                    clonedStage.style.backgroundSize = bgFit.value === 'cover' ? 'cover' : 'contain';
                    clonedStage.style.backgroundPosition = 'center';
                    clonedStage.style.backgroundRepeat = 'no-repeat';
                    clonedStage.style.imageRendering = 'high-quality';
                }
                clonedDoc.querySelectorAll('.img-layer').forEach(layer => {
                    layer.style.backgroundSize = 'contain';
                    layer.style.backgroundPosition = 'center';
                    layer.style.backgroundRepeat = 'no-repeat';
                    layer.style.imageRendering = 'high-quality'; // Resimlerin pikselleşmesini önler
                });
            }
        });

        wrapper.remove();

        if (format === 'png') {
            // PNG indirme işlemi
            const a = document.createElement('a');
            a.download = `wp-status-${Date.now()}.png`; 
            a.href = canvas.toDataURL('image/png'); // PNG zaten kayıpsızdır
            a.click();
            toast('✅ Ultra net PNG indirildi!');
        } else {
            // Kopyalama işleminde kalitenin düşmesini engellemek için mime-type tanımını zorunlu tutuyoruz
            canvas.toBlob(blob => {
                if (!blob) return toast('❌ Hata oluştu!');
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]).then(() => {
                    toast('📋 Net görsel panoya kopyalandı!');
                }).catch(err => {
                    console.error(err);
                    toast('⚠️ İzin verilmedi, PNG olarak indirin.');
                });
            }, 'image/png'); // Resim türünü burada açıkça belirtmek çamurlaşmayı önler
        }
    } catch (error) { 
        console.error(error);
        if (wrapper) wrapper.remove();
        toast('❌ Render hatası oluştu!'); 
    }
}

// === UTILS ===
function resetAll() {
    saveState();
    stage.querySelectorAll('.layer').forEach(l => l.remove());
    stage.style.background = '#ffffff'; 
    stage.style.backgroundImage = 'none';
    bgColor.value = '#ffffff';
    S.bgImage = null; S.bgImageLoaded = false; deselect(); S.z = 10; toast('🔄 Sıfırlandı');
}

function centerAll() {
    if (!S.sel) return;
    S.sel.style.left = ((360 - S.sel.offsetWidth) / 2) + 'px';
    S.sel.style.top = ((640 - S.sel.offsetHeight) / 2) + 'px';
    updateInfo(S.sel); toast('🎯 Ortalandı');
}

function rgb2hex(rgb) {
    if (!rgb || !rgb.includes('rgb')) return null;
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('') : null;
}

function toast(msg) {
    const old = document.querySelector('.toast'); if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { template('default'); }, 100); });