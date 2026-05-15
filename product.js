document.addEventListener('DOMContentLoaded', () => {
    // Inicializar auth y cart (ya se manejan en utils/auth/cart, pero verificamos si hay config)
    initTheme();
    updateCartCount();
    loadProductDetail();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
}

function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        countElement.textContent = cart.getTotalItems();
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