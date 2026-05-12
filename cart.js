import { showNotification } from './utils.js';

// Lógica del carrito
const cart = {
    getContents: () => {
        const items = localStorage.getItem('cart');
        return items ? JSON.parse(items) : [];
    },
    add: (product, quantity = 1) => {
        const items = cart.getContents();
        const existing = items.find(i => i.id === product.id);
        
        const currentQuantity = existing ? existing.quantity : 0;
        if (currentQuantity + quantity > product.stock) {
            showNotification(`No hay suficiente stock. Solo hay ${product.stock} disponibles.`, 'error');
            return false;
        }

        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({ ...product, quantity: quantity });
        }
        localStorage.setItem('cart', JSON.stringify(items));
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        return true;
    },
    remove: (productId) => {
        let items = cart.getContents();
        items = items.filter(i => i.id !== productId);
        localStorage.setItem('cart', JSON.stringify(items));
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    },
    decrease: (productId) => {
        let items = cart.getContents();
        const existing = items.find(i => i.id === productId);
        if (existing) {
            existing.quantity -= 1;
            if (existing.quantity <= 0) {
                items = items.filter(i => i.id !== productId);
            }
            localStorage.setItem('cart', JSON.stringify(items));
            document.dispatchEvent(new CustomEvent('cartUpdated'));
        }
    },
    clear: () => {
        localStorage.removeItem('cart');
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    }
};
export default cart;
