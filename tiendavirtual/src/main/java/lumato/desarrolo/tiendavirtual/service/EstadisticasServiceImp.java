package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.dto.*;
import lumato.desarrolo.tiendavirtual.repository.DetallePedidoRepository;
import lumato.desarrolo.tiendavirtual.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EstadisticasServiceImp implements EstadisticasService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private AuthService authService; // <-- INYECTAMOS EL CEREBRO DE SEGURIDAD

    // 1. CALCULAMOS LOS KPIs GLOBALES (Crecimiento)
    @Override
    public KpiDTO obtenerKpisGlobales() {
        KpiDTO kpi = new KpiDTO();
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId(); // Sacamos el ID del local actual

        // Fechas Meses
        LocalDateTime inicioMesActual = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime inicioMesPasado = YearMonth.now().minusMonths(1).atDay(1).atStartOfDay();
        LocalDateTime finMesPasado = YearMonth.now().minusMonths(1).atEndOfMonth().atTime(23, 59, 59);

        // Fechas Días
        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        LocalDateTime finHoy = LocalDate.now().atTime(23, 59, 59);

        LocalDateTime inicioAyer = LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime finAyer = LocalDate.now().minusDays(1).atTime(23, 59, 59);

        // Consultas a BD usando el negocioId
        Double ingresosMesActual = pedidoRepository.sumIngresosEntreFechas(inicioMesActual, finHoy, negocioId);
        Double ingresosMesPasadoTotal = pedidoRepository.sumIngresosEntreFechas(inicioMesPasado, finMesPasado, negocioId);

        Long ventasHoyTotal = pedidoRepository.countPedidosEntreFechas(inicioHoy, finHoy, negocioId);
        Long ventasAyerTotal = pedidoRepository.countPedidosEntreFechas(inicioAyer, finAyer, negocioId);

        // Porcentajes
        double porcentajeMes = ingresosMesPasadoTotal == 0 ? (ingresosMesActual > 0 ? 100 : 0)
                : ((ingresosMesActual - ingresosMesPasadoTotal) / ingresosMesPasadoTotal) * 100;

        double porcentajeHoy = ventasAyerTotal == 0 ? (ventasHoyTotal > 0 ? 100 : 0)
                : ((double)(ventasHoyTotal - ventasAyerTotal) / ventasAyerTotal) * 100;

        kpi.setIngresosMes(ingresosMesActual);
        kpi.setPorcentajeMes(porcentajeMes);
        kpi.setVentasHoy(ventasHoyTotal);
        kpi.setPorcentajeHoy(porcentajeHoy);

        return kpi;
    }

    // 2. RANKING DE PRODUCTOS
    @Override
    public List<TopProductoDTO> obtenerTop5Productos(LocalDateTime inicio, LocalDateTime fin) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return detallePedidoRepository.findTopProductosMultiTenant(inicio, fin, negocioId, PageRequest.of(0, 5));
    }

    // 3. STATS DE UN SOLO PRODUCTO
    @Override
    public ProductoStatDTO obtenerStatsProducto(Long productoId) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return detallePedidoRepository.findStatsByProductoIdAndNegocioId(productoId, negocioId);
    }

    // 4. DATOS DEL GRÁFICO
    @Override
    public List<PuntoGraficoDTO> obtenerDatosGrafico(LocalDateTime inicio, LocalDateTime fin) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        List<Object[]> ventas = pedidoRepository.findVentasParaGrafico(inicio, fin, negocioId);
        List<PuntoGraficoDTO> grafico = new ArrayList<>();

        boolean esMismoDia = inicio.toLocalDate().isEqual(fin.toLocalDate());

        if (esMismoDia) {
            double[] ventasPorHora = new double[24];
            for (Object[] v : ventas) {
                LocalDateTime fecha = (LocalDateTime) v[0];
                Double total = (Double) v[1];
                ventasPorHora[fecha.getHour()] += total;
            }
            for (int i = 0; i < 24; i++) {
                grafico.add(new PuntoGraficoDTO(i + ":00", ventasPorHora[i]));
            }
        } else {
            Map<LocalDate, Double> ventasPorDia = new LinkedHashMap<>();
            LocalDate fechaActual = inicio.toLocalDate();
            LocalDate fechaFinal = fin.toLocalDate();

            while (!fechaActual.isAfter(fechaFinal)) {
                ventasPorDia.put(fechaActual, 0.0);
                fechaActual = fechaActual.plusDays(1);
            }

            for (Object[] v : ventas) {
                LocalDate fecha = ((LocalDateTime) v[0]).toLocalDate();
                Double total = (Double) v[1];
                if (ventasPorDia.containsKey(fecha)) {
                    ventasPorDia.put(fecha, ventasPorDia.get(fecha) + total);
                }
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM", new Locale("es", "AR"));
            for (Map.Entry<LocalDate, Double> entry : ventasPorDia.entrySet()) {
                grafico.add(new PuntoGraficoDTO(entry.getKey().format(formatter), entry.getValue()));
            }
        }
        return grafico;
    }

    @Override
    public Optional<ProductoStatDTO> obtenerEstadisticasHistoricasDeProducto(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return pedidoRepository.obtenerEstadisticasHistoricasPorProducto(id, negocioId);
    }
}