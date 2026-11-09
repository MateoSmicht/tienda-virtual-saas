import { Link } from "react-router-dom";

export const PoliticaPrivacidad = () => {
  const secciones = [
    {
      icon: "person_search",
      titulo: "Información que recopilamos",
      contenido: (
        <>
          <p className="mb-3">
            Cuando te registrás o realizás una compra en nuestra plataforma, podemos recopilar la siguiente información personal:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Nombre y apellido</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Contraseña (almacenada de forma encriptada mediante algoritmos de hash seguros; nunca se guarda en texto plano)</li>
            <li>Dirección de envío, en caso de ser proporcionada</li>
          </ul>
        </>
      ),
    },
    {
      icon: "analytics",
      titulo: "Uso de la información",
      contenido: (
        <>
          <p className="mb-3">
            La información que recopilamos se utiliza exclusivamente para los siguientes fines:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Gestión y administración de tu cuenta de usuario</li>
            <li>Procesamiento y seguimiento de pedidos</li>
            <li>Envío de notificaciones sobre el estado de tus compras</li>
            <li>Mejora continua de nuestro servicio y experiencia de usuario</li>
            <li>Comunicaciones relacionadas con tu cuenta o transacciones</li>
          </ul>
        </>
      ),
    },
    {
      icon: "shield_lock",
      titulo: "Almacenamiento y seguridad",
      contenido: (
        <p>
          Tus datos personales se almacenan en servidores seguros con medidas de protección
          adecuadas. Las contraseñas son procesadas mediante algoritmos de hash, lo que significa
          que ni siquiera nosotros podemos ver tu contraseña original. Todas las conexiones a
          nuestra plataforma están cifradas mediante protocolo HTTPS (SSL/TLS), garantizando que
          la información que viaja entre tu dispositivo y nuestros servidores esté protegida
          contra interceptaciones.
        </p>
      ),
    },
    {
      icon: "handshake",
      titulo: "Compartir con terceros",
      contenido: (
        <p>
          No vendemos, alquilamos ni compartimos tu información personal con terceros con fines
          comerciales o publicitarios. Únicamente compartimos los datos estrictamente necesarios
          con pasarelas de pago (MercadoPago) para procesar tus transacciones de forma segura.
          Estos proveedores cuentan con sus propias políticas de privacidad y estándares de
          seguridad.
        </p>
      ),
    },
    {
      icon: "verified_user",
      titulo: "Derechos del usuario",
      contenido: (
        <>
          <p className="mb-3">
            Como usuario, tenés derecho a:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              <span className="font-medium text-slate-700 dark:text-slate-300">Acceso:</span> solicitar una copia de los datos personales que tenemos sobre vos.
            </li>
            <li>
              <span className="font-medium text-slate-700 dark:text-slate-300">Rectificación:</span> corregir cualquier dato personal que sea inexacto o esté incompleto.
            </li>
            <li>
              <span className="font-medium text-slate-700 dark:text-slate-300">Eliminación:</span> solicitar la eliminación de tus datos personales de nuestra base de datos.
            </li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos, podés contactarnos por correo electrónico
            a la dirección indicada en la sección de Contacto.
          </p>
        </>
      ),
    },
    {
      icon: "cookie",
      titulo: "Cookies",
      contenido: (
        <p>
          Nuestra plataforma utiliza cookies para mantener tu sesión activa y recordar tus
          preferencias de navegación. Las cookies son pequeños archivos de texto que se almacenan
          en tu dispositivo y nos permiten brindarte una experiencia más personalizada y fluida.
          Al utilizar nuestra plataforma, aceptás el uso de estas cookies. Podés configurar tu
          navegador para rechazarlas, aunque esto podría afectar algunas funcionalidades del
          sitio.
        </p>
      ),
    },
    {
      icon: "edit_note",
      titulo: "Cambios en esta política",
      contenido: (
        <p>
          Nos reservamos el derecho de actualizar o modificar esta Política de Privacidad en
          cualquier momento. En caso de realizar cambios significativos, te notificaremos a
          través de nuestra plataforma o por correo electrónico. Te recomendamos revisar esta
          página periódicamente para estar al tanto de cualquier actualización. El uso continuado
          de la plataforma después de la publicación de los cambios constituye la aceptación de
          los mismos.
        </p>
      ),
    },
    {
      icon: "mail",
      titulo: "Contacto",
      contenido: (
        <p>
          Si tenés preguntas, inquietudes o solicitudes relacionadas con esta Política de
          Privacidad o el tratamiento de tus datos personales, podés contactarnos a través de
          nuestro correo electrónico:{" "}
          <a
            href="mailto:contacto@lumatosystem.com"
            className="text-primary hover:underline font-medium"
          >
            contacto@lumatosystem.com
          </a>
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Botón Volver */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[28px]">
                privacy_tip
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-800 dark:text-white">
                Política de Privacidad
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Última actualización: Noviembre 2026
              </p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            En Lumato System, valoramos y respetamos tu privacidad. Esta política describe
            cómo recopilamos, usamos y protegemos tu información personal cuando utilizás
            nuestra plataforma.
          </p>
        </div>

        {/* Secciones */}
        <div className="space-y-4">
          {secciones.map((seccion, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {seccion.icon}
                  </span>
                </div>
                <h2 className="text-lg font-semibold font-display text-slate-800 dark:text-white">
                  {index + 1}. {seccion.titulo}
                </h2>
              </div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed pl-12">
                {seccion.contenido}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Lumato System. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};
