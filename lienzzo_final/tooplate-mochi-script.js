
// Lienzzo web — navegación, catálogo dinámico, carrusel, carrito y opiniones por WhatsApp

const WHATSAPP_NUMBER = '525615809420';
const INSTAGRAM_URL = 'https://www.instagram.com/hola_somos_lienzzo?igsh=MWwzb2FvcDVydHdj';

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// Mobile Menu functionality
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');

function openMobileMenu() {
    mobileMenuBtn?.classList.add('active');
    mobileMenu?.classList.add('active');
    mobileOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
    mobileMenuBtn?.classList.remove('active');
    mobileMenu?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
}
mobileMenuBtn?.addEventListener('click', () => mobileMenu?.classList.contains('active') ? closeMobileMenu() : openMobileMenu());
mobileOverlay?.addEventListener('click', closeMobileMenu);

// Smooth scroll for anchor links
document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeMobileMenu();
});

// Helpers
function formatPrice(price) {
    return typeof price === 'number' ? `$${price.toLocaleString('es-MX')} MXN` : 'Precio por confirmar';
}
function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function getProductById(id) {
    return (window.LIENZZO_PRODUCTS || []).find(product => product.id === id);
}
function stockText(product) {
    if (typeof product.stock !== 'number') return 'Consultar disponibilidad';
    if (product.stock <= 0) return 'Agotado';
    if (product.stock <= 3) return `Quedan ${product.stock}`;
    return `${product.stock} disponibles`;
}
function stockClass(product) {
    if (typeof product.stock !== 'number') return 'stock-check';
    if (product.stock <= 0) return 'stock-out';
    if (product.stock <= 3) return 'stock-low';
    return 'stock-ok';
}

