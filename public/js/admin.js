// Admin Panel JavaScript

// Confirm delete actions
document.querySelectorAll('form[onsubmit*="confirm"]').forEach((form) => {
  form.addEventListener('submit', function (e) {
    if (!confirm('Are you sure you want to delete this item?')) {
      e.preventDefault();
    }
  });
});

// Auto-dismiss alerts
setTimeout(() => {
  document.querySelectorAll('.alert').forEach((alert) => {
    const bsAlert = new bootstrap.Alert(alert);
    bsAlert.close();
  });
}, 5000);

// Image preview
document.querySelectorAll('input[type="file"]').forEach((input) => {
  input.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const preview = document.createElement('img');
        preview.src = e.target.result;
        preview.className = 'img-thumbnail mt-2';
        preview.style.maxWidth = '200px';
        input.parentNode.appendChild(preview);
      };
      reader.readAsDataURL(file);
    }
  });
});
