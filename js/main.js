/**
 * =========================================================================
 * KHỐI CẤU HÌNH TRUNG TÂM (CHỈ CẦN SỬA TẠI ĐÂY CHO MỌI DỰ ÁN VỀ SAU)
 * =========================================================================
 */
const PROJECT_CONFIG = {
    // 1. Tiêu đề hiển thị
    pageTitle: "Vàng Cao Xá - Serenity City",
    headerTitle: "QUẢN LÝ THÔNG TIN QUỸ ĐẤT DỰ ÁN",
    headerSubtitle: "Khu dân cư Vàng Cao Xá - Serenity City",

    // 2. Đường dẫn Dữ liệu & Bản đồ
    scriptUrl: "https://script.google.com/macros/s/AKfycbwGbmlJkh0tNn2bkduTtwBdnOobT_lFuEv26ytIZHI5fpEXTSYtIZyTD_Jddkmsakg/exec", // Thay link API của dự án
    svgPath: "assets/svg/map.svg",
    bgImagePath: "assets/images/bg_vangcaoxa.jpg",

    // 3. Số điện thoại Zalo nhận liên hệ
    zaloPhone: "0858290389",

    // 4. Quản lý đối tượng LOẠI ĐẤT (Tự động tạo Chú thích, ghép tên Popup & tô màu SVG nếu cần)
    // - prefix: Ký hiệu đầu của Mã lô (VD: "LK", "BT", "SH", "HH", "NV"...)
    // - name: Tên ngắn gọn để ghép với Mã thiết kế trong Popup (VD: "Liền kề (M24)")
    // - label: Tên đầy đủ hiển thị ở Bảng chú thích góc dưới
    // - color: Mã màu đại diện
    // - autoFillSvg: Để false nếu file SVG đã tô màu sẵn từ AI; để true nếu muốn Web tự tô màu lô đất theo loại!
    landTypes: [
        { 
            prefix: "LK", 
            keywords: ["liền kề", "lien ke"], 
            name: "Liền kề", 
            label: "Đất ở liền kề", 
            color: "#00aeef", 
            autoFillSvg: false,
            showInLegend: true
        },
        { 
            prefix: "BT", 
            keywords: ["biệt thự", "biet thu"], 
            name: "Biệt thự", 
            label: "Đất ở biệt thự", 
            color: "#4caf50", // Màu xanh lá khớp với ảnh thực tế Vàng Cao Xá
            autoFillSvg: false,
            showInLegend: true
        }
        // Ví dụ khi dự án mới có thêm Shophouse hoặc Đất nền, chỉ cần bỏ comment dòng dưới:
        // { prefix: "SH", keywords: ["shophouse", "thương mại"], name: "Shophouse", label: "Nhà phố thương mại", color: "#9b59b6", autoFillSvg: false, showInLegend: true },
    ],

    // 5. Quản lý đối tượng TÌNH TRẠNG BÁN HÀNG (Tự động tô màu Bản đồ, Popup & Chú thích)
    // - keywords: Các cụm từ có thể xuất hiện trong cột Trạng thái trên Google Sheet (không phân biệt hoa/thường)
    // - label: Tên hiển thị trên Bảng chú thích
    // - mapColor: Màu tô đè lên lô đất trên bản đồ (Để null nếu muốn giữ nguyên màu gốc của Loại đất)
    // - textColor: Màu chữ của dòng Tình trạng bên trong bảng Popup
    // - showInLegend: true = hiển thị ô màu ở Bảng chú thích; false = ẩn khỏi Bảng chú thích
    salesStatuses: [
        { 
            keywords: ["đang bán", "dang ban", "mở bán", "còn trống"], 
            label: "Đang bán", 
            mapColor: null,         // Giữ nguyên màu của Loại đất (Xanh dương / Xanh lá)
            textColor: "#27ae60",   // Chữ màu xanh lá nổi bật trong Popup
            showInLegend: false 
        },
        { 
            keywords: ["đã bán", "da ban"], 
            label: "Đã bán", 
            mapColor: "#7f8c8d",    // Tô màu Xám lên bản đồ
            textColor: "#7f8c8d", 
            showInLegend: true 
        },
        { 
            keywords: ["đặt cọc", "dat coc", "đang cọc"], 
            label: "Đặt cọc", 
            mapColor: "#f1c40f",    // Tô màu Vàng lên bản đồ
            textColor: "#f39c12", 
            showInLegend: true 
        },
        { 
            keywords: ["giữ chỗ", "giu cho", "lock"], 
            label: "Giữ chỗ", 
            mapColor: "#e74c3c",    // Tô màu Đỏ lên bản đồ
            textColor: "#e74c3c", 
            showInLegend: false 
        },
        { 
            keywords: ["chưa có thông tin", "chưa mở bán", "đang cập nhật"], 
            label: "Chưa có thông tin", 
            mapColor: null,         // Giữ nguyên màu gốc của Loại đất
            textColor: "#7f8c8d", 
            showInLegend: false 
        }
    ]
};