// Catálogo dinámico
(function initCatalog() {
    const products = window.LIENZZO_PRODUCTS || [];
    const catalogGrid = document.getElementById('catalogGrid');
    const catalogFilters = document.getElementById('catalogFilters');
    const productSearch = document.getElementById('productSearch');

    if (!catalogGrid || !products.length) return;

    let activeCategory = 'Todos';
    const categories = ['Todos', ...new Set(products.map(product => product.categoria))];

    function renderFilters() {
        catalogFilters.innerHTML = categories.map(category => `
            <button class="filter-btn ${category === activeCategory ? 'active' : ''}" type="button" data-category="${category}">
                ${category}
            </button>
        `).join('');
    }

    function renderProducts() {
        const query = normalizeText(productSearch?.value || '');
        const visibleProducts = products.filter(product => {
            const categoryMatch = activeCategory === 'Todos' || product.categoria === activeCategory;
            const text = normalizeText(`${product.nombre} ${product.categoria} ${product.descripcion} ${product.etiqueta}`);
            return categoryMatch && (!query || text.includes(query));
        });

        catalogGrid.innerHTML = visibleProducts.map(product => {
            const img = product.imagenes?.[0] || 'images/logo-lienzzo.jpg';
            const isOut = typeof product.stock === 'number' && product.stock <= 0;
            return `
                <article class="catalogo-card reveal active product-card ${isOut ? 'product-out' : ''}" data-product-id="${product.id}">
                    <button class="favorite-btn" type="button" data-action="favorite" data-product-id="${product.id}" aria-label="Agregar a favoritos">♡</button>
                    <div class="product-image-wrap" data-action="open-product" data-product-id="${product.id}">
                        <img src="${img}" alt="${product.nombre}">
                        <span class="product-zoom"><img src="images/icons/zoom.png" alt=""> Ver detalles</span>
                    </div>
                    <div class="catalogo-info">
                        <span class="catalogo-tag">${product.etiqueta || product.categoria}</span>
                        <h3>${product.nombre}</h3>
                        <p>${product.descripcion}</p>
                        <div class="product-meta">
                            <span class="catalogo-price">${formatPrice(product.precio)}</span>
                            <span class="stock-pill ${stockClass(product)}">${stockText(product)}</span>
                        </div>
                        <div class="catalogo-actions">
                            <button class="btn-catalogo add-to-cart" type="button" data-product-id="${product.id}" ${isOut ? 'disabled' : ''}>
                                ${isOut ? 'Agotado' : 'Agregar al carrito'}
                            </button>
                            <button class="btn-details" type="button" data-action="open-product" data-product-id="${product.id}">Ver carrusel</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        if (!visibleProducts.length) {
            catalogGrid.innerHTML = `<div class="catalog-empty">No encontré productos con esa búsqueda. Prueba con otra palabra.</div>`;
        }
    }

    renderFilters();
    renderProducts();

    catalogFilters?.addEventListener('click', (event) => {
        const button = event.target.closest('.filter-btn');
        if (!button) return;
        activeCategory = button.dataset.category;
        renderFilters();
        renderProducts();
    });

    productSearch?.addEventListener('input', renderProducts);
})();

// Modal de producto con carrusel
(function initProductModal() {
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('productModalOverlay');
    const closeBtn = document.getElementById('productModalClose');
    const imgEl = document.getElementById('modalProductImage');
    const thumbsEl = document.getElementById('galleryThumbs');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    const categoryEl = document.getElementById('modalProductCategory');
    const nameEl = document.getElementById('modalProductName');
    const priceEl = document.getElementById('modalProductPrice');
    const stockEl = document.getElementById('modalProductStock');
    const descriptionEl = document.getElementById('modalProductDescription');
    const addBtn = document.getElementById('modalAddToCart');
    const whatsappBtn = document.getElementById('modalWhatsApp');

    if (!modal || !imgEl) return;

    let currentProduct = null;
    let currentImageIndex = 0;

    function renderImage() {
        const images = currentProduct?.imagenes || [];
        const image = images[currentImageIndex] || 'images/logo-lienzzo.jpg';
        imgEl.src = image;
        imgEl.alt = currentProduct?.nombre || 'Producto Lienzzo';
        thumbsEl.innerHTML = images.map((src, index) => `
            <button class="gallery-thumb ${index === currentImageIndex ? 'active' : ''}" type="button" data-index="${index}">
                <img src="${src}" alt="${currentProduct.nombre} ${index + 1}">
            </button>
        `).join('');
    }

    function openProduct(product) {
        currentProduct = product;
        currentImageIndex = 0;
        categoryEl.textContent = product.categoria;
        nameEl.textContent = product.nombre;
        priceEl.textContent = formatPrice(product.precio);
        stockEl.textContent = stockText(product);
        stockEl.className = `modal-stock ${stockClass(product)}`;
        descriptionEl.textContent = product.descripcion;
        const isOut = typeof product.stock === 'number' && product.stock <= 0;
        addBtn.disabled = isOut;
        addBtn.textContent = isOut ? 'Agotado' : 'Agregar al carrito';
        whatsappBtn.href = buildProductWhatsAppUrl(product);
        renderImage();
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeProduct() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function moveImage(direction) {
        if (!currentProduct?.imagenes?.length) return;
        currentImageIndex = (currentImageIndex + direction + currentProduct.imagenes.length) % currentProduct.imagenes.length;
        renderImage();
    }

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-action="open-product"]');
        if (!trigger) return;
        const product = getProductById(trigger.dataset.productId);
        if (product) openProduct(product);
    });

    thumbsEl?.addEventListener('click', (event) => {
        const thumb = event.target.closest('.gallery-thumb');
        if (!thumb) return;
        currentImageIndex = Number(thumb.dataset.index);
        renderImage();
    });

    prevBtn?.addEventListener('click', () => moveImage(-1));
    nextBtn?.addEventListener('click', () => moveImage(1));
    closeBtn?.addEventListener('click', closeProduct);
    overlay?.addEventListener('click', closeProduct);
    addBtn?.addEventListener('click', () => {
        if (currentProduct && window.LienzzoCart) window.LienzzoCart.add(currentProduct.id);
    });

    document.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('active')) return;
        if (event.key === 'Escape') closeProduct();
        if (event.key === 'ArrowLeft') moveImage(-1);
        if (event.key === 'ArrowRight') moveImage(1);
    });
})();

function buildProductWhatsAppUrl(product) {
    const message = [
        'Hola, me interesa este producto de Lienzzo 😊',
        '',
        `Producto: ${product.nombre}`,
        `Precio: ${formatPrice(product.precio)}`,
        `Disponibilidad: ${stockText(product)}`,
        '',
        '¿Me puedes confirmar disponibilidad y forma de entrega?'
    ].join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Carrito de compras Lienzzo
(function initCart() {
    const STORAGE_KEY = 'lienzzo_cart_v2';
    const cartOpenBtn = document.getElementById('cartOpenBtn');
    const cartOpenBtnMobile = document.getElementById('cartOpenBtnMobile');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartCount = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('cartCountMobile');
    const checkoutWhatsApp = document.getElementById('checkoutWhatsApp');
    const cartClearBtn = document.getElementById('cartClearBtn');
    const customerName = document.getElementById('customerName');
    const customerNotes = document.getElementById('customerNotes');
    const cartGoCatalog = document.getElementById('cartGoCatalog');

    if (!cartDrawer || !cartItems) return;

    let cart = [];

    function loadCart() {
        try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { cart = []; }
    }
    function saveCart() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
    function openCart() {
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
        cartDrawer.setAttribute('aria-hidden', 'false');
        cartOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeMobileMenu();
    }
    function closeCart() {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        cartDrawer.setAttribute('aria-hidden', 'true');
        cartOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    function totalItems() {
        return cart.reduce((sum, item) => sum + item.qty, 0);
    }
    function totalPrice() {
        return cart.reduce((sum, item) => {
            const product = getProductById(item.id);
            return sum + ((product?.precio || 0) * item.qty);
        }, 0);
    }
    function canIncrease(product, qty) {
        return typeof product.stock !== 'number' || qty < product.stock;
    }
    function buildWhatsAppMessage() {
        const lines = ['Hola, quiero hacer un pedido en Lienzzo 😊', '', 'Productos:'];
        cart.forEach((item, index) => {
            const product = getProductById(item.id);
            if (!product) return;
            const subtotal = typeof product.precio === 'number' ? ` — ${formatPrice(product.precio * item.qty)}` : '';
            lines.push(`${index + 1}. ${product.nombre} x${item.qty}${subtotal}`);
        });
        lines.push('');
        lines.push(`Total estimado: ${formatPrice(totalPrice())}`);
        lines.push('Nota: disponibilidad y entrega por confirmar.');

        const name = customerName?.value.trim();
        const notes = customerNotes?.value.trim();
        if (name) lines.push(`Mi nombre es: ${name}`);
        if (notes) lines.push(`Notas/entrega: ${notes}`);
        lines.push('');
        lines.push('¿Me puedes confirmar disponibilidad, forma de pago y entrega?');
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    }
    function renderCart() {
        const count = totalItems();
        if (cartCount) cartCount.textContent = count;
        if (cartCountMobile) cartCountMobile.textContent = count;
        cartEmpty.style.display = cart.length ? 'none' : 'flex';
        cartItems.innerHTML = '';

        cart.forEach(item => {
            const product = getProductById(item.id);
            if (!product) return;
            const img = product.imagenes?.[0] || 'images/logo-lienzzo.jpg';
            const cannotIncrease = !canIncrease(product, item.qty);
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <img src="${img}" alt="${product.nombre}">
                <div>
                    <h3>${product.nombre}</h3>
                    <p class="cart-item-price">${formatPrice(product.precio)} · ${stockText(product)}</p>
                    <div class="cart-controls">
                        <button class="qty-btn" type="button" data-action="decrease" data-id="${product.id}" aria-label="Restar">−</button>
                        <span class="cart-qty">${item.qty}</span>
                        <button class="qty-btn" type="button" data-action="increase" data-id="${product.id}" aria-label="Sumar" ${cannotIncrease ? 'disabled' : ''}>+</button>
                        <button class="remove-item" type="button" data-action="remove" data-id="${product.id}">Quitar</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(row);
        });

        if (cart.length) {
            const total = document.createElement('div');
            total.className = 'cart-total';
            total.innerHTML = `<span>Total estimado</span><strong>${formatPrice(totalPrice())}</strong>`;
            cartItems.appendChild(total);
        }

        if (checkoutWhatsApp) {
            checkoutWhatsApp.href = cart.length ? buildWhatsAppMessage() : '#';
            checkoutWhatsApp.classList.toggle('disabled', !cart.length);
        }
    }
    function add(productId) {
        const product = getProductById(productId);
        if (!product) return;
        if (typeof product.stock === 'number' && product.stock <= 0) return;
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            if (!canIncrease(product, existing.qty)) return;
            existing.qty += 1;
        } else {
            cart.push({ id: productId, qty: 1 });
        }
        saveCart();
        renderCart();
        openCart();
    }

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.add-to-cart[data-product-id]');
        if (!button) return;
        add(button.dataset.productId);
        const originalText = button.textContent;
        button.textContent = 'Agregado ✓';
        setTimeout(() => { button.textContent = originalText; }, 900);
    });

    cartItems.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const id = button.dataset.id;
        const item = cart.find(product => product.id === id);
        const product = getProductById(id);
        if (!item || !product) return;

        if (button.dataset.action === 'increase' && canIncrease(product, item.qty)) item.qty += 1;
        if (button.dataset.action === 'decrease') item.qty -= 1;
        if (button.dataset.action === 'remove' || item.qty <= 0) cart = cart.filter(product => product.id !== id);

        saveCart();
        renderCart();
    });

    [cartOpenBtn, cartOpenBtnMobile].forEach(btn => btn?.addEventListener('click', openCart));
    [cartCloseBtn, cartOverlay].forEach(el => el?.addEventListener('click', closeCart));
    [customerName, customerNotes].forEach(input => input?.addEventListener('input', renderCart));
    cartGoCatalog?.addEventListener('click', closeCart);
    cartClearBtn?.addEventListener('click', () => { cart = []; saveCart(); renderCart(); });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeCart();
    });

    window.LienzzoCart = { add, open: openCart };

    loadCart();
    renderCart();
})();

// Opiniones por WhatsApp, sin testimonios inventados
(function initReviews() {
    const name = document.getElementById('reviewName');
    const message = document.getElementById('reviewMessage');
    const button = document.getElementById('sendReviewWhatsApp');
    if (!button) return;

    function updateReviewLink() {
        const lines = [
            'Hola, quiero dejar una opinión para Lienzzo 😊',
            '',
            `Nombre: ${name?.value.trim() || ''}`,
            `Opinión: ${message?.value.trim() || ''}`
        ];
        button.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    }
    [name, message].forEach(input => input?.addEventListener('input', updateReviewLink));
    updateReviewLink();
})();

// Active nav link + reveal animation, compatible con contenido dinámico
function revealOnScroll() {
    document.querySelectorAll('.reveal').forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < windowHeight - 120) element.classList.add('active');
    });
}
function highlightNavOnScroll() {
    const scrollPosition = window.scrollY + 200;
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu-links a');
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
            });
        }
    });
}
window.addEventListener('scroll', () => {
    revealOnScroll();
    highlightNavOnScroll();
});
revealOnScroll();
highlightNavOnScroll();
