import { Link } from "react-router-dom";

export const TerminosCondiciones = () => {
  const secciones = [
    {
      icon: "task_alt",
      titulo: "Aceptación de los Términos",
      contenido: (
        <p>
          Al registrarte y utilizar nuestra plataforma, aceptás estos Términos y Condiciones en
          su totalidad. Si no estás de acuerdo con alguno de los puntos aquí establecidos, te
          pedimos que no utilices nuestros servicios. El uso continuado de la plataforma implica
          la aceptación de cualquier modificación futura de estos términos.
        </p>
      ),
    },
    {
      icon: "person_add",
      titulo: "Registro de cuenta",
      contenido: (
        <>
          <p className="mb-3">
            Al crear una cuenta en nuestra plataforma, te comprometés a:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Proporcionar datos verídicos, completos y actualizados</li>
            <li>Mantener un único usuario por persona física</li>
            <li>Ser responsable de la confidencialidad y seguridad de tu contraseña</li>
            <li>Notificarnos inmediatamente ante cualquier uso no autorizado de tu cuenta</li>
          </ul>
          <p className="mt-3">
            Nos reservamos el derecho de rechazar o cancelar cuentas que contengan información
            falsa o fraudulenta.
          </p>
        </>
      ),
    },
    {
      icon: "devices",
      titulo: "Uso de la plataforma",
      contenido: (
        <>
          <p className="mb-3">
            La plataforma está destinada exclusivamente para uso personal y no comercial.
            Queda prohibido:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Utilizar la plataforma con fines fraudulentos o malintencionados</li>
            <li>Intentar acceder de forma no autorizada a sistemas o datos de otros usuarios</li>
            <li>Reproducir, duplicar o revender cualquier parte del servicio sin autorización</li>
            <li>Utilizar bots, scrapers u otras herramientas automatizadas para acceder al contenido</li>
          </ul>
        </>
      ),
    },
    {
      icon: "sell",
      titulo: "Productos y precios",
      contenido: (
        <>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              Los precios de los productos están expresados en{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">pesos argentinos (ARS)</span>{" "}
              e incluyen IVA cuando corresponda.
            </li>
            <li>
              Los precios están sujetos a cambios sin previo aviso. El precio vigente al momento de
              confirmar tu pedido es el que se aplicará a la transacción.
            </li>
            <li>
              Las fotografías de los productos son ilustrativas. Pueden existir variaciones
              mínimas de color o presentación respecto al producto real.
            </li>
            <li>
              La disponibilidad de los productos está sujeta a stock existente.
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: "shopping_cart_checkout",
      titulo: "Pedidos y pagos",
      contenido: (
        <>
          <p className="mb-3">
            El proceso de compra funciona de la siguiente manera:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>
              Un pedido se considera confirmado únicamente cuando el pago ha sido procesado
              exitosamente.
            </li>
            <li>
              Los pagos se realizan a través de{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">MercadoPago</span>,
              plataforma que garantiza la seguridad de tus transacciones.
            </li>
            <li>
              Nos reservamos el derecho de cancelar pedidos en caso de detectar irregularidades
              en la transacción.
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: "assignment_return",
      titulo: "Cancelaciones y devoluciones",
      contenido: (
        <p>
          De acuerdo con la{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Ley de Defensa del Consumidor (Ley 24.240)
          </span>{" "}
          de la República Argentina, tenés derecho a arrepentimiento dentro de los{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">10 (diez) días corridos</span>{" "}
          contados a partir de la recepción del producto o de la celebración del contrato, lo
          que ocurra último. Para ejercer este derecho, contactanos por correo electrónico con
          tu número de pedido. Los costos de devolución correrán por cuenta del comprador,
          salvo que el producto presente defectos o no coincida con lo ofrecido.
        </p>
      ),
    },
    {
      icon: "info",
      titulo: "Responsabilidad",
      contenido: (
        <p>
          La plataforma actúa como intermediario tecnológico entre el comprador y la tienda.
          No nos responsabilizamos por productos defectuosos provenientes del proveedor, aunque
          nos comprometemos a gestionar los reclamos correspondientes. La responsabilidad de la
          plataforma se limita al correcto funcionamiento del servicio tecnológico y al
          procesamiento seguro de las transacciones.
        </p>
      ),
    },
    {
      icon: "block",
      titulo: "Suspensión de cuentas",
      contenido: (
        <>
          <p className="mb-3">
            Nos reservamos el derecho de suspender o eliminar cuentas de usuarios en los
            siguientes casos:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Uso indebido o abusivo de la plataforma</li>
            <li>Actividades fraudulentas o sospechosas</li>
            <li>Violación de cualquiera de estos Términos y Condiciones</li>
            <li>Conductas que perjudiquen a otros usuarios o al funcionamiento del servicio</li>
          </ul>
        </>
      ),
    },
    {
      icon: "copyright",
      titulo: "Propiedad intelectual",
      contenido: (
        <p>
          Todo el contenido presente en la plataforma, incluyendo pero no limitado a textos,
          imágenes, logotipos, diseños, código fuente y marcas comerciales, es propiedad de
          Lumato System o de sus respectivos licenciantes. Queda estrictamente prohibida la
          reproducción, distribución o modificación de cualquier contenido sin autorización
          previa y por escrito.
        </p>
      ),
    },
    {
      icon: "edit_document",
      titulo: "Modificaciones",
      contenido: (
        <p>
          Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier
          momento. Los cambios serán comunicados a través de la plataforma o por correo
          electrónico con antelación razonable. El uso continuado del servicio después de la
          notificación de cambios implica la aceptación de los nuevos términos.
        </p>
      ),
    },
    {
      icon: "gavel",
      titulo: "Legislación aplicable",
      contenido: (
        <p>
          Estos Términos y Condiciones se rigen por las leyes vigentes de la{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">República Argentina</span>.
          Cualquier controversia derivada del uso de la plataforma será sometida a los tribunales
          ordinarios competentes de la jurisdicción correspondiente al domicilio del consumidor,
          conforme a la legislación de defensa del consumidor vigente.
        </p>
      ),
    },
    {
      icon: "mail",
      titulo: "Contacto",
      contenido: (
        <p>
          Para cualquier consulta, reclamo o sugerencia relacionada con estos Términos y
          Condiciones, podés comunicarte con nosotros a través de nuestro correo electrónico:{" "}
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
                description
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-800 dark:text-white">
                Términos y Condiciones
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Última actualización: Noviembre 2026
              </p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Bienvenido/a a Lumato System. A continuación, se detallan los términos y condiciones
            que regulan el uso de nuestra plataforma de comercio electrónico. Te pedimos que los
            leas atentamente antes de utilizar nuestros servicios.
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
