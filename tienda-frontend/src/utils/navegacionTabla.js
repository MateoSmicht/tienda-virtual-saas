// utils/navegacionTabla.js

/**
 * Permite navegar por inputs de una tabla como si fuera Excel.
 * Requiere que los inputs tengan un id con formato: prefijo-fila-columna (ej: "cell-0-1")
 */
export const navegarTablaConFlechas = (e, filaActual, colActual, maxFilas, maxCols, prefijo = "cell") => {
  const tecla = e.key;
  let nuevaFila = filaActual;
  let nuevaCol = colActual;

  if (tecla === 'ArrowUp') {
    nuevaFila = Math.max(0, filaActual - 1);
  } else if (tecla === 'ArrowDown') {
    nuevaFila = Math.min(maxFilas - 1, filaActual + 1);
  } else if (tecla === 'ArrowLeft') {
    nuevaCol = Math.max(0, colActual - 1);
  } else if (tecla === 'ArrowRight') {
    nuevaCol = Math.min(maxCols - 1, colActual + 1);
  } else if (tecla === 'Escape') {
    // Si apreta ESC, mandamos el foco de vuelta al escáner principal
    document.getElementById('input-escaner')?.focus();
    return;
  } else {
    return; // No es una tecla de navegación
  }

  // Si hubo movimiento, prevenimos el scroll por defecto de la página y movemos el foco
  if (nuevaFila !== filaActual || nuevaCol !== colActual) {
    e.preventDefault();
    const idSiguiente = `${prefijo}-${nuevaFila}-${nuevaCol}`;
    const inputSiguiente = document.getElementById(idSiguiente);
    
    if (inputSiguiente) {
      inputSiguiente.focus();
    }
  }
};