export function showNotification(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
    }
    
    // Contamos solo los elementos que no están desvaneciéndose
    const activeToasts = Array.from(container.children).filter(child => !child.classList.contains('fade-out') && child.style.opacity !== '0');
    
    // Limitar a máximo 4 notificaciones
    if (activeToasts.length >= 4) {
        activeToasts[0].remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.style.fontWeight = 'bold';
    toast.textContent = (type === 'error' ? '❌ ' : '✅ ') + message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}