/**
 * Servicio de Gráficos - Responsable de dibujar gráficos en Canvas
 * Principio: Single Responsibility - Solo dibuja gráficos
 */

export const ChartService = {
  /**
   * Dibujar gráfico en Canvas
   * @param {string} canvasId - ID del canvas
   * @param {array} data - Datos a graficar
   * @param {string} label - Etiqueta del gráfico
   * @param {object} options - Opciones: minVal, maxVal
   */
  drawChart(canvasId, data, label, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('❌ Canvas no encontrado:', canvasId);
      return;
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 50;
    const gw = w - 2 * pad;
    const gh = h - 2 * pad;

    // Limpiar canvas
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, w, h);

    if (!data || data.length === 0) {
      this._drawNoData(ctx, w, h);
      return;
    }

    // Determinar rango
    let minVal = options.minVal !== undefined ? options.minVal : Math.min(...data);
    let maxVal = options.maxVal !== undefined ? options.maxVal : Math.max(...data);
    if (maxVal === minVal) maxVal = minVal + 1;
    const range = Math.max(maxVal - minVal, 1);

    // Dibujar componentes
    this._drawAxes(ctx, pad, w, h);
    this._drawGrid(ctx, pad, w, h, gw, gh, minVal, maxVal, range);
    this._drawLabels(ctx, pad, w, h, gw, gh, data.length);
    this._drawLine(ctx, pad, w, h, gw, gh, data, minVal, range);
    this._drawPoints(ctx, pad, w, h, gw, gh, data, minVal, range);

    console.log(`🎨 Gráfico "${label}" dibujado:`, {
      canvasId,
      puntos: data.length,
      rango: `${minVal}-${maxVal}`
    });
  },

  /**
   * Dibujar mensaje "Sin datos"
   */
  _drawNoData(ctx, w, h) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos', w / 2, h / 2);
  },

  /**
   * Dibujar ejes X e Y
   */
  _drawAxes(ctx, pad, w, h) {
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();
  },

  /**
   * Dibujar grid y números en Y
   */
  _drawGrid(ctx, pad, w, h, gw, gh, minVal, maxVal, range) {
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 10; i++) {
      const y = pad + (gh / 10) * i;
      const valor = Math.round(maxVal - (range / 10) * i);

      // Línea de grid
      ctx.beginPath();
      ctx.moveTo(pad - 5, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();

      // Número
      ctx.fillText(valor, pad - 10, y + 4);
    }
  },

  /**
   * Dibujar etiquetas en X
   */
  _drawLabels(ctx, pad, w, h, gw, gh, dataLength) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ca3af';
    for (let i = 0; i < dataLength; i++) {
      if (dataLength <= 12 || i % Math.floor(dataLength / 12) === 0 || i === dataLength - 1) {
        const x = pad + (gw / (dataLength - 1 || 1)) * i;
        ctx.fillText(i, x, h - pad + 20);
      }
    }
  },

  /**
   * Dibujar línea
   */
  _drawLine(ctx, pad, w, h, gw, gh, data, minVal, range) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = pad + (gw / (data.length - 1 || 1)) * i;
      const y = pad + gh - (((data[i] - minVal) / range) * gh);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },

  /**
   * Dibujar puntos
   */
  _drawPoints(ctx, pad, w, h, gw, gh, data, minVal, range) {
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < data.length; i++) {
      const x = pad + (gw / (data.length - 1 || 1)) * i;
      const y = pad + gh - (((data[i] - minVal) / range) * gh);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
