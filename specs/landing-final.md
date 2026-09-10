# Especificación Técnica (Spec) — Módulo de Landing Page

**Módulo Target:** Landing Pages (`/landings/[slug]`)  
**Proyectos Involucrados:** `api` (Backend), `frontend-admin` (CMS) y `frontend-web` (Cliente E-commerce).  
**Objetivo:** Implementar la gestión y renderizado dinámico de páginas de aterrizaje en los 3 repositorios mediante 5 secciones configurables desde el panel de administración.

---

## 1. Arquitectura de Secciones (Frontend Web)

La página de aterrizaje (`/landings/[slug]`) se compondrá de **5 secciones secuenciales**, reutilizando los componentes visuales existentes en el `Home`:

1. **Hero Banner:** Reutilización del componente `Banner` del Home.
2. **Carrusel de Categorías:** Reutilización del componente `CategoryCarousel` del Home.
3. **Carrusel de Productos Recomendados:** Reutilización del componente `ProductCarousel` del e-commerce.
4. **Carrusel de Landings Destacadas:** Nuevo componente `LandingCardCarousel` (muestra miniatura y nombre).
5. **Sección Editorial / Contenido Libre:** Sección final con título, imagen opcional y renderizado HTML enriquecido.

---

## 2. Cambios por Proyecto

### 2.1 Backend (`api`)

#### A. Modelo de Datos / BD (Prisma / ORM)
Actualización del modelo `LandingPage`:

```typescript
interface LandingPage {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string; // NUEVO: Miniatura para el carrusel de landings

  // 1. Hero Banner
  bannerId?: string;

  // 2. Categorías Destacadas (Array de IDs)
  categoryIds: string[];

  // 3. Productos Recomendados (Array ordenado de IDs)
  recommendedProductIds: string[];

  // 4. Landings Destacadas (Array de IDs de otras landings)
  featuredLandingIds: string[];

  // 5. Sección Editorial Final
  finalSection?: {
    title?: string;
    imageUrl?: string;
    contentHtml: string; // HTML proveniente del Rich Text Editor
  };

  status: 'DRAFT' | 'PUBLISHED';
  createdAt: Date;
  updatedAt: Date;
}