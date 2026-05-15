import auth from './auth.js';
import CONFIG from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupUserMenu();
    
    // Configurar Auth
    await auth.init();
    
    if (!auth.isAuthenticated()) {
        document.getElementById('orders-content').innerHTML = `
            <div class="login-prompt">
                <p style="margin-bottom: 1.5rem; font-size: 1.2rem;">Debes iniciar sesión para ver tus pedidos.</p>
                <button class="btn-primary" onclick="window.loginUser()">Iniciar Sesión</button>
            </div>
        `;
        window.loginUser = () => auth.login();
        return;
    }

    loadOrders();
});

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

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
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

function setupUserMenu() {
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
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
}

async function loadOrders() {
    const container = document.getElementById('orders-content');
    
    try {
        const token = auth.getAccessToken();
        const response = await fetch(`${CONFIG.API_URL}/api/mis-pedidos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al obtener pedidos');
        
        const pedidos = await response.json();

        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <h2>Sin pedidos aún</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">No hemos encontrado compras en tu historial.</p>
                    <a href="index.html" class="btn-primary" style="text-decoration: none;">Ir de compras</a>
                </div>
            `;
            return;
        }

        let html = '';
        pedidos.forEach(pedido => {
            let detallesHtml = '';
            
            if (pedido.detalles && pedido.detalles.length > 0) {
                detallesHtml = pedido.detalles.map(d => `
                    <div class="order-item">
                        <img src="${d.imagen_url}" alt="${d.nombre}" class="order-item-img" onerror="this.src='https://via.placeholder.com/60'">
                        <div class="order-item-details">
                            <p class="order-item-title">${d.nombre}</p>
                            <div class="order-item-meta">
                                <span>Cantidad: ${d.cantidad}</span>
                                <span>Precio U.: $${Number(d.precio_unitario).toLocaleString()}</span>
                            </div>
                        </div>
                        <div style="font-weight: 600; color: var(--primary);">
                            $${(d.cantidad * Number(d.precio_unitario)).toLocaleString()}
                        </div>
                    </div>
                `).join('');
            } else {
                detallesHtml = '<p style="color: var(--text-muted); font-size: 0.9rem;">Detalles no disponibles para este pedido.</p>';
            }

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">Pedido #${pedido.id}</div>
                            <div class="order-date">${formatDate(pedido.fecha_compra)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="order-status">${pedido.estado}</div>
                            <div class="order-total">Total: $${Number(pedido.total).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="order-items">
                        ${detallesHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div style="text-align: center; color: #c0392b; padding: 2rem;">
                Hubo un error al cargar tu historial de pedidos. Intenta nuevamente más tarde.
            </div>
        `;
    }
}