# 🧰 Subida de Archivos (Media) — Guía de Integración para el Admin

**Versión:** 3.0.0
**Audiencia:** Frontend / Admin
**Base URL:** `/api/v1/admin`
**Autenticación:** `Authorization: Bearer {access_token}` (rol admin)
**Módulo backend:** `app/Modules/Media` (helper reutilizable)
**Relacionado:** [`product-module.md`](./product-module.md)

> Guía práctica para implementar en el admin la subida de **imágenes, videos, PDFs y documentos**.
> El módulo Media es un **helper**: sube el archivo y devuelve la URL. **No es una biblioteca**
> (no hay colecciones, ni galería, ni listado de archivos).

---

## 1. Concepto y regla de oro

**Cada módulo que necesita imágenes recibe el archivo directamente en su propio endpoint**
(usando `multipart/form-data`) y la API, internamente, lo sube con el helper Media y guarda la URL.
El admin **no debe pre-subir** a `/media` salvo casos especiales.

| Módulo | El admin manda… | La API hace… |
|---|---|---|
| Producto (galería) | `variants[].media[].file` | Sube y guarda la URL en `variant_media.url` |
| Producto (swatch) | `attribute_options[].options[].file` | Sube y rellena `swatch_image_url` |
| Sello (Attribution) | `file` | Sube y rellena `image_url` |
| Futuros módulos | `…file` | Igual: usar el helper internamente |

**Excepción:** `POST /media` existe como utilidad para cuando el módulo solo guarda una URL
(`image_url`) y no se ha habilitado la subida directa aún, o para subidas independientes.

---

## 2. Endpoints del helper

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/admin/media` | Subir 1–10 archivos y obtener sus URLs (utilidad) |
| `DELETE` | `/api/v1/admin/media` | Borrar un archivo por `path` (body `{ "path": "media/…" }`) |

**Tipos permitidos (config `config/media.php`):** imágenes (jpeg, png, webp, gif, svg, avif),
videos (mp4, webm, mov), documentos (pdf, word, excel, csv, txt). Tamaño máx **100MB** por archivo.

---

## 3. Productos: subida directa (recomendada)

El admin envía el archivo dentro del payload del producto. La API lo sube y guarda la URL sola.

```js
const form = new FormData();
form.append('name', producto.name);
form.append('category_id', producto.category_id);
form.append('brand', producto.brand);
form.append('country_of_origin', producto.country_of_origin);

producto.variants.forEach((v, vi) => {
  form.append(`variants[${vi}][id]`, v.id ?? '');          // solo en edición
  form.append(`variants[${vi}][sku]`, v.sku);
  form.append(`variants[${vi}][price]`, v.price);

  v.media.forEach((m, mi) => {
    form.append(`variants[${vi}][media][${mi}][type]`, 'image');   // "image" | "video"
    if (m.file) {
      form.append(`variants[${vi}][media][${mi}][file]`, m.file);  // archivo nuevo → la API lo sube
    } else {
      form.append(`variants[${vi}][media][${mi}][url]`, m.url);    // media existente → reenviar URL
    }
    form.append(`variants[${vi}][media][${mi}][is_primary]`, m.is_primary ? '1' : '0');
    form.append(`variants[${vi}][media][${mi}][order]`, m.order ?? mi);
  });
});

// swatches con archivo (opcional)
producto.attribute_options.forEach((ao, ai) => {
  form.append(`attribute_options[${ai}][type]`, ao.type);
  form.append(`attribute_options[${ai}][label]`, ao.label);
  ao.options.forEach((opt, oi) => {
    form.append(`attribute_options[${ai}][options][${oi}][value]`, opt.value);
    if (opt.file) form.append(`attribute_options[${ai}][options][${oi}][file]`, opt.file);
    else form.append(`attribute_options[${ai}][options][${oi}][swatch_image_url]`, opt.swatch_image_url ?? '');
  });
});

const res = await fetch(`/api/v1/admin/products${producto.id ? `/${producto.id}` : ''}`, {
  method: producto.id ? 'PUT' : 'POST',
  headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  body: form, // FormData: NO setear Content-Type manual
});
```

**Reglas que la API valida en media del producto:**
- Cada `media` debe llevar **`url` O `file`** (nunca ambos, nunca ninguno).
- `type` requerido en minúsculas (`image`/`video`); se respeta el tipo real del archivo al subir.
- Galería: jpg/jpeg/png/webp/gif/svg/avif + mp4/webm/mov (máx **100MB**).
- Swatch: imágenes (máx **20MB**).
- En **edición**, el array `media` se envía **completo** (existentes por `url` + nuevos por `file`);
  la API reemplaza todo el media de la variante.

---

## 4. Sellos (Attribution): subida directa

El sello también acepta el archivo directamente. En create es **obligatorio** `image_url` **o**
`file` (nunca ambos). En update, solo uno de los dos como máximo.

```js
const form = new FormData();
form.append('name', sello.name);
if (sello.id) form.append('image_url', sello.image_url ?? '');   // conservar la imagen actual
if (sello.nuevoArchivo) form.append('file', sello.nuevoArchivo); // reemplazar con archivo nuevo
else form.append('image_url', sello.image_url ?? '');            // o por URL

