package lumato.desarrolo.tiendavirtual.service;


import lumato.desarrolo.tiendavirtual.model.Proveedor;
import java.util.List;

public interface ProveedorService {
    List<Proveedor> listarTodos();
    Proveedor guardar(Proveedor proveedor);
    Proveedor obtenerPorId(Long id);
    void eliminar(Long id);
    Proveedor modificar(Long id, Proveedor proveedorModificado);
}
