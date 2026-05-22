import cart from './cart.js';
import CONFIG from './config.js';
import auth from './auth.js';
import { showNotification } from './utils.js';

let currentCategory = 'Todos';
let searchQuery = '';
let products = [];

// --- Renderizado y Filtros ---
function renderFeaturedProduct() {
    const featuredContainer = document.getElementById('featured-content');
    const featuredCard = document.getElementById('featured-card');
    
    if (!featuredContainer || products.length === 0) return;

    // Seleccionar un producto al azar de la lista
    const randomIndex = Math.floor(Math.random() * products.length);
    const randomProduct = products[randomIndex];

    // Inyectar el HTML con la imagen y el precio
    featuredContainer.innerHTML = `
        <div style="margin-top: 12px; text-align: center;">
            <img src="${randomProduct.image}" alt="${randomProduct.name}" style="width: 100%; height: 140px; object-fit: contain; border-radius: 6px; margin-bottom: 8px; background-color: #fff;">
            <h4 style="font-size: 0.95rem; margin: 0; color: var(--text-color);">${randomProduct.name}</h4>
            <p style="font-size: 0.95rem; font-weight: bold; color: var(--primary-color); margin: 4px 0 0 0;">$${randomProduct.price.toLocaleString()}</p>
        </div>
    `;

    // Hacer que si el usuario le da clic, redirija a la página de detalles
    featuredCard.onclick = () => {
        window.location.href = `product.html?id=${randomProduct.id}`;
    };
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    let filtered = products.filter(p => {
        const matchCategory = currentCategory === 'Todos' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    // Dar prioridad a los disponibles frente a los agotados
    filtered.sort((a, b) => {
        const aAgotado = a.stock <= 0;
        const bAgotado = b.stock <= 0;
        if (aAgotado && !bAgotado) return 1;
        if (!aAgotado && bAgotado) return -1;
        return 0;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>';
        return;
    }

    grid.innerHTML = filtered.map(product => {
        const isOutOfStock = product.stock <= 0;
        return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock-card' : ''}">
            <div class="product-image" style="background-image: url('${product.image}')" data-id="${product.id}">
                ${isOutOfStock ? '<div class="out-of-stock-badge">Agotado</div>' : ''}
                <div class="quick-view-overlay"><span>Ver Detalles</span></div>
            </div>
            <div class="product-info">
                <p class="category">${product.category}</p>
                <h3>${product.name}</h3>
                <p class="stock-text ${isOutOfStock ? 'stock-empty' : ''}">${isOutOfStock ? 'Agotado' : `Stock: ${product.stock} unidades`}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <p class="price">$${product.price.toLocaleString()}</p>
                    <button class="add-btn-small" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>+</button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Listeners
    document.querySelectorAll('.add-btn-small').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                const product = products.find(p => p.id === id);
                if (cart.add(product)) {
                    showNotification(`${product.name} añadido`);
                }
            });
        }
    });

    document.querySelectorAll('.product-image').forEach(img => {
        img.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            window.location.href = `product.html?id=${id}`;
        });
    });
}

async function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (grid) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Cargando productos...</p>';
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/productos`);
        if (!response.ok) {
            throw new Error('Error al conectar con la API');
        }

        const data = await response.json();
        products = data.map(item => ({
            id: item.id,
            name: item.nombre,
            price: Number(item.precio),
            category: item.categoria,
            image: item.imagen_url,
            description: item.descripcion,
            stock: Number(item.stock || 0)
        }));
    } catch (error) {
        console.error(error);
        products = [];
        if (grid) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #c0392b; font-weight: bold; font-size: 1.2rem;">API no funcionando.</p>';
        }
        return;
    }

    renderProducts();
    renderFeaturedProduct();
}

// --- Funciones Base ---
function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        const items = cart.getContents();
        const total = items.reduce((acc, item) => acc + item.quantity, 0);
        countElement.textContent = total;
        
        // Animación de brinco (Micro-interacción)
        countElement.classList.remove('bounce');
        void countElement.offsetWidth; // Trigger reflow
        countElement.classList.add('bounce');
    }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Dark Mode Toggle (respects system preference unless user overrides)
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

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    themeBtn.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', nextTheme);
        applyTheme(nextTheme);
    });

    // Filtros
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            renderProducts();
        });
    });

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
    loadProducts();
    updateCartCount();
});

document.addEventListener('cartUpdated', updateCartCount);
