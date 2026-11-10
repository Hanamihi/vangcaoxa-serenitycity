/**
 * =========================================================================
 * KHỐI CẤU HÌNH DỰ ÁN (CHỈ CẦN SỬA TẠI ĐÂY KHI ÁP DỤNG CHO DỰ ÁN MỚI)
 * =========================================================================
 */
const PROJECT_CONFIG = {
    // 1. Tiêu đề hiển thị trên trình duyệt và đầu trang
    pageTitle: "Quản lý thông tin quỹ đất - Dự án Vàng Cao Xá",
    headerTitle: "QUẢN LÝ THÔNG TIN QUỸ ĐẤT DỰ ÁN",
    headerSubtitle: "Khu dân cư Vàng Cao Xá",

    // 2. Đường dẫn Dữ liệu & Hình ảnh (Chỉ cần thay ảnh nền và file svg)
    scriptUrl: "https://script.google.com/macros/s/AKfycbwGbmlJkh0tNn2bkduTtwBdnOobT_lFuEv26ytIZHI5fpEXTSYtIZyTD_Jddkmsakg/exec", // Nhớ thay bằng link Web App của Sheet Vàng Cao Xá
    svgPath: "assets/svg/map.svg",
    bgImagePath: "assets/images/bg_vangcaoxa.jpg",

    // 3. Số điện thoại Zalo nhận liên hệ
    zaloPhone: "0858290389",

    // 4. Bảng chú thích: Loại hình đất của dự án (Cột 1)
    legendTypes: [
        { label: "Đất ở liền kề", color: "#00aeef" }, // Màu xanh khớp với file map.svg
        { label: "Đất ở biệt thự", color: "#fbbc04" }  // Màu vàng cam khớp với file map.svg
    ],

    // 5. Bảng chú thích: Trạng thái bán hàng (Cột 2)
    legendStatuses: [
        { label: "Đã bán",  color: "#7f8c8d" },
        { label: "Đặt cọc", color: "#f1c40f" },
        { label: "Giữ chỗ", color: "#e74c3c" }
    ]
};

let dataBDS = {}; 
const infoBox = document.getElementById('info-box');

// Khởi tạo giao diện tĩnh từ PROJECT_CONFIG
initStaticUI();

// Tải ĐỒNG THỜI file SVG và dữ liệu từ Google Sheets
Promise.all([
    fetch(PROJECT_CONFIG.svgPath).then(response => {
        if (!response.ok) throw new Error("Không tìm thấy file SVG: " + PROJECT_CONFIG.svgPath);
        return response.text();
    }),
    fetch(PROJECT_CONFIG.scriptUrl).then(response => response.json())
])
.then(([svgContent, data]) => {
    // 1. Nhúng đoạn mã SVG vào trang HTML
    const wrapper = document.getElementById('map-wrapper');
    wrapper.innerHTML = svgContent;
    
    // 2. Tự động gắn id="map-svg" và tự động chèn ảnh nền theo đúng viewBox của SVG
    const svgViewBoxWidth = prepareSvgAndBackground(wrapper);

    // 3. Lưu dữ liệu Google Sheet
    dataBDS = data; 
    console.log("Đã tải dữ liệu và bản đồ thành công!");
    
    // 4. Khởi tạo chức năng (Vẽ tên lô, Click, Zoom)
    initMap(svgViewBoxWidth);      
    initZoom();     
})
.catch(error => {
    console.error("Lỗi khởi tạo:", error);
    alert("Không thể tải dữ liệu hoặc bản đồ. Vui lòng kiểm tra lại đường dẫn file SVG hoặc link Apps Script!");
});

/**
 * HÀM KHỞI TẠO TIÊU ĐỀ, CHÚ THÍCH & NÚT ZALO TỪ CONFIG
 */