const res = await fetch(`/api/v1/admin/attributions${sello.id ? `/${sello.id}` : ''}`, {
  method: sello.id ? 'PUT' : 'POST',
  headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  body: form,
});
```

**Reglas:**
- `file`: solo imágenes jpg/jpeg/png/webp/gif/svg, máx **20MB**.
- Create: `image_url` XOR `file` (422 si ninguno o ambos).
- Update: si envías `file`, se sube y reemplaza `image_url`.

---

## 5. Utilidad — `POST /media` (para URL manual)

Si un módulo todavía solo guarda una URL, sube el archivo acá y usa la `url` devuelta.

**Formato:** `multipart/form-data`. Campo **`files[]`** (1–10 archivos).

```bash
curl -X POST https://api.whittard.com/api/v1/admin/media \
  -H "Authorization: Bearer {access_token}" \
  -F "files[]=@sello.png" \
  -F "files[]=@ficha.pdf"
```

**Respuesta 201:**
```json
{
  "success": true,
  "message": "Archivo(s) subido(s) exitosamente.",
  "data": {
    "items": [
      {
        "url": "http://localhost/storage/media/2026/08/xxx.png",
        "path": "media/2026/08/xxx.png",
        "name": "sello.png",
        "size": 45821,
        "mime": "image/png",
        "type": "image"
      }
    ]
  }
}
```

| Campo | Para qué |
|---|---|
| `url` | La que guardas en la entidad |
| `type` | `image` \| `video` \| `document` \| `other` |
| `path` | Para borrar luego (`DELETE /media`) |
| `name` / `size` / `mime` | Previews / validación |

**Errores (422, formato Laravel):**
```json
{
  "message": "El tipo de archivo no está permitido.",
  "errors": { "files.0": ["El tipo de archivo no está permitido."] }
}
```

---

## 6. Borrar — `DELETE /api/v1/admin/media`

Body (JSON): `{ "path": "media/2026/08/xxx.png" }`

- **200**: `{ "success": true, "message": "Archivo eliminado exitosamente.", "data": { "deleted": true } }`
- **400**: path inexistente o fuera de `media/` → `{ "success": false, "message": "El archivo no existe o no puede ser eliminado.", "errors": null }`

> ⚠️ Solo acepta rutas bajo `media/`. Úsalo para limpiar archivos subidos que quedaron sin usar.

---

## 7. Manejo de errores global

| HTTP | Formato | Acción |
|---|---|---|
| 200/201 | `{ success, message, data }` | Operación exitosa |
| 422 | `{ message, errors }` (Laravel) | Mostrar errores por campo |
| 401 | `{ message: "Unauthenticated." }` | Token inválido/expirado → redirigir a login |
| 403 | `{ success: false, message, errors: null }` | Sin permisos admin |
| 400 | `{ success: false, message, errors }` | Petición inválida (p. ej. borrado fallido) |
| 404 | `{ message }` | Recurso no encontrado |

---

## 8. Requisitos para el admin (checklist)

**Componente de subida (común):**
- [ ] Campo de archivo con preview (usa la `url` devuelta) y spinner mientras sube
- [ ] FormData con `multipart/form-data`, **sin** `Content-Type` manual
- [ ] Validar extensión y tamaño en cliente según la tabla de abajo
- [ ] Interceptor global de 401 → redirigir a login

**Pantalla Productos:**
- [ ] Galería por variante: `media[].file` (nuevo) / `media[].url` (existente) con regla **URL XOR file**
- [ ] En edición, reenviar el array `media` **completo**
- [ ] Swatches: `attribute_options[].options[].file` opcional

**Pantalla Sellos:**
- [ ] `file` directo (o `image_url`) con regla **XOR** en create / no ambos en update

**Utilidades:**
- [ ] `POST /media` para módulos que solo guardan URL
- [ ] Limpiar huérfanos con `DELETE /media` (path)

### Tabla de validación en cliente (mismos límites que la API)

| Uso | Formatos | Tamaño máx |
|---|---|---|
| Galería de producto | jpg, jpeg, png, webp, gif, svg, avif, mp4, webm, mov | 100 MB |
| Swatch | jpg, jpeg, png, webp, gif, svg | 20 MB |
| Sello (`file`) | jpg, jpeg, png, webp, gif, svg | 20 MB |
| `POST /media` (utilidad) | + pdf, word, excel, csv, txt | 100 MB |
