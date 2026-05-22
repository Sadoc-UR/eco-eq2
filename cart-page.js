import cart from './cart.js';
import auth from './auth.js';
import CONFIG from './config.js';
import { showNotification } from './utils.js';

function renderCartPage() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    const items = cart.getContents();
    
    if (items.length === 0) {
        container.innerHTML = '<p class="empty-msg">Tu carrito está vacío.</p>';
        document.getElementById('cart-total').textContent = '$0';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <div class="quantity-controls">
                    <button class="decrease-btn" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase-btn" data-id="${item.id}">+</button>
                </div>
                <p class="item-price">$${(item.price * item.quantity).toLocaleString()}</p>
            </div>
            <button class="remove-btn" data-id="${item.id}">&times;</button>
        </div>
    `).join('');

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = `$${total.toLocaleString()}`;

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            cart.remove(id);
            renderCartPage();
        });
    });

    document.querySelectorAll('.decrease-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            cart.decrease(id);
            renderCartPage();
        });
    });

    document.querySelectorAll('.increase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = cart.getContents().find(i => i.id === id);
            // Re-use logic to add 1
            if (item) {
                cart.add(item, 1);
                renderCartPage();
            }
        });
    });
}

function applyThemeFromPreferences() {
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
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
}

async function handleCheckout() {
    const items = cart.getContents();
    
    if (items.length === 0) {
        showNotification("Tu carrito está vacío. Agrega productos antes de pagar.", "error");
        return;
    }

    const token = await auth.getAccessToken();
    
    if (!token) {
        showNotification("¡Debes iniciar sesión para finalizar la compra!", "error");
        return;
    }

    // En lugar de procesar directo, mostramos el modal de pago "falso"
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.classList.remove('hidden');
    }
}

async function processActualCheckout() {
    const items = cart.getContents();
    const token = await auth.getAccessToken();
    const user = auth.getProfile();

    try {
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const response = await fetch(`${CONFIG.API_URL}/api/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                items: items,
                usuario: user ? { cognito_id: user.sub, nombre: user.name, email: user.email } : null,
                total: total
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Limpiar el carrito después de la compra
        cart.clear();
        renderCartPage();

        // Ocultar modal de pago y mostrar modal de éxito
        const paymentModal = document.getElementById('payment-modal');
        if (paymentModal) paymentModal.classList.add('hidden');

        const successModal = document.getElementById('success-modal');
        const orderIdSpan = document.getElementById('success-order-id');
        if (successModal && orderIdSpan) {
            orderIdSpan.textContent = data.orderId || 'Desconocido';
            successModal.classList.remove('hidden');
        } else {
            showNotification('¡Compra realizada con éxito! Orden ID: ' + (data.orderId || 'Desconocido'));
        }

    } catch (error) {
        console.error("Error al procesar la compra:", error);
        showNotification("Hubo un error al procesar tu compra: " + error.message, "error");
        
        const confirmBtn = document.getElementById('confirm-payment-btn');
        if (confirmBtn) {
            confirmBtn.textContent = 'Pagar ahora';
            confirmBtn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyThemeFromPreferences();
    renderCartPage();

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
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
    
    // Lógica del modal de pago mock
    const paymentModal = document.getElementById('payment-modal');
    const closePaymentModal = document.getElementById('close-payment-modal');
    const mockPaymentForm = document.getElementById('mock-payment-form');

    if (closePaymentModal && paymentModal) {
        closePaymentModal.addEventListener('click', () => {
            paymentModal.classList.add('hidden');
        });
    }

    if (mockPaymentForm) {
        mockPaymentForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Evitar que el formulario recargue la página
            
            const submitBtn = document.getElementById('confirm-payment-btn');
            submitBtn.textContent = 'Procesando...';
            submitBtn.disabled = true;

            // Simular un tiempo de procesamiento del "banco"
            setTimeout(() => {
                submitBtn.textContent = 'Pago correcto';
                submitBtn.style.backgroundColor = '#10b981'; // Verde de éxito
                
                // Después de 1 segundo extra, procedemos con la petición a la BD real
                setTimeout(() => {
                    processActualCheckout();
                }, 1000);

            }, 2000);
        });
    }
});
