/**
 * Servicio de Datos - Responsable de lógica de negocio
 * Principio: Single Responsibility - Maneja datos y lógica de batería
 */

import { ApiService } from './api-service.js';
import { Helpers } from '../utils/helpers.js';

export const BatteryDataService = {
  data: [],

  /**
   * Cargar todos los datos del servidor
   */
  async loadData() {
    try {
      console.log('🔄 Cargando datos...');
      const rawData = await ApiService.getBatteryRecords();
      
      // Invertir para mostrar antiguo → nuevo
      this.data = [...rawData].reverse();
      console.log(`📊 ${this.data.length} registros cargados y ordenados`);
      
      return this.data;
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      throw error;
    }
  },

  /**
   * Agregar nuevo registro y recargar datos
   */
  async addRecord(level, deviceId = 'Manual') {
    try {
      await ApiService.addBatteryRecord(level, deviceId);
      await this.loadData();
      return this.data;
    } catch (error) {
      console.error('❌ Error agregando registro:', error);
      throw error;
    }
  },

  /**
   * Obtener niveles de batería (valores)
   */
  getLevels() {
    return this.data.map(r => r.level);
  },

  /**
   * Obtener estadísticas
   */
  getStats() {
    const levels = this.getLevels();
    return Helpers.calculateStats(levels);
  },

  /**
   * Obtener tendencia
   */
  getTendency() {
    const levels = this.getLevels();
    return Helpers.calculateTendency(levels);
  },

  /**
   * Obtener últimos N registros
   */
  getLastRecords(count = 20) {
    return this.data.slice(0, count);
  }
};
