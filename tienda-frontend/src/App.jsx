import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

// Importaciones del Admin
import Sidebar from './components/admin/Sidebar';
import Header from './components/admin/Header';
import PantallaOfertas from './pages/admin/PantallaOfertas';
import PantallaProductos from './pages/admin/PantallaProductos';
import PantallaNuevoProducto from './pages/admin/PantallaNuevoProducto';   
import PantallaEditarProducto from './pages/admin/PantallaEditarProducto';
import PantallaEstadisticas from './pages/admin/PantallaEstadisticas';
import PantallaClientes from './pages/admin/PantallaClientes';
import PantallaCargaStock from './pages/admin/PantallaCargaStock'; 
import PantallaCategorias from './pages/admin/PantallaCategorias';
import PantallaPedidos from './pages/admin/PantallaPedidos';
import PantallaDashboard from './pages/admin/PantallaDashboard';
import PantallaBanner from './pages/admin/PantallaBanner';
import PantallaLogin from './pages/auth/PantallaLogin'; 
import PantallaCaja from './pages/admin/PantallaCaja';
import PantallaProveedores from './pages/admin/PantallaProveedores';
import PantallaCargaStockMasiva from './pages/admin/PantallaCargaStockMasiva';
import PantallaHistorialStock from './pages/admin/PantallaHistorialStock';

// Importaciones de la Tienda 
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { Storefront } from './pages/store/Storefront'; 
import { PantallaCheckout } from './pages/store/PantallaCheckout'; 
import { PantallaPagoExito } from './pages/store/PantallaPagoExito';
import { PantallaPagoFallo } from './pages/store/PantallaPagoFallo';
import { PantallaPagoPendiente } from './pages/store/PantallaPagoPendiente';
import { PantallaPerfilProduct } from './pages/store/PantallaPerfilProduct';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './context/CartContext';
import { PantallaFavoritos } from './pages/store/PantallaFavoritos';
import { PantallaLoginCliente } from './pages/auth/PantallaLoginCliente';
import { PantallaMisPedidos } from './pages/store/PantallaMisPedidos';
import { PantallaResetPassword } from './pages/auth/PantallaResetPassword';
import { PantallaRecuperarPassword } from './pages/auth/PantallaRecuperarPassword';


// ========================================================
// FUNCIÓN PARA DETECTAR SUBDOMINIOS (Optimizada para pruebas)
// ========================================================
const obtenerSubdominioActual = () => {
  const hostname = window.location.hostname; // Ej: "vperfumery.localhost"
  
  // 1. Si es la URL base pura, no hay subdominio
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null; 
  }

  // 2. TRUCO PARA TU PC: Si la URL termina en ".localhost"
  if (hostname.endsWith('.localhost')) {
      // Le sacamos el ".localhost" y devolvemos lo que queda (ej: "vperfumery")
      return hostname.replace('.localhost', '');
  }

  // 3. PARA PRODUCCIÓN: Si la URL es por ejemplo "vperfumery.lumatosystem.com"
  const partes = hostname.split('.');
  if (partes.length >= 3 && partes[0] !== 'www' && partes[0] !== 'api') {
      return partes[0]; 
  }

  return null; 
};

// ========================================================
// 1. RUTAS ADMINISTRATIVAS (Blindadas con JWT)
// ========================================================
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
      return <Navigate to="/admin/login" replace />; 
  }

  try {
      const tokenDecodificado = jwtDecode(token);
      const rol = tokenDecodificado.rol || tokenDecodificado.role;

      if (rol !== 'ADMIN') {
          return <Navigate to="/" replace />;
      }

      return children;

  } catch (error) {
      console.error("Token inválido o manipulado.");
      localStorage.removeItem('token'); 
      return <Navigate to="/admin/login" replace />;
  }
};

// ========================================================
// 2. LAYOUT DEL ADMINISTRADOR (Privado)
// ========================================================
const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-display overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// ========================================================
// 3. LAYOUT DE LA TIENDA (Público)
// ========================================================
const StoreLayout = ({ children }) => {
  return (
    <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
        {children}
      </main>
      <MobileNav /> 
    </div>
  );
};

