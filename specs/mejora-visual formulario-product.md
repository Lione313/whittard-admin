**ROL Y CONTEXTO:**
Actúa como Diseñador Lead UI/UX y Desarrollador Frontend Senior especializado en Dashboards Enterprise y plataformas de eCommerce (nivel Stripe Dashboard / LinearApp).

**OBJETIVO:**
Diseña la arquitectura visual, estructura de componentes y/o código frontend para un **Formulario Dinámico de Creación y Edición de Productos**.

---

### **1. Estructura de Layout & Tema Visual**
* **Layout:** Asimétrico de 2 columnas (70% Canvas de Trabajo Principal, 30% Sidebar Fijo de Configuración).
* **Tema Visual:** Modo Oscuro Premium 
header guardar cambios y descartar cambios

---

### **2. Stepper del Flujo (Progressive Disclosure Workflow)**
Implementa una barra de pasos (*Stepper*) en la parte superior del canvas principal:
1. **Paso 1: Basic Info & Select Product Type** *(Activo por defecto)*.
2. **Paso 2: Configure Attributes** *(Bloqueado hasta elegir variante)*.


---

### **3. Secciones del Canvas Principal (Columna 70%)**

#### A. Selector de Tipo de Producto (Paso 1)
Presenta dos tarjetas interactivas de gran formato:
* **Simple Product:**
  * *Ilustración/Icono:* Caja de cartón cerrada con etiqueta de precio.
  * *Descripción:* "Inventario fijo, precio único. Ideal para artículos únicos o ediciones limitadas."
  * *Acción:* Botón `[SELECT]`.
* **Variant Product:**
  * *Ilustración/Icono:* Grupo de cajas interconectadas con engranajes o nodos.
  * *Descripción:* "Configura múltiples opciones (Talla, Color, Material). Genera automáticamente una matriz dinámica de variantes."
  * *Acción:* Botón `[SELECT]`.



### **5. Entregables Esperados**
1. Estructura de componentes reutilizables.
2. Definición del estado dinámico (State Management para cambio entre Producto Simple vs. Producto con Variantes).