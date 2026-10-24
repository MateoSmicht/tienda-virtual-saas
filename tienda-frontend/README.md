# 🛒 Tienda Virtual (E-commerce) - Frontend

Este repositorio contiene la interfaz de usuario (SPA) para el proyecto **Tienda Virtual Full Stack**. Está construida con React y diseñada para consumir una API REST desarrollada en Spring Boot, gestionando la autenticación de usuarios, el catálogo de productos y el flujo de compras.

Backend Repository: (https://github.com/MateoSmicht/tienda-virtual-backend)

## 🚀 Tecnologías Utilizadas
* **Librería principal:** React (JavaScript)
* **Estilos:** CSS puro / [Si usaste Bootstrap o Tailwind, ponelo acá]
* **Ruteo:** React Router DOM (Navegación sin recargar la página)
* **Peticiones HTTP:** Fetch API / Axios
* **Gestión de Estado:** Hooks (useState, useEffect, useContext)

## ✨ Características Principales
* **Catálogo Dinámico:** Visualización de productos traídos en tiempo real desde la base de datos MySQL.
* **Autenticación Segura:** Manejo de sesiones de usuario mediante **JSON Web Tokens (JWT)** almacenados de forma segura en el cliente.
* **Carrito de Compras:** Lógica de agregado, eliminación y cálculo total de productos.
* **Integración de Pagos:** Conexión con la pasarela de **Mercado Pago** para finalizar las transacciones de forma segura.
## 🛠️ Instalación y Ejecución Local

1. Clonar el repositorio:
        ```bash
        git clone [https://github.com/MateoSmicht/tienda-virtual-frontend.git](https://github.com/MateoSmicht/tienda-virtual-frontend.git)

2. Instalar las dependencias:
        ```bash
        npm install

3. Iniciar el servidor de desarrollo:

        ```bash
        npm run dev
        (La aplicación se ejecutará por defecto en http://localhost:5173 o el puerto que asigne Vite/React).

Desarrollado por Mateo Smicht