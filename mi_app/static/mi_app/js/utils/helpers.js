/**
 * Utilidades y funciones auxiliares
 */

export const Helpers = {
  /**
   * Obtener valor de cookie por nombre
   */
  getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  },

  /**
   * Calcular estadísticas de un array de números
   */
  calculateStats(numbers) {
    if (!numbers || numbers.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0 };
    }
    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length),
      total: numbers.length
    };
  },

  /**
   * Calcular tendencia dividiendo datos en segmentos
   */
  calculateTendency(data, maxSegments = 24) {
    if (!data || data.length === 0) return [];
    
    const segments = Math.min(maxSegments, Math.ceil(data.length / 2));
    const segmentSize = Math.ceil(data.length / segments);
    const tendency = [];

    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, data.length);
      const average = Math.round(
        data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start)
      );
      tendency.push(average);
    }

    return tendency;
  },

  /**
   * Formatear fecha a string legible
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  },

  /**
   * Formatear hora actual
   */
  formatTime() {
    return new Date().toLocaleTimeString('es-ES');
  },

  /**
   * Validar rango de nivel de batería
   */
  validateBatteryLevel(level) {
    const num = parseInt(level);
    return num >= 0 && num <= 100;
  }
};
