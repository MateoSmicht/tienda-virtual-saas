# 🛒 Tienda Virtual (E-commerce) - Backend API REST

Este repositorio contiene la API REST y la lógica de negocio para el proyecto **Tienda Virtual Full Stack**. Está desarrollado con **Java y Spring Boot**, enfocado en la seguridad, la escalabilidad y las buenas prácticas de desarrollo (Clean Architecture, Testing y CI/CD).

🖥️ **Frontend Repository:** [Enlace a tu repositorio del frontend acá]

## 🚀 Tecnologías y Herramientas
* **Core:** Java 17 / Spring Boot 3
* **Seguridad:** Spring Security + JSON Web Tokens (JWT)
* **Base de Datos:** MySQL + Spring Data JPA (Hibernate)
* **Testing:** JUnit 5 + Mockito
* **Integración Continua (CI):** GitHub Actions
* **Gestión de Dependencias:** Maven
* **Integraciones Externas:** API de Mercado Pago (Webhooks)

## ✨ Características Principales
* **Seguridad y Autenticación:** Sistema de login y registro protegido mediante tokens JWT. Filtrado de rutas y control de acceso basado en roles (User/Admin).
* **Integración de Pagos:** Conexión con la pasarela de Mercado Pago. Implementación de un endpoint de Webhooks para escuchar actualizaciones de pago y procesar órdenes automáticamente.
* **Arquitectura Multicapa:** Separación limpia de responsabilidades (Controllers, Services, Repositories) y uso del patrón **DTO (Data Transfer Object)** para aislar el modelo de base de datos de las respuestas HTTP.
* **Manejo Global de Excepciones:** Uso de `@ControllerAdvice` para capturar errores y devolver respuestas JSON limpias y estandarizadas al cliente.
* **Testing Automatizado:** Suite de pruebas unitarias y de integración para asegurar el correcto funcionamiento de los servicios clave (Stock, Autenticación y Pedidos).
* **Pipeline CI/CD:** Flujo de trabajo configurado en GitHub Actions que levanta una base de datos efímera en Docker y ejecuta todos los tests de Maven automáticamente con cada *Push* o *Pull Request*.

## 🛠️ Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/MateoSmicht/tienda-virtual-backend.git](https://github.com/MateoSmicht/tienda-virtual-backend.git)
Configurar la Base de Datos:
Crear una base de datos en MySQL llamada tienda_virtual.
Actualizar las credenciales en el archivo src/main/resources/application.properties:

2. **Configurar la Base de Datos:**

        spring.datasource.url=jdbc:mysql://localhost:3306/tienda_virtual
        spring.datasource.username=TU_USUARIO
        spring.datasource.password=TU_CONTRASEÑA

-Variables de Entorno necesarias:
Asegúrate de configurar tu token de Mercado Pago en las propiedades o como variable de entorno:

-Properties

        mercadopago.access.token=TU_TEST_TOKEN
3. **Ejecucion:**

        mvn spring-boot:run

        (La API estará disponible en http://localhost:8080)

   
4.**Ejecución de Pruebas:**🧪 
   Para correr la suite de tests automatizados (JUnit/Mockito) de forma local:

        mvn test
   
Desarrollado por Mateo Smicht