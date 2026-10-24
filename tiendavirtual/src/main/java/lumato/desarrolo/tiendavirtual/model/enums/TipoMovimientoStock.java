package lumato.desarrolo.tiendavirtual.model.enums;

public enum TipoMovimientoStock {
    COMPRA_PROVEEDOR,       // Ingreso por remito o factura de compra
    VENTA,                  // Egreso automático por transacción web o mostrador
    AJUSTE_MANUAL_INGRESO,  // Corrección de stock (ej: sobrante en inventario físico)
    AJUSTE_MANUAL_EGRESO,   // Corrección de stock (ej: mercadería vencida, rota o pérdida)
    DEVOLUCION_CLIENTE
}