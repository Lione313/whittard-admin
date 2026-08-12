# 📋 Guía de importación de productos (Excel)

Guía para preparar el archivo `.xlsx` que se importa en el admin de productos.
**Una fila = una variante.** Si un producto tiene varias variantes, sus datos se
repiten en cada fila.

> Reglas fuente: [`specs/product-import-export.md`](../specs/product-import-export.md)

---

## 1. Formato del archivo

- **Excel** `.xlsx` (OpenXML).
- **Tamaño máximo:** 100 MB.
- **Encabezados en español**, en el orden exacto de la tabla de abajo.
- No incluyas UUIDs internos: los identificadores son **`codigo`** (producto) y **`sku`** (variante).

## 2. Estructura de columnas

| # | Columna | ¿Obligatoria? | Descripción |
|---|---|---|---|
| 1 | `codigo` | ❌ opcional | Identificador del producto. Se autogenera si va vacío (en producto nuevo). |
| 2 | `sku` | ✅ obligatoria | Identificador de la variante. Único global y dentro del producto. |
| 3 | `nombre` | ✅ obligatoria | Nombre del producto. |
| 4 | `marca` | ✅ obligatoria | Marca. |
| 5 | `pais_origen` | ✅ obligatoria | País de origen. |
| 6 | `categoria` | ✅ obligatoria | Categoría por **nombre**. Se crea si no existe. |
| 7 | `subcategoria` | ✅ obligatoria | Subcategoría por **nombre**. Se crea si no existe. |
| 8 | `estado` | ❌ opcional | `draft` \| `published` \| `archived` (por defecto `draft`). |
| 9 | `es_principal` | ❌ opcional | `1` o `0`. Si ninguna se marca, la primera variante es la principal. |
| 10 | `es_activo` | ❌ opcional | `1` o `0` (por defecto `1`). |
| 11+ | *(atributos)* | ❌ opcional | Una columna por atributo del catálogo. El encabezado es el label normalizado (ej. `presentacion`, `peso`, `sabor`). Si el producto usa atributos, **cada variante debe llenar todos**. |
| … | `sellos` | ❌ opcional | Sellos por **nombre**, separados por coma. Se crean si no existen. |
| … | `precio` | ✅ obligatoria | Precio de la variante (≥ 0). |
| … | `precio_oferta` | ❌ opcional | Precio de oferta (≥ 0 y ≤ `precio`). Si viene, exige `oferta_inicia` y `oferta_fin`. |
| … | `oferta_inicia` / `oferta_fin` | ❌ opcional | Vigencia de la oferta (juntas con `precio_oferta`). |
| … | `stock` | ❌ opcional | Stock (por defecto `0`). |
| … | `descripcion_corta` / `descripcion_larga` / `descripcion_ingredientes` / `descripcion_especificaciones` | ❌ opcional | Descripciones del producto. |

> `slug` y el orden de las variantes no se incluyen: el `slug` se autogenera y el
> orden se toma del orden de las filas del archivo. El export produce el mismo set
> de columnas, por lo que un archivo exportado puede reimportarse tal cual.

## 3. Reglas importantes

- **Emparejamiento (actualizar vs crear):**
  1. Si `codigo` coincide con un producto existente → se **actualiza** ese producto.
  2. Si no hay `codigo` pero `sku` coincide con una variante existente → se **actualiza** el producto dueño de esa variante.
  3. Sin coincidencia → se **crea** un producto nuevo (las filas con el mismo `codigo` + `nombre` se agrupan como variantes del mismo producto).
- **En actualización** solo se aplican las columnas con valor; las vacías conservan lo existente.
- **En creación** son obligatorias: `nombre`, `marca`, `pais_origen`, `categoria`, `subcategoria` y por variante `sku` y `precio`. Si faltan, ese grupo se omite con error.
- **Producto simple vs configurable:**
  - Sin atributos → **exactamente 1 variante** (simple).
  - Con atributos → **2+ variantes** permitidas, y **cada variante debe definir valor para todos los atributos** (configurable).
- **Oferta:** `precio_oferta` ≤ `precio`. Si viene `precio_oferta`, deben venir `oferta_inicia` y `oferta_fin`; y `oferta_fin` debe ser posterior a `oferta_inicia`.
- **Unicidad:** `codigo` y `slug` únicos; `sku` único global y dentro del producto. Si se duplican, el grupo se omite.
- **Auto-creación:** categorías, subcategorías, sellos y atributos se crean por nombre si no existen. Todo ocurre dentro de la transacción del grupo: si el grupo falla, no queda nada creado.
- **Actualización de variantes:** las variantes existentes del producto que no vengan en el archivo se **eliminan**.
- **Actualización de un producto simple:** no puede quedarse con más de una variante.

## 4. Ejemplo

Un producto configurable con 2 variantes (`presentacion` y `peso` como atributos):

```
codigo | sku | nombre | marca | pais_origen | categoria | subcategoria | estado | es_principal | es_activo | presentacion | peso | sellos | precio
MAT-1  | LAT | Té     | X     | Japón       | Tés       | Matcha       | draft  | 1            | 1         | Lata          | 100g | Vegano | 28.5
MAT-1  | BOL | Té     | X     | Japón       | Tés       | Matcha       | draft  | 0            | 1         | Bolsa         | 250g | Vegano | 45.0
```

Un producto simple (1 sola variante, sin atributos):

```
codigo | sku  | nombre     | marca | pais_origen | categoria | subcategoria | precio
SIM-1  | SKU1 | Té clásico | X     | Reino Unido | Tés       | Clásicos     | 15.0
```

## 5. Flujo en el admin

1. **Importar** → selecciona el archivo `.xlsx`.
2. El sistema **valida** el archivo en modo simulación (no guarda nada) y te muestra el resumen (crear / actualizar / omitir), la **vista previa** por producto y los **errores** por fila.
3. Revisa el resultado y **confirma** la importación. Los grupos válidos se aplican; los inválidos se omiten y se reportan.
