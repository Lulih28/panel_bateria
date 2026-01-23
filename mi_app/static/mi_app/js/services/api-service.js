/**
 * Servicio de API - Responsable de comunicación con el backend
 * Principio: Single Responsibility - Solo maneja HTTP
 */

import { Helpers } from '../utils/helpers.js';

export const ApiService = {
  baseUrl: '/api/battery/',

  /**
   * Obtener todos los registros de batería
   */
  async getBatteryRecords() {
    try {
      const response = await axios.get(this.baseUrl);
      console.log('✅ Registros obtenidos:', response.data);
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      console.error('❌ Error obteniendo registros:', error);
      throw error;
    }
  },

  /**
   * Agregar nuevo registro de batería
   */
  async addBatteryRecord(level, deviceId = 'Manual') {
    try {
      if (!Helpers.validateBatteryLevel(level)) {
        throw new Error('El nivel debe estar entre 0 y 100');
      }

      const response = await axios.post(this.baseUrl, {
        level: parseInt(level),
        device_id: deviceId
      }, {
        headers: { 'X-CSRFToken': Helpers.getCookie('csrftoken') }
      });

      console.log('✅ Registro agregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error agregando registro:', error);
      throw error;
    }
  }
};