let dataBDS = {}; 
const infoBox = document.getElementById('info-box');

// Khởi tạo giao diện tĩnh (Tiêu đề, Bảng chú thích, Nút Zalo)
initStaticUI();

// Tải ĐỒNG THỜI file SVG và dữ liệu JSON từ Google Sheets
Promise.all([
    fetch(PROJECT_CONFIG.svgPath).then(response => {
        if (!response.ok) throw new Error("Không tìm thấy file SVG: " + PROJECT_CONFIG.svgPath);
        return response.text();
    }),
    fetch(PROJECT_CONFIG.scriptUrl).then(response => response.json())
])
.then(([svgContent, data]) => {
    const wrapper = document.getElementById('map-wrapper');
    wrapper.innerHTML = svgContent;
    
    // Tự động chuẩn hóa SVG và lồng ảnh nền khớp viewBox
    const svgViewBoxWidth = prepareSvgAndBackground(wrapper);

    dataBDS = data; 
    console.log("Đã tải dữ liệu và bản đồ thành công!");
    
    initMap(svgViewBoxWidth);      
    initZoom();     
})
.catch(error => {
    console.error("Lỗi khởi tạo:", error);
    alert("Không thể tải dữ liệu hoặc bản đồ. Vui lòng kiểm tra lại đường dẫn file SVG hoặc link Apps Script!");
});

/**
 * HÀM KHỞI TẠO TIÊU ĐỀ, BẢNG CHÚ THÍCH ĐỘNG & NÚT ZALO TỪ PROJECT_CONFIG
 */
