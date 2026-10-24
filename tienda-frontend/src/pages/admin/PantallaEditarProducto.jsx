import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchConToken } from '../../services/api'; // 

const PantallaEditarProducto = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigoBarra: '',
    imagenUrl: '',
    precio: '',
    ppp: '',
    stock: '',
    subcategoriaId: '', 
    disponible: true,
    controlarStock: true
  });

  // 1. CARGAMOS LAS CATEGORÍAS Y EL PRODUCTO A EDITAR
  useEffect(() => {
    fetchConToken('/categorias')
      .then(res => res.json())
      .then(dataCategorias => {
        setCategorias(dataCategorias);
        

        return fetchConToken(`/productos/${id}`);
      })
      .then(res => res.json())
      .then(productoDb => {
        setFormData({
          nombre: productoDb.nombre || '',
          descripcion: productoDb.descripcion || '',
          codigoBarra: productoDb.codigoBarra || '',
          imagenUrl: productoDb.imagenUrl || '',
          precio: productoDb.precio || '',
          ppp: productoDb.ppp || '',
          stock: productoDb.stock || '',
          subcategoriaId: productoDb.subcategoria?.id || '',
          disponible: productoDb.disponible,
          controlarStock: productoDb.controlarStock
        });

        if (productoDb.subcategoria?.categoria?.id) {
          setCategoriaSeleccionada(productoDb.subcategoria.categoria.id.toString());
        }
        
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando datos:", err);
        setCargando(false);
        alert("No se pudo cargar el producto. Quizás ya no existe.");
        navigate('/productos');
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const saltarConEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      if (form.elements[index + 1]) {
        form.elements[index + 1].focus();
      } else {
        document.getElementById('btn-guardar')?.focus();
      }
    }
  };

  // 2. ENVIAMOS LA ACTUALIZACIÓN A SPRING BOOT (USANDO PUT)
  const actualizarProducto = async (e) => {
    e.preventDefault(); 
    
    const productoAEnviar = {
      id: id,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      codigoBarra: formData.codigoBarra,
      imagenUrl: formData.imagenUrl || null,
      precio: parseFloat(formData.precio),
      ppp: parseFloat(formData.ppp),
      stock: parseInt(formData.stock),
      disponible: formData.disponible,
      controlarStock: formData.controlarStock,
      subcategoria: { id: parseInt(formData.subcategoriaId) } 
    };

    try {
      const response = await fetchConToken(`/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productoAEnviar)
      });

      if (response.ok) {
        alert("¡Producto actualizado correctamente!");
        navigate('/productos'); 
      } else {
        alert("Hubo un error al actualizar. Verificá la consola de Java.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  if (cargando) {
    return <div className="p-8 text-center text-slate-500 font-bold">Cargando datos del producto... ⏳</div>;
  }
  // EL HTML ES EL MISMO QUE EL DE NUEVO PRODUCTO
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Editar Producto</h2>
          <p className="text-slate-500 mt-1">Modificá los datos del registro actual.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/productos')} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
          
          <button 
            id="btn-guardar"
            onClick={actualizarProducto} 
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all focus:ring-4 focus:ring-primary/50 outline-none"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      <form className="space-y-6" id="form-producto" onSubmit={actualizarProducto}>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Clasificación</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Categoría Madre</label>
              <select 
                value={categoriaSeleccionada}
                onKeyDown={saltarConEnter}
                onChange={(e) => {
                  setCategoriaSeleccionada(e.target.value);
                  setFormData({ ...formData, subcategoriaId: '' }); 
                }}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary"
              >
                <option value="">1. Seleccioná una categoría...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subcategoría</label>
              <select 
                name="subcategoriaId" 
                value={formData.subcategoriaId} 
                onChange={handleChange} 
                onKeyDown={saltarConEnter}
                required 
                disabled={!categoriaSeleccionada}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-slate-100"
              >
                <option value="">2. Seleccioná una subcategoría...</option>
                {categorias
                  .find(cat => cat.id.toString() === categoriaSeleccionada)
                  ?.subcategorias?.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                  ))
                }
              </select>
            </div>

          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Detalles del Producto</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Producto</label>
              <input name="nombre" value={formData.nombre} onChange={handleChange} onKeyDown={saltarConEnter} required className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" type="text" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} onKeyDown={saltarConEnter} className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" rows="3"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Código de Barras (SKU)</label>
              <input name="codigoBarra" value={formData.codigoBarra} onChange={handleChange} onKeyDown={saltarConEnter} required className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" type="text" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Inventario y Precios</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Precio de Venta ($)</label>
              <input name="precio" value={formData.precio} onChange={handleChange} onKeyDown={saltarConEnter} required className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" step="0.01" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Costo / PPP ($)</label>
              <input name="ppp" value={formData.ppp} onChange={handleChange} onKeyDown={saltarConEnter} required className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" step="0.01" type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stock Actual</label>
              <input name="stock" value={formData.stock} onChange={handleChange} onKeyDown={saltarConEnter} required className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" type="number" />
            </div>
          </div>
        </div>

          <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL de la Imagen (Link)</label>
              <input 
                name="imagenUrl" 
                value={formData.imagenUrl} 
                onChange={handleChange} 
                onKeyDown={saltarConEnter} 
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary" 
                placeholder="Ej: https://sheep.com/foto.jpg" 
                type="text" 
              />
            </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Configuración Adicional</h3>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input type="checkbox" name="disponible" checked={formData.disponible} onChange={handleChange} onKeyDown={saltarConEnter} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary outline-none focus:ring-2 focus:ring-offset-1" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Producto Disponible para la venta</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input type="checkbox" name="controlarStock" checked={formData.controlarStock} onChange={handleChange} onKeyDown={saltarConEnter} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary outline-none focus:ring-2 focus:ring-offset-1" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Controlar Stock (Restar automáticamente al vender)</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PantallaEditarProducto;