function initStaticUI() {
    document.title = PROJECT_CONFIG.pageTitle;
    const hTitle = document.getElementById('header-title');
    const hSub = document.getElementById('header-subtitle');
    if (hTitle) hTitle.innerText = PROJECT_CONFIG.headerTitle;
    if (hSub) hSub.innerText = PROJECT_CONFIG.headerSubtitle;

    // Render cột chú thích Loại đất
    const typesContainer = document.getElementById('legend-types');
    if (typesContainer) {
        typesContainer.innerHTML = PROJECT_CONFIG.legendTypes.map(item => 
            `<div class="legend-item"><span class="color-box" style="background: ${item.color};"></span> ${item.label}</div>`
        ).join('');
    }

    // Render cột chú thích Trạng thái
    const statusContainer = document.getElementById('legend-statuses');
    if (statusContainer) {
        statusContainer.innerHTML = PROJECT_CONFIG.legendStatuses.map(item => 
            `<div class="legend-item"><span class="color-box" style="background: ${item.color};"></span> ${item.label}</div>`
        ).join('');
    }

    // Gắn sự kiện nút Zalo
    const zaloBtn = document.getElementById('smart-zalo-btn');
    if (zaloBtn) {
        zaloBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const phoneNumber = PROJECT_CONFIG.zaloPhone;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = "https://zalo.me/" + phoneNumber;
            } else {
                window.location.href = "zalo://conversation?phone=" + phoneNumber;
                setTimeout(function() {
                    window.open("https://zalo.me/" + phoneNumber, "_blank");
                }, 500);
            }
        });
    }
}

/**
 * HÀM TỰ ĐỘNG CHUẨN HÓA FILE SVG MỚI XUẤT TỪ ILLUSTRATOR / CAD
 * Không cần sửa tay file map.svg: Tự thêm id="map-svg", width/height 100% và chèn ảnh nền khớp viewBox
 */
function prepareSvgAndBackground(wrapper) {
    const svg = wrapper.querySelector('svg');
    if (!svg) return 1920;

    svg.setAttribute('id', 'map-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // Đọc kích thước hệ tọa độ từ viewBox (hoặc fallback sang width/height gốc)
    let vbX = 0, vbY = 0, vbW = 1920, vbH = 1080;
    const viewBoxAttr = svg.getAttribute('viewBox');
    if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/[\s,]+/).map(parseFloat);
        if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
            [vbX, vbY, vbW, vbH] = parts;
        }
    } else {
        vbW = parseFloat(svg.getAttribute('width')) || 1920;
        vbH = parseFloat(svg.getAttribute('height')) || 1080;
        svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
    }

    // Kiểm tra xem trong SVG đã có thẻ <image> nền chưa
    if (PROJECT_CONFIG.bgImagePath) {
        let bgImg = svg.querySelector('image');
        if (!bgImg) {
            bgImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
            // Chèn ảnh nền vào ngay trước thẻ <g> đầu tiên (để nằm dưới tất cả các lô đất)
            const firstGroup = svg.querySelector('g, path, rect, polygon');
            if (firstGroup) {
                svg.insertBefore(bgImg, firstGroup);
            } else {
                svg.appendChild(bgImg);
            }
        }
        bgImg.setAttribute('href', PROJECT_CONFIG.bgImagePath);
        bgImg.setAttribute('x', vbX);
        bgImg.setAttribute('y', vbY);
        bgImg.setAttribute('width', vbW);
        bgImg.setAttribute('height', vbH);
        bgImg.setAttribute('preserveAspectRatio', 'none');
        bgImg.setAttribute('image-rendering', 'optimizeQuality');
    }

    return vbW;
}

/**
 * HÀM XỬ LÝ BẢN ĐỒ: TÍNH GÓC XOay, TÔ MÀU TRẠNG THÁI & GẮN SỰ KIỆN CLICK
 */
