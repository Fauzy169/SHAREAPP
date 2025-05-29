// utils/notification.js
export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${
      type === 'success' ? 'check-circle' : 
      type === 'error' ? 'exclamation-circle' : 
      'info-circle'
    }"></i>
    <p>${message}</p>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// CSS yang diperlukan
/*
.notification {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 1rem;
  border-radius: 4px;
  color: white;
  z-index: 1000;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notification.info {
  background: #17a2b8;
}

.notification.success {
  background: #28a745;
}

.notification.warning {
  background: #ffc107;
  color: #856404;
}

.notification.error {
  background: #dc3545;
}

.notification.fade-out {
  opacity: 0;
  transform: translateY(20px);
}
*/