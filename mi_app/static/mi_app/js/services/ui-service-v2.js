/**
 * Servicio de UI - Gestiona toda la interacción con el DOM
 * Principio SOLID: Single Responsibility - Solo responsable de manipular el DOM
 */

const UIService = {
  /**
   * Actualizar estadísticas en la UI
   */
  updateStats(stats) {
    console.log('📊 Actualizando estadísticas:', stats);
    document.getElementById('maxVal').textContent = (stats.max || 0).toFixed(1);
    document.getElementById('minVal').textContent = (stats.min || 0).toFixed(1);
    document.getElementById('avgVal').textContent = (stats.avg || 0).toFixed(1);
    document.getElementById('countVal').textContent = stats.count || 0;
  },

  /**
   * Actualizar lista de registros
   */
  updateRecordsList(records) {
    const list = document.getElementById('recordsList');
    if (!records || records.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted);">No hay registros disponibles</p>';
      return;
    }

    list.innerHTML = records.map(record => `
      <div class="record-item">
        <div>
          <span class="record-level">${record.level}%</span>
          <span class="record-time"> - ${formatDate(record.created_at)}</span>
        </div>
        <span style="color: var(--text-muted); font-size: 12px;">${record.device_id || 'Default'}</span>
      </div>
    `).join('');
  },

  /**
   * Mostrar mensaje de éxito
   */
  showSuccess(message) {
    console.log('✅', message);
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
      formMessage.innerHTML = `<div class="success"><i class="fas fa-check"></i> ${message}</div>`;
      setTimeout(() => {
        formMessage.innerHTML = '';
      }, 3000);
    }
  },

  /**
   * Mostrar mensaje de error
   */
  showError(message) {
    console.error('❌', message);
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
      formMessage.innerHTML = `<div class="error"><i class="fas fa-exclamation"></i> ${message}</div>`;
      setTimeout(() => {
        formMessage.innerHTML = '';
      }, 3000);
    }
  },

  /**
   * Cambiar sección visible
   */
  switchSection(id, btn) {
    console.log('📑 Cambiando a sección:', id);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
  },

  /**
   * Cambiar tab activo
   */
  switchTab(btn, period) {
    btn.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    console.log('📋 Tab cambiado a:', period);
  },

  /**
   * Toggle de setting
   */
  toggleSetting(el, setting) {
    el.classList.toggle('on');
    console.log('⚙️ Setting toggled:', setting, el.classList.contains('on'));
    localStorage.setItem(setting, el.classList.contains('on'));
  },

  /**
   * Cambiar tema
   */
  setTheme(theme) {
    console.log('🎨 Tema cambiado a:', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  },

  /**
   * Cargar preferencias almacenadas
   */
  loadPreferences() {
    console.log('📂 Cargando preferencias...');
    return {
      theme: localStorage.getItem('theme') || 'dark',
      updateInterval: parseInt(localStorage.getItem('updateInterval') || '30000'),
      notifications: localStorage.getItem('notifications') === 'true',
      lowPower: localStorage.getItem('lowPower') === 'true',
      doNotDisturb: localStorage.getItem('doNotDisturb') === 'true'
    };
  },

  /**
   * Guardar intervalo de actualización
   */
  setUpdateInterval(interval) {
    console.log('⏱️ Intervalo actualizado a:', interval, 'ms');
    localStorage.setItem('updateInterval', interval);
  }
};