function initMap(svgViewBoxWidth) {
    const lotElements = document.querySelectorAll('svg g[id]');
    const lotMetrics = {};

    // Tính cỡ chữ chuẩn theo tỷ lệ khổ bản vẽ (Mặc định khổ 1920px tương ứng 4px)
    const dynamicFontSize = ((svgViewBoxWidth || 1920) / 1920) * 4;

    // ==========================================
    // BƯỚC 1: QUÉT TẤT CẢ ĐỂ TÍNH GÓC THÔ, TỌA ĐỘ VÀ TÔ MÀU
    // ==========================================
    lotElements.forEach(lot => {
        const id = lot.id.trim();
        if (!dataBDS[id]) return;

        lot.classList.add('lot-interactive');
        const allShapes = lot.querySelectorAll('rect, polygon, path, polyline, line');
        if (allShapes.length === 0) return;

        const info = dataBDS[id];
        const rawStatus = info.TrangThai || info.TINHTRANGKD || "";
        
        // --- XỬ LÝ TÔ MÀU THEO TRẠNG THÁI BÁN HÀNG ---
        if (rawStatus) {
            const trangThai = rawStatus.trim().toLowerCase();
            let fillColor = "";

            if (trangThai === "đã bán") {
                fillColor = "#7f8c8d"; // Màu Xám
            } else if (trangThai === "đặt cọc") {
                fillColor = "#f1c40f"; // Màu Vàng
            } else if (trangThai === "giữ chỗ") {
                fillColor = "#e74c3c"; // Màu Đỏ
            } // "Đang bán" hoặc "Chưa có thông tin" giữ nguyên màu gốc của loại đất trên SVG

            if (fillColor !== "") {
                allShapes.forEach(shape => {
                    shape.style.fill = fillColor; 
                    shape.style.opacity = "0.85";  
                });
            }
        }

        let bestAngle = 0;
        let maxEdgeWeight = 0;

        // Tính góc nội tại dựa trên cạnh dài nhất
        allShapes.forEach(shape => {
            let tagName = shape.tagName.toLowerCase();
            let intrinsicAngle = 0;
            let weight = 0;

            if (tagName === 'rect') {
                const w = parseFloat(shape.getAttribute('width') || 0);
                const h = parseFloat(shape.getAttribute('height') || 0);
                intrinsicAngle = (h > w) ? -90 : 0;
                weight = Math.max(w, h);
            } else {
                let points = [];
                if (tagName === 'line') {
                    points.push({x: parseFloat(shape.getAttribute('x1')), y: parseFloat(shape.getAttribute('y1'))});
                    points.push({x: parseFloat(shape.getAttribute('x2')), y: parseFloat(shape.getAttribute('y2'))});
                } else if (tagName === 'polygon' || tagName === 'polyline') {
                    const ptsStr = shape.getAttribute('points');
                    if (ptsStr) {
                        const coords = ptsStr.trim().split(/[\s,]+/).map(parseFloat);
                        for (let i = 0; i < coords.length; i += 2) {
                            if (!isNaN(coords[i]) && !isNaN(coords[i+1])) points.push({x: coords[i], y: coords[i+1]});
                        }
                        if (tagName === 'polygon' && points.length > 0) points.push(points[0]);
                    }
                } else if (tagName === 'path') {
                    const d = shape.getAttribute('d');
                    if (d) {
                        const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
                        if (coords) {
                            for (let i = 0; i < coords.length; i += 2) {
                                if (!isNaN(coords[i]) && !isNaN(coords[i+1])) points.push({x: parseFloat(coords[i]), y: parseFloat(coords[i+1])});
                            }
                        }
                    }
                }

                let maxLen = 0;
                for (let i = 0; i < points.length - 1; i++) {
                    let dx = points[i+1].x - points[i].x;
                    let dy = points[i+1].y - points[i].y;
                    let len = Math.sqrt(dx*dx + dy*dy);
                    if (len > maxLen) {
                        maxLen = len;
                        intrinsicAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                    }
                }
                weight = maxLen;
            }

            // Cộng dồn Transform từ file SVG xuất ra
            let accRot = 0;
            let curr = shape;
            while (curr && curr !== lot.parentNode) {
                let tf = curr.getAttribute('transform');
                if (tf) {
                    let rMatch = tf.match(/rotate\(([-0-9.]+)/);
                    if (rMatch) accRot += parseFloat(rMatch[1]);
                    
                    let mMatch = tf.match(/matrix\(([^)]+)\)/);
                    if (mMatch) {
                        let vals = mMatch[1].split(/[\s,]+/).map(parseFloat);
                        if (vals.length >= 4) accRot += Math.atan2(vals[1], vals[0]) * (180 / Math.PI);
                    }
                }
                curr = curr.parentNode;
            }

            if (weight > maxEdgeWeight) {
                maxEdgeWeight = weight;
                bestAngle = intrinsicAngle + accRot;
            }
        });

        const bbox = lot.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        const prefixMatch = id.match(/^([a-zA-Z0-9]+)-/);
        const prefix = prefixMatch ? prefixMatch[1] : "UNKNOWN";

        lotMetrics[id] = {
            element: lot,
            angle: bestAngle,
            finalAngle: bestAngle, 
            centerX: centerX,
            centerY: centerY,
            prefix: prefix
        };
    });

    // ==========================================
    // BƯỚC 2: ĐỒNG THUẬN NHÓM THÔNG MINH
    // ==========================================
    const groups = {};
    for (let id in lotMetrics) {
        let p = lotMetrics[id].prefix;
        if (!groups[p]) groups[p] = [];
        groups[p].push(lotMetrics[id]);
    }

    for (let p in groups) {
        let siblings = groups[p];
        if (siblings.length < 2) continue;

        let angles = siblings.map(s => s.angle % 180);
        let bins = {};
        angles.forEach(a => {
            let bin = Math.round(a / 30) * 30;
            bins[bin] = (bins[bin] || 0) + 1;
        });
        let targetAngle = parseInt(Object.keys(bins).reduce((a, b) => bins[a] > bins[b] ? a : b));

        siblings.forEach(lot => {
            const info = dataBDS[lot.element.id];
            if (info && info.GocXoay !== undefined && info.GocXoay !== "" && info.GocXoay !== "-") {
                let manualAngle = parseFloat(info.GocXoay);
                if (!isNaN(manualAngle)) {
                    lot.finalAngle = manualAngle;
                    return; 
                }
            }

            let diff = Math.abs((lot.angle % 180) - targetAngle);
            if (diff > 90) diff = Math.abs(diff - 180);

            if (diff <= 25 || diff >= 65) {
                let final = lot.angle % 180;
                if (final > 90) final -= 180;
                if (final <= -90) final += 180;
                lot.finalAngle = final;
            } else {
                let final = targetAngle % 180;
                if (final > 90) final -= 180;
                if (final <= -90) final += 180;
                lot.finalAngle = final;
            }
        });
    }

    // ==========================================
    // BƯỚC 3: VẼ NHÃN VÀ GẮN SỰ KIỆN CLICK
    // ==========================================
    for (let id in lotMetrics) {
        let lot = lotMetrics[id];
        const info = dataBDS[id];

        const textLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textLabel.setAttribute("x", lot.centerX);
        textLabel.setAttribute("y", lot.centerY);
        textLabel.setAttribute("text-anchor", "middle");
        textLabel.setAttribute("dominant-baseline", "central");
        textLabel.setAttribute("class", "lot-label");
        textLabel.style.fontSize = `${dynamicFontSize}px`;
        textLabel.setAttribute("transform", `rotate(${lot.finalAngle} ${lot.centerX} ${lot.centerY})`);
        textLabel.textContent = id; 
        lot.element.appendChild(textLabel);

        // Sự kiện Click xem bảng thông tin
        lot.element.addEventListener('click', function(e) {
            document.getElementById('malo').innerText = "Lô: " + id;
            
            const statusEl = document.getElementById('trangThai');
            const trangThaiText = info.TrangThai || info.TINHTRANGKD || "Đang cập nhật";
            statusEl.innerText = trangThaiText; 
            
            const trangThaiLower = trangThaiText.trim().toLowerCase();
            if (trangThaiLower === "đang bán") {
                statusEl.style.color = "#27ae60";
            } else if (trangThaiLower === "đặt cọc") {
                statusEl.style.color = "#f39c12";
            } else if (trangThaiLower === "giữ chỗ") {
                statusEl.style.color = "#e74c3c";
            } else if (trangThaiLower === "đã bán") {
                statusEl.style.color = "#7f8c8d";
            } else {
                statusEl.style.color = "#34495e";
            }

            // Hỗ trợ cả Key chuẩn hóa mới (PhanLoai) và Key cũ (Loai / MAUTK)
            const rawLoai = info.PhanLoai || info.Loai || info.MAUTK || "-";
            let displayLoai = rawLoai;
            if (/^M\d+/i.test(rawLoai)) {
                if (id.toUpperCase().startsWith("BT")) displayLoai = `Biệt thự (${rawLoai})`;
                else if (id.toUpperCase().startsWith("LK")) displayLoai = `Liền kề (${rawLoai})`;
            }
            document.getElementById('loai').innerText = displayLoai;
            document.getElementById('dientich').innerText = info.DienTichLo || info.DT || "-";
            
            const constructInfo = document.getElementById('construction-info');
            
            if (rawLoai.toLowerCase() === "đất nền") {
                constructInfo.style.display = "none";
            } else {
                constructInfo.style.display = "block";
                document.getElementById('sotang').innerText = info.ChieuCao || info.TANGCAO || "-";
                document.getElementById('dtxd').innerText = info.DienTichXD || info.DTXD || "-";
                document.getElementById('matdo').innerText = info.MatDo || info.MATDOXD || "-";
                document.getElementById('t1').innerText = info.Tang1 || info.DTSANT1 || "-";
                document.getElementById('t2').innerText = info.Tang2 || info.DTSANT2 || "-";
                document.getElementById('t3').innerText = info.Tang3 || info.DTSANT3 || "-";
                document.getElementById('t4').innerText = info.Tang4 || info.DTSANT4 || "-";
                document.getElementById('tongSan').innerText = info.TongSanXD || info.TONGSANXD || "-";
            }

            infoBox.style.display = "block";
            if (window.innerWidth <= 768) {
                infoBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            e.stopPropagation(); 
        });
    }
}

// Đóng popup khi click ra ngoài
document.addEventListener('click', function() { infoBox.style.display = "none"; });
infoBox.addEventListener('click', function(e) { e.stopPropagation(); });

// Hàm khởi tạo Zoom
function initZoom() {
    var eventsHandler = {
        haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
        init: function(options) {
            var instance = options.instance, initialScale = 1, pannedX = 0, pannedY = 0;
            this.hammer = new Hammer(options.svgElement, { 
                recognizers: [ [Hammer.Pan, {direction: Hammer.DIRECTION_ALL}], [Hammer.Pinch, {enable: true}] ] 
            });
            this.hammer.on('panstart panmove', function(ev){
                if (ev.type === 'panstart') { pannedX = 0; pannedY = 0; }
                instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY});
                pannedX = ev.deltaX; pannedY = ev.deltaY;
            });
            this.hammer.on('pinchstart pinchmove', function(ev){
                if (ev.type === 'pinchstart') { initialScale = instance.getZoom(); }
                instance.zoomAtPoint(initialScale * ev.scale, {x: ev.center.x, y: ev.center.y});
            });
        },
        destroy: function(){ this.hammer.destroy(); }
    };

    svgPanZoom('#map-svg', {
        zoomEnabled: true,
        controlIconsEnabled: true, 
        fit: true,                 
        center: true,              
        minZoom: 0.5,
        maxZoom: 10,
        mouseWheelZoomEnabled: true, 
        preventMouseEventsDefault: false, 
        customEventsHandler: eventsHandler 
    });
}