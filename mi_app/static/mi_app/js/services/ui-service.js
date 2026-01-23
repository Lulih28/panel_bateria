/**
 * Servicio de UI - Responsable de actualizar elementos en el DOM
 * Principio: Single Responsibility - Solo maneja DOM
 */

export const UIService = {
  /**
   * Actualizar estadísticas en el DOM
   */
  updateStats(stats) {
    document.getElementById('maxVal').textContent = stats.max + '%';
    document.getElementById('minVal').textContent = stats.min + '%';
    document.getElementById('avgVal').textContent = stats.avg + '%';
    document.getElementById('countVal').textContent = stats.total;
    document.getElementById('totalRecords').textContent = stats.total;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('es-ES');
    console.log('📊 Estadísticas actualizadas');
  },

  /**
   * Actualizar lista de registros
   */
  updateRecordsList(records) {
    const listDiv = document.getElementById('recordsList');
    if (!records || records.length === 0) {
      listDiv.innerHTML = '<p style="color: var(--text-muted);">No hay registros</p>';
      return;
    }

    let html = '';
    records.forEach(record => {
      const date = new Date(record.created_at);
      const time = date.toLocaleString('es-ES');
      const device = record.device_id || 'Dispositivo desconocido';
      html += `
        <div class="record-item">
          <div>
            <div style="font-weight: 600;">${device}</div>
            <div class="record-time">${time}</div>
          </div>
          <div class="record-level">${record.level}%</div>
        </div>
      `;
    });
    listDiv.innerHTML = html;
    console.log('📝 Lista de registros actualizada');
  },

  /**
   * Mostrar mensaje de éxito
   */
  showSuccess(message = 'Operación exitosa') {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.innerHTML = `<div class="success"><i class="fas fa-check"></i> ${message}</div>`;
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
  },

  /**
   * Mostrar mensaje de error
   */
  showError(message = 'Error en la operación') {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation"></i> ${message}</div>`;
  },

  /**
   * Limpiar formulario
   */
  clearForm() {
    document.getElementById('batteryLevel').value = '';
    document.getElementById('deviceId').value = '';
  },

  /**
   * Cambiar sección activa
   */
  switchSection(sectionId, button) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    button.classList.add('active');
    console.log(`🔄 Sección cambiada a: ${sectionId}`);
  },

  /**
   * Cambiar tab
   */
  switchTab(button, period) {
    button.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    button.classList.add('active');
    console.log(`📋 Tab cambiado a: ${period}`);
  },

  /**
   * Alternar toggle
   */
  toggleSetting(element, setting) {
    element.classList.toggle('on');
    const isOn = element.classList.contains('on');
    const text = element.nextElementSibling;
    text.textContent = isOn ? 'Activado' : 'Desactivado';
    console.log(`⚙️ Setting ${setting}: ${isOn}`);
    return isOn;
  },

  /**
   * Cambiar tema
   */
  setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg', '#ffffff');
      document.documentElement.style.setProperty('--card', '#f3f4f6');
      document.documentElement.style.setProperty('--border', '#e5e7eb');
      document.documentElement.style.setProperty('--text', '#1f2937');
      document.documentElement.style.setProperty('--text-muted', '#6b7280');
    } else {
      document.documentElement.style.setProperty('--bg', '#0f172a');
      document.documentElement.style.setProperty('--card', '#1a1f2e');
      document.documentElement.style.setProperty('--border', '#2d3748');
      document.documentElement.style.setProperty('--text', '#e5e7eb');
      document.documentElement.style.setProperty('--text-muted', '#9ca3af');
    }
    localStorage.setItem('theme', theme);
    console.log(`🎨 Tema cambiado a: ${theme}`);
  },

  /**
   * Establecer intervalo de actualización
   */
  setUpdateInterval(interval) {
    localStorage.setItem('updateInterval', interval);
    console.log(`⏱️ Intervalo de actualización: ${interval}ms`);
  },

  /**
   * Cargar preferencias guardadas
   */
  loadPreferences() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedInterval = localStorage.getItem('updateInterval') || '30000';
    
    document.getElementById('themeSelector').value = savedTheme;
    document.getElementById('updateInterval').value = savedInterval;
    
    this.setTheme(savedTheme);
    return {
      theme: savedTheme,
      updateInterval: parseInt(savedInterval)
    };
  }
};
