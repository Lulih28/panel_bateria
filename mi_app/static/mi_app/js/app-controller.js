/**
 * Controlador Principal - Coordina todos los servicios
 * Principio GRASP: Controller - Responsable de la lógica de flujo
 */

const appController = {
  updateIntervalId: null,
  preferences: {},
  currentHistoryDays: 7,

  /**
   * Inicializar la aplicación
   */
  async init() {
    console.log('🚀 Inicializando aplicación...');
    try {
      // Cargar preferencias
      this.preferences = UIService.loadPreferences();

      // Cargar datos iniciales
      await this.refreshAllData();

      // Configurar eventos
      this.setupEventListeners();

      // Configurar auto-actualización
      this.startAutoRefresh();

      console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar:', error);
      UIService.showError('Error al inicializar la aplicación');
    }
  },

  /**
   * Actualizar todos los datos (estadísticas y gráficos)
   */
  async refreshAllData() {
    console.log('🔄 Actualizando datos...');
    try {
      // Cargar datos
      await BatteryDataService.loadData();

      // Actualizar estadísticas
      const stats = BatteryDataService.getStats();
      UIService.updateStats(stats);

      // Redibujar gráficos
      this.redrawCharts();

      // Actualizar lista de registros
      const recent = BatteryDataService.getLastRecords(20);
      UIService.updateRecordsList(recent);

      // Actualizar información
      document.getElementById('totalRecords').textContent = BatteryDataService.data.length;
      document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('es-ES');

      console.log('✅ Datos actualizados');
    } catch (error) {
      console.error('❌ Error al actualizar datos:', error);
    }
  },

  /**
   * Redibujar todos los gráficos
   */
  redrawCharts() {
    console.log('🎨 Redibujando gráficos...');

    // Gráfico principal (últimos 7 días)
    const mainData = BatteryDataService.getLastRecords(7 * 24 * 60 / 30); // Aproximadamente 7 días
    ChartService.drawChart('mainChart', mainData, 'Últimos 7 días', { minVal: 0, maxVal: 100 });

    // Gráfico de tendencia
    const trend = BatteryDataService.getTendency();
    ChartService.drawChart('usageChart', trend, 'Tendencia', { minVal: 0, maxVal: 100 });

    // Gráfico de historial (filtrado por días)
    this.refreshHistoryChart(this.currentHistoryDays);
  },

  /**
   * Actualizar gráfico de historial con filtro de días
   */
  refreshHistoryChart(days) {
    console.log('📊 Actualizando historial para', days, 'días');

    let data;
    if (days === 'all') {
      data = BatteryDataService.getLevels();
    } else {
      // Calcular fecha límite
      const now = new Date();
      const limitDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      data = BatteryDataService.data.filter(record => new Date(record.created_at) >= limitDate);
    }

    this.currentHistoryDays = days;
    ChartService.drawChart('histChart', data, `Historial (${days === 'all' ? 'Todo' : days + ' días'})`, { minVal: 0, maxVal: 100 });
  },

  /**
   * Manejar agregar nuevo registro
   */
  async handleAddRecord(level, deviceId) {
    console.log('➕ Agregando registro:', level, deviceId);
    try {
      const result = await BatteryDataService.addRecord(level, deviceId);
      UIService.showSuccess('Registro agregado correctamente');
      await this.refreshAllData();
      return result;
    } catch (error) {
      console.error('❌ Error al agregar registro:', error);
      UIService.showError('Error al agregar registro');
      throw error;
    }
  },

  /**
   * Configurar escuchadores de eventos
   */
  setupEventListeners() {
    console.log('⚙️ Configurando eventos...');

    // Formulario de batería
    const form = document.getElementById('batteryForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const level = parseInt(document.getElementById('batteryLevel').value);
        const deviceId = document.getElementById('deviceId').value || 'Default';

        await this.handleAddRecord(level, deviceId);
        form.reset();
      });
    }

    console.log('✅ Eventos configurados');
  },

  /**
   * Iniciar auto-actualización
   */
  startAutoRefresh() {
    const interval = parseInt(localStorage.getItem('updateInterval') || '30000');
    console.log('⏱️ Auto-actualización cada', interval, 'ms');

    this.updateIntervalId = setInterval(() => {
      this.refreshAllData();
    }, interval);
  },

  /**
   * Reiniciar auto-actualización con nuevo intervalo
   */
  restartAutoRefresh(newInterval) {
    console.log('🔄 Reiniciando auto-actualización con intervalo:', newInterval);

    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    this.updateIntervalId = setInterval(() => {
      this.refreshAllData();
    }, newInterval);
  },

  /**
   * Destruir la aplicación (limpiar intervalos)
   */
  destroy() {
    console.log('🧹 Limpiando aplicación...');
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }
  }
};

// Iniciar cuando el DOM esté listo
window.addEventListener('load', () => appController.init());
