import cart from './cart.js';
import CONFIG from './config.js';
import auth from './auth.js';
import { showNotification } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateCartCount();
    loadProductDetail();

    // Menú desplegable del usuario
    const userChip = document.getElementById('user-chip');
    const userDropdown = document.getElementById('user-dropdown');
    if (userChip && userDropdown) {
        userChip.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!userChip.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }

    document.getElementById('login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        auth.login();
    });

    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
    });

    auth.init();
});

document.addEventListener('cartUpdated', updateCartCount);

function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            if (themeBtn) themeBtn.innerHTML = '☀️ Cambiar a Modo Claro';
        } else {
            document.body.removeAttribute('data-theme');
            if (themeBtn) themeBtn.innerHTML = '🌙 Cambiar a Modo Oscuro';
        }
    };

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        const items = cart.getContents();
        const total = items.reduce((acc, item) => acc + item.quantity, 0);
        countElement.textContent = total;
    }
}

async function loadProductDetail() {
    const container = document.getElementById('product-page-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        container.innerHTML = '<div style="text-align:center; margin: 4rem;"><p>No se especificó un producto.</p><a href="index.html" class="btn-primary" style="display:inline-block; margin-top:2rem;">Ver Catálogo</a></div>';
        return;
    }

    try {
        // En un caso real podrías pedir a la API "GET /api/productos/:id"
        // Si no tienes ese endpoint, traemos todos y filtramos
        const response = await fetch(`${CONFIG.API_URL}/api/productos`);
        if (!response.ok) throw new Error('Error al conectar con la API');

        const data = await response.json();
        const productData = data.find(p => p.id == productId);

        if (!productData) {
            container.innerHTML = '<div style="text-align:center; margin: 4rem;"><p>Producto no encontrado.</p><a href="index.html" class="btn-primary" style="display:inline-block; margin-top:2rem;">Ver Catálogo</a></div>';
            return;
        }

        const product = {
            id: productData.id,
            name: productData.nombre,
            price: Number(productData.precio),
            category: productData.categoria,
            image: productData.imagen_url,
            description: productData.descripcion || 'Sin descripción.',
            stock: Number(productData.stock || 0)
        };

        const isOutOfStock = product.stock <= 0;

        container.innerHTML = `
            <div class="product-detail-container">
                <div class="product-detail-image-box">
                    <img class="product-detail-image" src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <div class="product-detail-category">${product.category}</div>
                    <h1 class="product-detail-title">${product.name}</h1>
                    <div class="product-detail-price">$${product.price.toLocaleString()}</div>
                    
                    <div class="product-detail-stock ${isOutOfStock ? 'out' : ''}">
                        ${isOutOfStock ? '⚠️ Agotado' : `✅ Disponibles: ${product.stock} unidades`}
                    </div>

                    <p class="product-detail-desc">${product.description}</p>

                    <div class="product-detail-actions">
                        <button id="add-to-cart-btn" class="btn-primary" ${isOutOfStock ? 'disabled style="background:gray;cursor:not-allowed;"' : ''}>
                            ${isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const btn = document.getElementById('add-to-cart-btn');
        if (btn && !isOutOfStock) {
            btn.addEventListener('click', () => {
                if (cart.add(product)) {
                    showNotification(`${product.name} añadido`);
                    updateCartCount();
                }
            });
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div style="text-align:center; margin: 4rem;"><p style="color: #c0392b;">Error cargando el producto.</p></div>';
    }
}