function initStaticUI() {
    document.title = PROJECT_CONFIG.pageTitle;
    const hTitle = document.getElementById('header-title');
    const hSub = document.getElementById('header-subtitle');
    if (hTitle) hTitle.innerText = PROJECT_CONFIG.headerTitle;
    if (hSub) hSub.innerText = PROJECT_CONFIG.headerSubtitle;

    // 1. Render cột chú thích Loại đất (Từ PROJECT_CONFIG.landTypes)
    const typesContainer = document.getElementById('legend-types');
    const fallbackLegendGrid = document.querySelector('.legend-grid');
    
    const typesHtml = PROJECT_CONFIG.landTypes
        .filter(item => item.showInLegend !== false)
        .map(item => `<div class="legend-item"><span class="color-box" style="background: ${item.color};"></span> ${item.label}</div>`)
        .join('');

    const statusHtml = PROJECT_CONFIG.salesStatuses
        .filter(item => item.showInLegend !== false && item.mapColor)
        .map(item => `<div class="legend-item"><span class="color-box" style="background: ${item.mapColor};"></span> ${item.label}</div>`)
        .join('');

    if (typesContainer && document.getElementById('legend-statuses')) {
        typesContainer.innerHTML = typesHtml;
        document.getElementById('legend-statuses').innerHTML = statusHtml;
    } else if (fallbackLegendGrid) {
        // Tương thích ngược nếu file index.html cũ chưa đặt id="legend-types"
        fallbackLegendGrid.innerHTML = `
            <div class="legend-col">${typesHtml}</div>
            <div class="legend-col">${statusHtml}</div>
        `;
    }

    // 2. Gắn sự kiện nút Zalo
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
 * HÀM TỰ ĐỘNG CHUẨN HÓA FILE SVG & LỒNG ẢNH NỀN
 */
function prepareSvgAndBackground(wrapper) {
    const svg = wrapper.querySelector('svg');
    if (!svg) return 1920;

    svg.setAttribute('id', 'map-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

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

    if (PROJECT_CONFIG.bgImagePath) {
        let bgImg = svg.querySelector('image');
        if (!bgImg) {
            bgImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
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
 * HÀM HỖ TRỢ 1: TÌM ĐỐI TƯỢNG LOẠI ĐẤT TỪ MÃ LÔ HOẶC CỘT PHÂN LOẠI
 */
function matchLandType(id, rawLoaiText) {
    const idUpper = (id || "").toUpperCase();
    const loaiLower = (rawLoaiText || "").toLowerCase();

    // Ưu tiên 1: Khớp theo tiền tố mã lô (VD: LK04-04 -> khớp prefix "LK")
    let matched = PROJECT_CONFIG.landTypes.find(t => t.prefix && idUpper.startsWith(t.prefix.toUpperCase()));
    if (matched) return matched;

    // Ưu tiên 2: Khớp theo từ khóa trong cột Loại đất
    matched = PROJECT_CONFIG.landTypes.find(t => 
        t.keywords && t.keywords.some(k => loaiLower.includes(k.toLowerCase()))
    );
    return matched || null;
}

/**
 * HÀM HỖ TRỢ 2: TÌM ĐỐI TƯỢNG TÌNH TRẠNG BÁN HÀNG
 */
function matchSalesStatus(rawStatusText) {
    if (!rawStatusText) return null;
    const statusLower = rawStatusText.toString().trim().toLowerCase();
    return PROJECT_CONFIG.salesStatuses.find(s => 
        s.keywords && s.keywords.some(k => statusLower === k.toLowerCase() || statusLower.includes(k.toLowerCase()))
    ) || null;
}

/**
 * HÀM HỖ TRỢ 3: KIỂM TRA GIÁ TRỊ TRỐNG HOẶC BẰNG 0 (DÙNG ĐỂ ẨN TẦNG KHÔNG CÓ)
 */
function isEmptyOrZero(val) {
    if (val === null || val === undefined) return true;
    const str = val.toString().trim();
    if (str === "" || str === "-") return true;

    // Bóc tách bỏ các đơn vị ở cuối (m2, %, tầng, tỷ) để kiểm tra con số thực tế
    const numStr = str.replace(/\s*(m2|m²|%|tầng|tang|tỷ|ty)\s*$/i, '').replace(/,/g, '.').trim();
    const num = parseFloat(numStr);
    if (!isNaN(num) && num === 0) return true;

    return false;
}

/**
 * HÀM HỖ TRỢ 4: CẬP NHẬT DÒNG THÔNG TIN TRONG POPUP & TỰ ĐỘNG ẨN NẾU BẰNG 0 / TRỐNG
 */
function updateInfoRow(elementId, rawValue, defaultUnit = "") {
    const el = document.getElementById(elementId);
    if (!el) return false;
    const row = el.closest('.info-row');

    if (isEmptyOrZero(rawValue)) {
        if (row) row.style.display = "none"; // Ẩn hoàn toàn dòng này nếu không có dữ liệu hoặc = 0
        return false;
    }

    let displayVal = rawValue.toString().trim();
    // Nếu có truyền defaultUnit (VD: "tầng" hoặc "m2") mà dữ liệu chỉ là con số thuần túy, tự gắn thêm đơn vị
    if (defaultUnit && !displayVal.toLowerCase().endsWith(defaultUnit.toLowerCase())) {
        const numericTest = displayVal.replace(/,/g, '.');
        if (!isNaN(Number(numericTest))) {
            displayVal = `${displayVal} ${defaultUnit}`;
        }
    }

    el.innerText = displayVal;
    if (row) row.style.display = "flex"; // Hiện lại dòng nếu có dữ liệu hợp lệ
    return true;
}

/**
 * HÀM XỬ LÝ BẢN ĐỒ CHÍNH
 */
function initMap(svgViewBoxWidth) {
    const lotElements = document.querySelectorAll('svg g[id]');
    const lotMetrics = {};
    const dynamicFontSize = ((svgViewBoxWidth || 1920) / 1920) * 4;

    // ==========================================
    // BƯỚC 1: QUÉT TẤT CẢ ĐỂ TÔ MÀU THEO ĐỐI TƯỢNG & TÍNH GÓC XOAY
    // ==========================================
    lotElements.forEach(lot => {
        const id = lot.id.trim();
        if (!dataBDS[id]) return;

        lot.classList.add('lot-interactive');
        const allShapes = lot.querySelectorAll('rect, polygon, path, polyline, line');
        if (allShapes.length === 0) return;

        const info = dataBDS[id];
        const rawLoai = info.PhanLoai || info.Loai || info.MAUTK || "";
        const rawStatus = info.TrangThai || info.TINHTRANGKD || "";

        const landTypeObj = matchLandType(id, rawLoai);
        const statusObj = matchSalesStatus(rawStatus);

        // 1A. Tô màu theo Loại đất (nếu bật autoFillSvg: true trong PROJECT_CONFIG)
        if (landTypeObj && landTypeObj.autoFillSvg && landTypeObj.color) {
            allShapes.forEach(shape => {
                shape.style.fill = landTypeObj.color;
            });
        }

        // 1B. Tô màu đè lên theo Tình trạng bán hàng (nếu trạng thái có cấu hình mapColor)
        if (statusObj && statusObj.mapColor) {
            allShapes.forEach(shape => {
                shape.style.fill = statusObj.mapColor; 
                shape.style.opacity = "0.85";  
            });
        }

        let bestAngle = 0;
        let maxEdgeWeight = 0;

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
    // BƯỚC 2: ĐỒNG THUẬN GÓC XOAY NHÓM THÔNG MINH
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
    // BƯỚC 3: VẼ NHÃN MÃ LÔ VÀ GẮN SỰ KIỆN CLICK POPUP
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

        // Sự kiện Click hiển thị bảng thông tin
        lot.element.addEventListener('click', function(e) {
            document.getElementById('malo').innerText = "Lô: " + id;
            
            // 1. Hiển thị Tình trạng bán hàng & Màu chữ theo cấu hình
            const statusEl = document.getElementById('trangThai');
            const trangThaiText = info.TrangThai || info.TINHTRANGKD || "Đang cập nhật";
            const statusObj = matchSalesStatus(trangThaiText);

            statusEl.innerText = trangThaiText;
            statusEl.style.color = (statusObj && statusObj.textColor) ? statusObj.textColor : "#34495e";

            // 2. Hiển thị Loại đất / Mẫu thiết kế theo cấu hình
            const rawLoai = info.PhanLoai || info.Loai || info.MAUTK || "-";
            const landTypeObj = matchLandType(id, rawLoai);
            let displayLoai = rawLoai;

            if (landTypeObj && landTypeObj.name) {
                if (rawLoai === "-" || rawLoai === "") {
                    displayLoai = landTypeObj.name;
                } else if (!rawLoai.toLowerCase().includes(landTypeObj.name.toLowerCase())) {
                    displayLoai = `${landTypeObj.name} (${rawLoai})`;
                }
            }
            document.getElementById('loai').innerText = displayLoai;

            // 3. Hiển thị Diện tích lô đất
            document.getElementById('dientich').innerText = info.DienTichLo || info.DT || "-";
            
            // 4. Kiểm tra và hiển thị thông tin xây dựng + Tự động ẩn các tầng trống / bằng 0
            const constructInfo = document.getElementById('construction-info');
            const isDatNen = rawLoai.toLowerCase() === "đất nền";

            if (isDatNen) {
                constructInfo.style.display = "none";
            } else {
                // Tự động gắn đơn vị "tầng" cho Chiều cao nếu dữ liệu trả về chỉ có con số (VD: "4" -> "4 tầng")
                const hasChieuCao = updateInfoRow('sotang', info.ChieuCao || info.TANGCAO, "tầng");
                const hasDtxd     = updateInfoRow('dtxd', info.DienTichXD || info.DTXD, "m2");
                const hasMatDo    = updateInfoRow('matdo', info.MatDo || info.MATDOXD, "%");

                // Tự động ẩn bất kỳ tầng nào có giá trị trống, "-" hoặc bằng 0 (VD: nhà 3 tầng sẽ tự ẩn Tầng 4)
                const hasT1 = updateInfoRow('t1', info.Tang1 || info.DTSANT1, "m2");
                const hasT2 = updateInfoRow('t2', info.Tang2 || info.DTSANT2, "m2");
                const hasT3 = updateInfoRow('t3', info.Tang3 || info.DTSANT3, "m2");
                const hasT4 = updateInfoRow('t4', info.Tang4 || info.DTSANT4 || info.Tang4_Tum, "m2");
                const hasT5 = updateInfoRow('t5', info.Tang5 || info.DTSANT5, "m2"); // Dự phòng nếu index.html có thêm id="t5"
                const hasTongSan = updateInfoRow('tongSan', info.TongSanXD || info.TONGSANXD, "m2");

                // Ẩn cụm chi tiết sàn nếu tất cả các tầng đều bằng 0
                const floorDetails = document.getElementById('floor-details');
                const floorTitle = constructInfo.querySelector('.floor-title');
                const floorHr = constructInfo.querySelector('hr');
                const anyFloorVisible = hasT1 || hasT2 || hasT3 || hasT4 || hasT5 || hasTongSan;

                if (floorDetails) floorDetails.style.display = anyFloorVisible ? "block" : "none";
                if (floorTitle) floorTitle.style.display = anyFloorVisible ? "block" : "none";
                if (floorHr) floorHr.style.display = anyFloorVisible ? "block" : "none";

                // Nếu toàn bộ thông số xây dựng đều trống/bằng 0 thì ẩn cả khối xây dựng
                constructInfo.style.display = (hasChieuCao || hasDtxd || hasMatDo || anyFloorVisible) ? "block" : "none";
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