// ========================================================
// 4. ENRUTADOR PRINCIPAL
// ========================================================
function App() {
  const subdominio = obtenerSubdominioActual();

  // --------------------------------------------------------
  // MODO 1: TIENDA PÚBLICA (Se activa si hay subdominio)
  // --------------------------------------------------------
  if (subdominio) {
    return (
      <BrowserRouter>
        <FavoritesProvider>
        <CartProvider>
          <Routes>
            {/* Pasamos el subdominio como prop para que hagan los fetch */}
            <Route path="/" element={<StoreLayout><Storefront tiendaSlug={subdominio} /></StoreLayout>} />
            <Route path="/producto/:id" element={<StoreLayout><PantallaPerfilProduct tiendaSlug={subdominio} /></StoreLayout>} />
            <Route path="/favoritos" element={<StoreLayout><PantallaFavoritos /></StoreLayout>} />
            {/* ✅ ASÍ DEBE QUEDAR */}
            <Route path="/checkout" element={<StoreLayout><PantallaCheckout tiendaSlug={subdominio} /></StoreLayout>} />
            <Route path="/mis-pedidos" element={<StoreLayout><PantallaMisPedidos /></StoreLayout>} />
            
            <Route path="/login" element={<PantallaLoginCliente />} />
            <Route path="/reset-password" element={<PantallaResetPassword />} />
            <Route path="/recuperar-password" element={<PantallaRecuperarPassword />} />
            
            {/* Rutas de pagos para el cliente */}
            <Route path="/pago/exito" element={<PantallaPagoExito />} />
            <Route path="/pago/fallo" element={<PantallaPagoFallo />} />
            <Route path="/pago/pendiente" element={<PantallaPagoPendiente />} />

            {/* Redirección de seguridad: Un cliente no puede entrar al panel admin por acá */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
        </FavoritesProvider>
      </BrowserRouter>
    );
  }

  // --------------------------------------------------------
  // MODO 2: LUMATO SYSTEM (Se activa en el dominio principal)
  // --------------------------------------------------------
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Hasta que armes la Landing Page, si entran a LumatoSystem van directo al Login de admin */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* Rutas Administrativas y Auth de Locales */}
        <Route path="/admin/login" element={<PantallaLogin />} />
        
        <Route path="/dashboard" element={<RutaProtegida><AdminLayout><PantallaDashboard /></AdminLayout></RutaProtegida>} />
        <Route path="/productos/nuevo" element={<RutaProtegida><AdminLayout><PantallaNuevoProducto /></AdminLayout></RutaProtegida>} />
        <Route path="/productos" element={<RutaProtegida><AdminLayout><PantallaProductos /></AdminLayout></RutaProtegida>} />
        <Route path="/ofertas" element={<RutaProtegida><AdminLayout><PantallaOfertas /></AdminLayout></RutaProtegida>} />
        <Route path="/estadisticas" element={<RutaProtegida><AdminLayout><PantallaEstadisticas /></AdminLayout></RutaProtegida>} />
        <Route path="/clientes" element={<RutaProtegida><AdminLayout><PantallaClientes /></AdminLayout></RutaProtegida>} />
        <Route path="/productos/editar/:id" element={<RutaProtegida><AdminLayout><PantallaEditarProducto /></AdminLayout></RutaProtegida>} />
        <Route path="/productos/stock" element={<RutaProtegida><AdminLayout><PantallaCargaStock /></AdminLayout></RutaProtegida>} />
        <Route path="/categorias" element={<RutaProtegida><AdminLayout><PantallaCategorias /></AdminLayout></RutaProtegida>} />
        <Route path="/pedidos" element={<RutaProtegida><AdminLayout><PantallaPedidos /></AdminLayout></RutaProtegida>} />
        <Route path="/banner" element={<RutaProtegida><AdminLayout><PantallaBanner /></AdminLayout></RutaProtegida>} />
        <Route path="/caja" element={<RutaProtegida><AdminLayout><PantallaCaja /></AdminLayout></RutaProtegida>} />
        <Route path="/proveedores" element={<RutaProtegida><AdminLayout><PantallaProveedores /></AdminLayout></RutaProtegida>} />
        <Route path="/productos/stock/masivo" element={<RutaProtegida><AdminLayout><PantallaCargaStockMasiva /></AdminLayout></RutaProtegida>} />
        <Route path="/productos/stock/historial" element={<RutaProtegida><AdminLayout><PantallaHistorialStock /></AdminLayout></RutaProtegida>} />
        
        {/* Cualquier URL basura en LumatoSystem redirige al login admin */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;