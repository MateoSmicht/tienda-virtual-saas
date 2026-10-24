package lumato.desarrolo.tiendavirtual.service;

import lumato.desarrolo.tiendavirtual.model.Negocio;
import lumato.desarrolo.tiendavirtual.model.Proveedor;
import lumato.desarrolo.tiendavirtual.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProveedorServiceImp implements ProveedorService {

    @Autowired
    private ProveedorRepository repository;

    @Autowired
    private AuthService authService;

    @Override
    public List<Proveedor> listarTodos() {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return repository.findByNegocioId(negocioId);
    }

    @Override
    public Proveedor guardar(Proveedor proveedor) {
        Negocio negocioActual = authService.obtenerNegocioDelUsuarioActual();

        proveedor.setNegocio(negocioActual);
        return repository.save(proveedor);
    }

    @Override
    public Proveedor obtenerPorId(Long id) {
        Long negocioId = authService.obtenerNegocioDelUsuarioActual().getId();
        return repository.findByIdAndNegocioId(id, negocioId)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado o no tienes permisos para verlo."));
    }

    @Override
    public void eliminar(Long id) {
        Proveedor proveedor = obtenerPorId(id);
        repository.delete(proveedor);
    }

    @Override
    public Proveedor modificar(Long id, Proveedor modificado) {
        Proveedor existente = obtenerPorId(id);

        existente.setNombre(modificado.getNombre());
        existente.setContacto(modificado.getContacto());
        existente.setTelefono(modificado.getTelefono());
        existente.setEmail(modificado.getEmail());
        existente.setDireccion(modificado.getDireccion());

        return repository.save(existente);
    }
}