# Documento de Casos de Uso
## Sistema de Control de Inventario y Producción — Panadería Multi-Sucursal

---

## 1. Introducción

Este documento describe los casos de uso del sistema de control de inventario, producción, mermas y cierres de venta para una cadena de panaderías con múltiples sucursales. El sistema NO maneja venta transaccional (registro pieza por pieza), sino **cierres por turno** con totales de venta y existencia final declarada.

El inventario se maneja en dos categorías:
- **Materia prima (insumos)**
- **Producto terminado (pan horneado)**, controlado por lotes con vida útil de **1 día**.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Administrador General** | Visibilidad total, configura recetas, productos, sucursales y usuarios. |
| **Gerente de Sucursal** | Gestiona inventario, producción y cierres de su sucursal. |
| **Jefe de Producción / Panadero** | Crea y confirma órdenes de producción. |
| **Encargado de Cierre / Cajero** | Captura el cierre de venta por turno. |
| **Encargado de Logística** | Coordina y ejecuta el transporte de transferencias ya aprobadas entre sucursales. No aprueba transferencias. |
| **Auditor / Supervisor** | Aprueba mermas y revisa descuadres de inventario. |
| **Sistema** | Actor automático: calcula insumos por receta, valida disponibilidad, detecta descuadres y sugiere mermas. |

---

## 3. Listado General de Casos de Uso

| ID | Caso de Uso | Actor(es) principal(es) |
|---|---|---|
| CU-01 | Gestionar catálogo de productos e insumos | Administrador General |
| CU-02 | Gestionar receta (BOM) de un producto | Administrador General |
| CU-03 | Registrar entrada de materia prima (compra) | Gerente de Sucursal |
| CU-04 | Crear orden de producción | Jefe de Producción |
| CU-05 | Validar disponibilidad de insumos | Sistema |
| CU-06 | Confirmar orden de producción | Jefe de Producción |
| CU-07 | Generar merma por faltante de producción | Sistema / Jefe de Producción |
| CU-08 | Registrar cierre de venta por turno | Encargado de Cierre |
| CU-09 | Calcular descuadre de inventario post-cierre | Sistema |
| CU-10 | Solicitar transferencia entre sucursales (modo jalar) | Gerente de Sucursal (destino) |
| CU-11 | Enviar transferencia directa (modo empujar) | Gerente de Sucursal (origen) |
| CU-12 | Aprobar/rechazar solicitud de transferencia | Gerente de Sucursal (origen) |
| CU-13 | Confirmar recepción de transferencia | Gerente de Sucursal (destino) / Personal de la Central (retornos) |
| CU-15 | Registrar merma manual (vencimiento/daño) | Gerente de Sucursal / Personal de la Central |
| CU-16 | Consultar alertas de productos por vencer | Sistema |
| CU-17 | Realizar conteo físico y ajuste de inventario | Gerente de Sucursal |
| CU-18 | Consultar reportes consolidados | Administrador General |
| CU-19 | Gestionar usuarios y permisos por rol/sucursal | Administrador General |
| CU-20 | Sugerir reparto planificado de producción/envío | Sistema |
| CU-21 | Recibir y clasificar PT en la central | Personal de la Central |

---

## 4. Casos de Uso Detallados

### CU-01: Gestionar catálogo de productos, insumos, sucursales y configuración

**Actor:** Administrador General

**Alcance:** Este caso de uso agrupa la administración de las entidades base del sistema (productos terminados, insumos, sucursales) y la configuración general que gobierna reglas transversales (umbral de mermas).

#### A. Productos terminados
**Flujo principal:**
1. El usuario crea/edita un producto terminado indicando: nombre, descripción, código (SKU), unidad de medida (pieza, kg, paquete), vida útil en días (por defecto 1), precio de venta y estado (activo/inactivo).
2. Al guardar, el sistema valida unicidad de SKU y deja el producto disponible para asociarse a recetas (CU-02) y órdenes de producción (CU-04).

#### B. Insumos (materia prima)
**Flujo principal:**
1. El usuario crea/edita un insumo indicando: nombre, descripción, código (SKU), unidad de medida (kg, lt, pieza, paquete), costo unitario inicial y estado.
2. Al guardar, el sistema valida unicidad de SKU y deja el insumo disponible para recetas (CU-02) y entradas de compra (CU-03).

#### C. Sucursales
**Flujo principal:**
1. El usuario crea/edita una sucursal indicando: nombre, código, dirección, tipo (`central` / `punto_venta`) y estado.
2. Al guardar, la sucursal queda habilitada para operar inventario, producción, cierres y transferencias.

#### D. Configuración de umbral de mermas (`ConfiguracionMerma`)
**Precondición:** Existen productos en el catálogo.
**Flujo principal:**
1. El usuario define un **umbral general por defecto** (cantidad entera, aplica a cualquier producto que no tenga override).
2. Opcionalmente, el usuario define **overrides por producto** (umbral específico que sustituye al general para ese producto).
3. Al guardar, la configuración queda activa y es consultada por CU-09, CU-13 y CU-15 para determinar si una merma requiere aprobación.
4. El usuario puede consultar y editar la configuración en cualquier momento; los cambios aplican solo a mermas creadas con posterioridad.

#### E. Configuración de turnos
**Precondición:** Existen sucursales activas en el catálogo.
**Alcance:** Cada sucursal define sus propios turnos. No hay turnos globales.
**Flujo principal:**
1. El usuario selecciona una sucursal y crea/edita un turno indicando: nombre (ej. `Mañana`, `Tarde`, `Noche`), hora de inicio (`HH:mm`), hora de fin (`HH:mm`), orden (entero, define la secuencia del día) y estado.
2. El sistema valida que no haya traslapes con otros turnos activos de la misma sucursal (considerando la hora de inicio y fin, inclusive). Si hay traslape, rechaza la operación y muestra el conflicto.
3. El sistema valida que `horaInicio < horaFin` para turnos que no cruzan medianoche, o permite `horaInicio > horaFin` para turnos que sí cruzan medianoche (con una marca explícita `cruzaMedianoche: bool`).
4. Al guardar, el turno queda disponible para asociarse a órdenes de producción (CU-04) y cierres (CU-08).
5. La cantidad mínima de turnos por sucursal es 1. No se permite eliminar un turno que tenga cierres u órdenes de producción vinculadas; en su lugar se ofrece archivarlo (estado `inactivo`).
6. El usuario puede consultar la configuración de turnos en cualquier momento.

**Postcondición (general del CU-01):** Catálogo, configuración de mermas y turnos actualizados, disponibles para el resto de los casos de uso.

---

### CU-02: Gestionar receta (BOM) de un producto

**Actor:** Administrador General
**Precondición:** El producto terminado existe (CU-01) y tiene al menos un insumo asociado en el catálogo.

**Flujo principal:**
1. El usuario selecciona el producto terminado a configurar.
2. El usuario agrega uno o más insumos a la receta, indicando para cada uno: insumo (referencia), cantidad requerida por unidad de producto y unidad de medida (debe ser compatible con la del insumo).
3. El sistema valida que la suma de cantidades y unidades sea coherente y que no haya insumos duplicados en la misma receta.
4. El usuario guarda la receta. El sistema la marca como `vigente` y la deja disponible para CU-04.
5. Opcionalmente, el usuario puede versionar la receta (clonar y editar) sin afectar órdenes de producción ya creadas: cada orden guarda referencia a la versión de receta con la que fue planeada.

**Flujos alternativos:**
- 2a. Si el producto ya tiene receta vigente, el sistema pregunta si se desea crear una nueva versión o sobrescribir la actual. Sobrescribir no afecta órdenes existentes (usan snapshot de la versión anterior).
- 3a. Si un insumo está inactivo, el sistema alerta y permite continuar solo si el usuario confirma.

**Postcondición:** Receta vigente asociada al producto, consultable por CU-04 al calcular insumos requeridos.

---

### CU-04: Crear orden de producción

**Actor:** Jefe de Producción
**Precondición:** El producto tiene una receta (BOM) configurada.

**Flujo principal:**
1. El usuario selecciona sucursal, fecha, turno y producto a elaborar.
2. Indica la cantidad planeada a producir.
3. El sistema calcula automáticamente los insumos requeridos según la receta.
4. El sistema ejecuta CU-05 (validar disponibilidad).
5. La orden queda en estado `planeada` y pasa automáticamente a `en_proceso` (sin intervención del usuario).

**Flujos alternativos:**
- 4a. Si no hay insumos suficientes, el sistema alerta y permite reducir cantidad, solicitar transferencia de insumos (CU-10) o cancelar.

**Edición y cancelación:**
- La orden puede editarse (cantidad planeada, producto, turno) mientras esté en estado `planeada` o `en_proceso`. Toda edición queda registrada en bitácora con campo modificado, valor anterior, valor nuevo, usuario responsable y timestamp.
- La orden puede cancelarse en cualquier estado previo a `confirmada` (estado terminal: `cancelada`). La cancelación también queda registrada en bitácora con motivo opcional.
- Una vez `confirmada`, la orden es inmutable: cualquier corrección requiere una orden nueva (con su propio CU-04/CU-06) o un ajuste manual de inventario (CU-17).

**Postcondición:** Orden de producción creada en estado `en_proceso`, sin afectar inventario aún.

---

### CU-06: Confirmar orden de producción

**Actor:** Jefe de Producción
**Precondición:** Orden en estado `en_proceso`.

**Flujo principal:**
1. El usuario captura la **cantidad real** consumida de cada insumo (el sistema muestra la cantidad planeada como referencia).
2. El sistema calcula la diferencia (real − planeada) por insumo y su costo asociado.
3. El sistema genera movimientos de inventario de tipo `producción_consumo` con la cantidad real.
4. El usuario captura la **cantidad real producida** de pan.
5. Si cantidad real < cantidad planeada → se ejecuta CU-07.
6. El sistema crea el **lote** de producto terminado con `fecha_vencimiento = fecha_producción + 1 día`.
7. El sistema genera movimiento de inventario `producción_entrada` (+cantidad real producida).
8. El sistema calcula el costo real de producción del lote.
9. La orden pasa a estado `confirmada`.

**Postcondición:** Insumos descontados según consumo real; lote de pan dado de alta; orden cerrada.

---

### CU-07: Generar merma por faltante de producción

**Actor:** Sistema / Jefe de Producción
**Precondición:** Cantidad real producida < cantidad planeada.

**Flujo principal:**
1. El sistema calcula el faltante (planeada − real).
2. El sistema propone generar un registro de merma con motivo "producción menor a lo planeado".
3. El usuario confirma o ajusta el motivo/submotivo (quemado, mal formado, error de horno, etc.).
4. Se crea el registro de merma, referenciando la orden de producción.

**Postcondición:** Merma registrada y vinculada a la orden de producción de origen.

---

### CU-08: Registrar cierre de venta por turno

**Actor:** Encargado de Cierre
**Precondición:** El turno existe en la configuración de la sucursal (CU-01.E); el cierre no se ha registrado antes para la misma combinación (sucursal, fecha, turno); existe inventario de producto terminado en la sucursal.

**Flujo principal:**
1. El usuario selecciona sucursal, fecha y turno (referencia al `Turno` configurado en CU-01.E, no texto libre).
2. Por cada producto terminado, captura: cantidad vendida y existencia final declarada (conteo físico).
3. Captura el total de dinero recaudado en el turno.
4. El sistema ejecuta CU-09 (calcular descuadre).
5. **Transferencia automática a la central (flujo normal):** si existe al menos una sucursal de tipo `central` activa, el sistema genera una transferencia de retorno (`tipo_iniciativa = retorno_cierre`, estado `en_tránsito`) con todo el PT no vendido. La existencia final declarada menos lo vendido constituye el PT a transferir. **No se genera merma automática en la sucursal**: la decisión sobre el destino del PT regresado (venta / merma / reuso) la toma la central al recibir (CU-21).
6. **Flujo de contingencia (sin central):** si no existe ninguna sucursal de tipo `central` activa, el sistema marca el PT no vendido con `retenido: true` en el inventario de la sucursal (no se genera transferencia, no se bloquea la operación). El cierre queda igualmente `cerrado`. Una vez configurada la central, el Gerente de la sucursal deberá gestionar manualmente el inventario retenido (decisión pendiente, ver §6).
7. El cierre queda en estado `cerrado`.

**Postcondición:**
- Flujo normal: movimientos de inventario tipo `venta` generados por producto; transferencia automática de retorno a la central en `en_tránsito`.
- Flujo contingencia: movimientos `venta` generados; PT no vendido marcado `retenido` en inventario de la sucursal.
- En ambos casos el cierre queda `cerrado` y disponible para reportes.

---

### CU-09: Calcular descuadre de inventario post-cierre

**Actor:** Sistema
**Precondición:** Cierre de venta capturado (CU-08).

**Nota:** El cierre queda en estado `cerrado` independientemente de si existe descuadre. La merma por descuadre se resuelve por separado sin afectar el estado del cierre.

**Flujo principal:**
1. El sistema calcula el inventario esperado: `inventario_inicial + producción_del_turno − mermas_registradas`.
2. Compara: `cantidad_vendida_declarada + existencia_final_declarada` vs. `inventario_esperado`.
3. Si coinciden → no se genera acción adicional.
4. Si hay diferencia → el sistema alerta al Auditor y sugiere generar un registro de merma no declarada con la diferencia encontrada. La merma resultante sigue el flujo normal de CU-15: si la cantidad supera el umbral configurado en `ConfiguracionMerma` queda en `pendiente_aprobación`; en caso contrario se confirma automáticamente.

**Postcondición:** Inventario cuadrado o merma por descuadre generada (pendiente o confirmada según umbral) para revisión del Auditor. El cierre ya quedó `cerrado` en CU-08 paso 5.

---

### CU-10: Solicitar transferencia entre sucursales (modo jalar)

**Actor:** Gerente de Sucursal (destino)
**Alcance:** Aplica a producto terminado e insumos. La lógica FEFO (CU-11 paso 2) aplica solo a producto terminado.

**Flujo principal:**
1. El usuario indica sucursal origen, producto(s) (PT o insumo) y cantidad(es) solicitadas.
2. La transferencia se crea con `tipo_iniciativa = solicitud`, estado `solicitada`.
3. El sistema notifica a la sucursal origen.
4. Continúa en CU-12.

---

### CU-11: Enviar transferencia directa (modo empujar)

**Actor:** Gerente de Sucursal (origen)
**Alcance:** Aplica a producto terminado e insumos. La sugerencia FEFO aplica únicamente a producto terminado (los insumos no manejan lote).

**Flujo principal:**
1. El usuario indica sucursal destino, producto(s) (PT o insumo) y cantidad(es) a enviar.
2. Para producto terminado, el sistema sugiere el/los lote(s) más próximos a vencer (lógica FEFO). Para insumos, se toma del stock disponible sin preferencia de orden.
3. La transferencia se crea con `tipo_iniciativa = envío_directo`, estado `enviada`.
4. El sistema descuenta inmediatamente el inventario de origen (movimiento `transferencia_salida`).
5. El estado pasa a `en_tránsito`.

**Postcondición:** Inventario de origen descontado; transferencia esperando confirmación de destino (CU-13). Nota: el destino no puede rechazar; siempre confirma la cantidad recibida en CU-13.

---

### CU-12: Aprobar/rechazar solicitud de transferencia

**Actor:** Gerente de Sucursal (origen)
**Precondición:** Transferencia en estado `solicitada`.

**Nota:** El Encargado de Logística no aprueba transferencias; su rol se limita a coordinar y ejecutar el transporte una vez que la transferencia es aprobada.

**Flujo principal:**
1. El sistema valida disponibilidad de inventario en origen.
2. El usuario aprueba la solicitud (total o parcialmente).
3. Al aprobar, se descuenta inventario de origen y el estado pasa a `en_tránsito`.

**Flujo alternativo:**
- 2a. Si no hay stock suficiente o no procede, el usuario rechaza → estado `rechazada`.

---

### CU-13: Confirmar recepción de transferencia

**Actor:** Gerente de Sucursal (destino) para transferencias `solicitud` / `envio_directo`; Personal de la Central para transferencias `retorno_cierre`.
**Precondición:** Transferencia en estado `en_tránsito`.

#### A. Transferencias entre sucursales (`solicitud` o `envio_directo`)
**Flujo principal:**
1. El usuario captura la cantidad realmente recibida por producto.
2. El sistema calcula diferencia (enviado − recibido).
3. Si hay diferencia → se genera merma en tránsito (motivo "pérdida en transferencia"). **Esta merma se somete al umbral de `ConfiguracionMerma` (control antifraude de transporte):** si la cantidad supera el umbral aplicable, queda en `pendiente_aprobacion` y requiere aprobación del Auditor; si no lo supera, se confirma automáticamente.
4. El sistema da de alta el inventario en destino, **conservando la fecha de vencimiento original del lote** (solo aplica a producto terminado).
5. Estado pasa a `completada`.

**Nota:** El destino no puede rechazar un envío directo; siempre confirma la cantidad recibida (que puede ser menor, generando merma en tránsito).

#### B. Transferencias de retorno a la central (`retorno_cierre`) — recepción asíncrona con cuarentena
Este flujo se realiza en **dos fases asíncronas** para no retener al camión mientras el receptor clasifica. La primera fase es la recepción rápida (CU-13.B Fase 1); la segunda es la clasificación diferida (CU-21).

##### Fase 1 — Recepción rápida (libera el camión)
**Actor:** Personal de la Central
1. El usuario selecciona una transferencia `retorno_cierre` en estado `en_tránsito`.
2. Por cada producto, captura la cantidad realmente recibida.
3. El sistema calcula diferencia (enviado − recibido). Si hay diferencia, se genera **merma en tránsito** (motivo "pérdida en transferencia") sometida al umbral de `ConfiguracionMerma` como en el caso A paso 3.
4. Los lotes recibidos pasan al inventario de la central con `enCuarentena: true`. **Mientras estén en cuarentena:** no están disponibles para venta, no participan en FEFO, conservan su fecha de vencimiento original y su costo.
5. La transferencia pasa a estado `recibida_pendiente_clasificar`. El camión queda liberado.

##### Fase 2 — Clasificación diferida (CU-21)
Ver CU-21.

**Postcondición de Fase 1:** Inventario de la central actualizado con los lotes recibidos en cuarentena; merma en tránsito registrada si hubo diferencia; transferencia en `recibida_pendiente_clasificar` lista para clasificación.

---

### CU-15: Registrar merma manual

**Actor:** Gerente de Sucursal (en su sucursal) o Personal de la Central (en la central, típicamente al recibir retornos de cierre o por vencimiento).

**Flujo principal:**
1. El usuario selecciona producto, lote (si aplica), cantidad y motivo (vencimiento, daño, error, devolución).
2. Si la cantidad supera el umbral configurado en `ConfiguracionMerma` (umbral general o override del producto), la merma queda en estado `pendiente_aprobación`.
3. El Auditor aprueba o rechaza (si aplica).
4. Al confirmarse, se genera el movimiento de inventario `merma` correspondiente.

---

### CU-16: Consultar alertas de productos por vencer

**Actor:** Sistema (notificación proactiva) sobre el stock de la central.

**Contexto:** Con la regla de retorno automático al cierre (CU-08 paso 5), el PT no vendido ya no permanece en la sucursal al final del día, sino que regresa a la central como transferencia `retorno_cierre`. Por lo tanto, el vencimiento de producto terminado se gestiona en la central, no en las sucursales.

**Programación del job (dinámica, no fija):**
- El job se ejecuta **una vez por día por sucursal**, **N minutos después de la hora de fin del último turno configurado** para esa sucursal en CU-01.E. El offset `N` es parametrizable en configuración general (default sugerido: 60 minutos).
- No hay hora fija global: si una sucursal termina sus turnos a las 22:00 y otra a las 16:00, cada una se evalúa a su propio horario (+ offset).
- Si una sucursal no tiene turnos configurados o están todos inactivos, no se ejecuta el job para esa sucursal.

**Flujo principal:**
1. El job identifica en el stock PT de la central los lotes próximos a vencer o vencidos, **incluyendo los que se encuentren en cuarentena** (CU-21 alerta, no fuerza merma).
2. Si la sucursal o la central tienen turnos pendientes de cierre al momento del job, el sistema envía un recordatorio al Gerente/responsable para que regularice el cierre pendiente.
3. Para los lotes próximos a vencer detectados en la central, el sistema genera una alerta/sugerencia: convertirlos en merma por vencimiento (CU-15 en la central), o marcarlos para venta con descuento (si se habilita esa opción a futuro).
4. Los lotes en cuarentena que alcancen su `fechaVencimiento` durante la espera de clasificación disparan una alerta al receptor y al Gerente de la central (bandeja + correo), **sin generar merma automática**.

---

### CU-17: Realizar conteo físico y ajuste de inventario

**Actor:** Gerente de Sucursal

**Flujo principal:**
1. El usuario registra el conteo físico real de uno o varios productos/insumos.
2. El sistema compara contra el inventario en sistema.
3. Si hay diferencia, se genera un movimiento de tipo `ajuste` (positivo o negativo) con motivo y usuario responsable.

---

### CU-20: Sugerir reparto planificado de producción/envío

**Actor:** Sistema, con confirmación del Jefe de Producción o Logística.
**Precondición:** Existe histórico de cierres de venta (CU-08) suficiente para calcular una tendencia.

**Flujo principal:**
1. El sistema toma el histórico de cantidad vendida por producto y por sucursal en los **últimos 14 días**, aplicando peso por coincidencia de día de la semana (las observaciones cuyo día de la semana coincide con el día objetivo ponderan más que las que no coinciden, ya que los patrones de venta de panadería varían fuerte entre entre-semana y fin de semana).
2. Calcula una cantidad sugerida de producción/envío por sucursal y producto.
3. Presenta la sugerencia al usuario responsable (Jefe de Producción en la sucursal central, o Logística).
4. El usuario puede ajustar manualmente antes de confirmar (por eventos especiales, clima, promociones).
5. Al confirmar, se genera la orden de producción (CU-04) y/o las transferencias directas (CU-11) correspondientes.

**Flujo alternativo:**
- 1a. Si no hay historial suficiente (sistema recién implementado), el sistema marca la sugerencia como "baja confianza" o no sugiere nada, dejando la planificación completamente manual.

**Postcondición:** Orden(es) de producción y/o transferencias directas generadas con base en la sugerencia (ajustada o no).

---

### CU-19: Gestionar usuarios y permisos por rol/sucursal

**Actor:** Administrador General

#### A. Usuarios
**Flujo principal:**
1. El usuario crea/edita cuentas de usuario indicando: nombre completo, correo (login), contraseña inicial, rol (ver B), sucursal asignada (obligatoria para roles de sucursal, opcional para Administrador General y Auditor) y estado (activo/inactivo).
2. El sistema valida unicidad del correo y aplica la contraseña inicial con obligación de cambio en el primer inicio de sesión.
3. El usuario puede resetear contraseñas y activar/inactivar cuentas en cualquier momento.

#### B. Roles disponibles
Los roles son los definidos en la sección 2 (Actores del Sistema):

| Rol | Sucursal obligatoria | Alcance |
|---|---|---|
| Administrador General | No | Acceso total a todas las sucursales y configuración. |
| Gerente de Sucursal | Sí | Inventario, producción, transferencias y cierres de su sucursal. |
| Jefe de Producción / Panadero | Sí | Órdenes de producción de su sucursal. |
| Encargado de Cierre / Cajero | Sí | Captura de cierres de venta de su sucursal. |
| Encargado de Logística | No (asignable a una o varias) | Coordinar transferencias aprobadas; no aprueba. |
| Auditor / Supervisor | No | Aprobación de mermas y revisión de descuadres en todas las sucursales. |

#### C. Permisos
**Flujo principal:**
1. Los permisos se asignan por rol (no por usuario individual). Cada rol tiene un conjunto fijo de permisos que el sistema aplica automáticamente al iniciar sesión.
2. El Administrador General puede consultar en cualquier momento la matriz rol → permisos.
3. Todo cambio de rol, sucursal o estado de un usuario se registra en bitácora con fecha, usuario administrador responsable y valor anterior/nuevo.

**Postcondición:** Cuentas de usuario activas con rol y sucursal válidos; permisos efectivos en la próxima sesión iniciada.

---

### CU-21: Clasificar PT recibido en la central (Fase 2 del retorno de cierre)

**Actor:** Personal de la Central (Jefe de Producción o Gerente de Sucursal central)
**Precondición:** Existe al menos una transferencia `retorno_cierre` en estado `recibida_pendiente_clasificar`, con productos en cuarentena en el inventario de la central.

**Alcance:** Este caso de uso cubre la **segunda fase (diferida)** de la recepción de retornos. La Fase 1 (recepción rápida con pase a cuarentena) se ejecuta en CU-13.B.

**Flujo principal:**
1. El usuario selecciona una o varias transferencias `retorno_cierre` pendientes de clasificar.
2. Por cada producto dentro de cada transferencia, debe seleccionar un destino (campo obligatorio):
   - **Venta directa:** el PT sale de cuarentena y se incorpora al stock PT de la central al mismo precio que tenía en la sucursal origen. Queda disponible para venta y participa en FEFO.
   - **Merma:** se genera un registro de merma manual (CU-15) con motivo `vencimiento` o `daño`, y queda sujeto al flujo normal de aprobación por umbral.
   - **Reuso:** permitido únicamente si el producto tiene `reutilizable = true` y existe un insumo virtual receptor disponible en la central. El usuario debe indicar el insumo virtual destino (ej. `pan_viejo`); el PT sale de cuarentena y se transforma en `stock_reutilizable` de ese insumo.
3. El sistema registra la clasificación por producto y ejecuta los movimientos de inventario correspondientes (alta PT / CU-15 / alta stock_reutilizable), desactivando `enCuarentena` en el lote.
4. Cuando todos los productos de la transferencia han sido clasificados, la transferencia pasa a estado `completada`. Si quedan productos sin clasificar, la transferencia permanece en `recibida_pendiente_clasificar`.

**Flujos alternativos:**
- 2a. Si el producto es `reutilizable = false`, el sistema no permite seleccionar destino `reuso`.
- 2b. Si la central no tiene un insumo virtual receptor configurado para el producto, el sistema no permite `reuso` y sugiere crear el insumo virtual (CU-01) o elegir otro destino.

**Alerta por vencimiento en cuarentena:**
- Mientras un lote permanece en cuarentena, el job de CU-16 lo evalúa junto con el resto del stock PT de la central. Si alcanza su fecha de vencimiento, el sistema **alerta** al receptor y al Gerente de la central (bandeja + correo), pero **no genera merma automática**. La decisión sigue siendo del receptor al clasificar.

**Postcondición:** Transferencia `retorno_cierre` completada cuando todos sus productos están clasificados; cada producto destinado a uno de los tres fines; stock de la central actualizado; cuarentena liberada.

---

## 5. Reglas de negocio transversales

- Todo movimiento de inventario (producción, venta, merma, transferencia, ajuste, compra) se registra en una tabla central de movimientos con trazabilidad de tipo, producto, sucursal, usuario y referencia de origen.
- Los productos terminados siempre manejan lote y fecha de vencimiento; los insumos no necesariamente.
- La vida útil de producto terminado es de 1 día por configuración general (parametrizable a futuro).
- Al mover un lote entre sucursales, la fecha de vencimiento original se conserva — no se reinicia.
- La salida de producto terminado (venta o transferencia) debe priorizar los lotes más próximos a vencer (FEFO).
- **Aprobación de mermas por cantidad:** cada merma se compara contra un umbral configurable (`ConfiguracionMerma`, ver CU-01). Hay un **umbral general por defecto** y un **override opcional por producto**. Si la cantidad de la merma supera el umbral aplicable, la merma queda en estado `pendiente_aprobación`; si no, se confirma automáticamente. **No hay excepciones automáticas**: toda merma (manual, por descuadre o en tránsito) pasa por el umbral de `ConfiguracionMerma`.
- **Sin descuento por vencimiento:** el producto próximo a vencer se vende al mismo precio hasta el cierre del turno; no existe lógica de precio especial ni estado de "oferta". Lo no vendido pasa a merma por vencimiento (CU-16).
- **Bodega central:** no es una entidad distinta; es una `Sucursal` más (con un atributo `tipo_sucursal`: `central` / `punto_venta`) que comparte exactamente la misma estructura de inventario, producción, cierres y mermas que cualquier otra sucursal. Su rol especial es principalmente operativo: suele ser origen frecuente de envíos directos (CU-11) y destino preferente de compras a proveedor.
- **Visibilidad entre sucursales:** la sucursal central **no** tiene visibilidad cruzada sobre el inventario de las demás sucursales. La interacción con otras sucursales ocurre exclusivamente a través de transferencias (CU-10/CU-11). La visibilidad consolidada entre sucursales está reservada al **Administrador General** (CU-18). El Gerente de cada sucursal solo ve y opera sobre su propia sucursal.
- **Turnos operativos:** cada sucursal define libremente sus turnos (CU-01.E): nombre, hora de inicio, hora de fin, orden y estado. El sistema **valida no-traslape** entre turnos de la misma sucursal y permite turnos que cruzan medianoche (marca explícita `cruzaMedianoche`). La cantidad y horario de turnos varía por sucursal. **No hay turnos globales.** La producción, el cierre y el job de vencimiento se programan en función de los turnos configurados para cada sucursal.
- **Job de vencimiento (CU-16):** se ejecuta dinámicamente, **una vez por día por sucursal**, N minutos después de la hora de fin del último turno configurado para esa sucursal. El offset `N` es parametrizable (default sugerido: 60 minutos). No hay hora fija global. Si una sucursal no tiene turnos activos, no se ejecuta el job para ella.
- **Método de costeo:** se utiliza **costo promedio ponderado** por insumo/producto a nivel de sucursal. El costo de un lote de producto terminado se calcula como `Σ(cantidad_real_insumo × costo_unitario_promedio_insumo)` al momento de confirmar la producción (CU-06). Las mermas y transferencias valoran sus movimientos al costo promedio vigente al momento de ejecutar el movimiento. Las compras (CU-03) actualizan el costo promedio del insumo al recibir la mercancía.
- **Retorno automático al cierre (CU-08 paso 5):** al cerrar cualquier turno, la sucursal transfiere automáticamente a la central todo el PT no vendido, mediante una transferencia `retorno_cierre` en estado `en_tránsito`. **No se genera merma automática en la sucursal** por PT no vendido. La decisión sobre el destino del PT regresado (venta / merma / reuso) la toma el personal de la central al recibirlo (CU-13.B Fase 1 + CU-21 Fase 2).
- **Contingencia sin central (CU-08 paso 6):** si al cerrar un turno no existe ninguna sucursal de tipo `central` activa, el sistema **no bloquea el cierre**. En su lugar, marca el PT no vendido con flag `retenido: true` en el inventario de la sucursal. El Gerente de la sucursal deberá gestionar manualmente ese retenido una vez configurada la central. Mientras esté retenido, el PT no se considera disponible para venta ni para transferencia.
- **Recepción asíncrona con cuarentena (CU-13.B + CU-21):** la recepción de retornos de cierre se hace en **dos fases**. **Fase 1:** el receptor confirma cantidades reales, las diferencias se registran como merma en tránsito (con umbral) y los lotes pasan al inventario de la central con `enCuarentena: true`. La transferencia queda `recibida_pendiente_clasificar` y el camión se libera. **Fase 2 (CU-21):** el receptor clasifica cada producto en venta directa, merma o reuso; al clasificar, el lote sale de cuarentena y se incorpora al destino final.
- **Inventario en cuarentena:** mientras `enCuarentena = true`, el lote **no** está disponible para venta, **no** participa en FEFO y conserva su `fechaVencimiento` y su costo originales. El job de CU-16 evalúa los lotes en cuarentena y, si alguno vence, genera alerta al receptor y al Gerente de la central (bandeja + correo) **sin generar merma automática**. La decisión sigue siendo del receptor al clasificar.
- **Inventario retenido:** aplica solo al flujo de contingencia. El PT retenido en una sucursal no se transfiere automáticamente cuando se configura la central; requiere acción explícita del Gerente (proceso pendiente de definición, ver §6).
- **Recepción y clasificación en la central (CU-13.B / CU-21):** el receptor de la central debe clasificar obligatoriamente cada producto recibido de un retorno de cierre, eligiendo uno de tres destinos: venta directa (stock PT de la central, mismo precio que la sucursal), merma (CU-15) o reuso (stock_reutilizable, solo si el producto es `reutilizable` y existe insumo virtual receptor).
- **Productos reutilizables:** cada producto terminado puede marcarse con `reutilizable: bool` y `tipo_reuso: enum` (`none` | `materia_prima` | `nuevo_producto`). Al decidir reuso en CU-21, el PT sale de cuarentena y se transforma en `stock_reutilizable` de un insumo virtual receptor (`virtual: true` ej. `pan_viejo`, `pan_dulce_viejo`). El stock_reutilizable vive únicamente en la central; las sucursales no lo manejan.
- **Insumos virtuales:** los insumos marcados `virtual: true` no se compran a proveedor, no tienen costo unitario real y solo se alimentan desde mermas con destino reuso. Pueden incluirse en recetas de productos nuevos (CU-02) y se consumen al producir (CU-06) desde el `stock_reutilizable` de la central.
- **Bitácora de cambios en órdenes (CU-04):** toda edición o cancelación de una orden de producción queda registrada con campo, valor anterior, valor nuevo, usuario y timestamp. Las órdenes en estado `confirmada` son inmutables.
- **Notificaciones:** toda notificación del sistema (alerta al Auditor en CU-09, recordatorio de cierre pendiente en CU-16, asignación de transferencia al origen en CU-10, alerta de cuarentena por vencer, etc.) se entrega por dos canales: bandeja interna del sistema y correo electrónico al destinatario.

---

## 6. Pendientes de definición

### Para siguientes iteraciones
- Detallar CU-03 (registrar entrada de materia prima / compra a proveedor), CU-05 (validar disponibilidad de insumos) y CU-18 (consultar reportes consolidados) — prerrequisitos parciales cubiertos por CU-01 y CU-19, pero su flujo debe documentarse cuando se prioricen.
- Definir el alcance y formato del ajuste de inventario en CU-17: ¿el conteo físico genera un movimiento `ajuste` independiente, o se modela como merma positiva/negativa? Falta confirmar la semántica para reportes.

### Menores detectados durante el análisis
- **CU-20 / Insumos virtuales:** no se ha definido cómo se costea el stock_reutilizable cuando se genera a partir de un PT mermado. Hoy se asume costo cero (no se compra), pero conviene confirmar si se asigna algún valor (ej. costo original del PT, costo estándar configurable) para reportes.
- **CU-21 / Clasificación parcial:** hoy la transferencia se mantiene `recibida_pendiente_clasificar` mientras tenga productos sin clasificar. Definir un SLA configurable (ej. 24 h) tras el cual el sistema escale una alerta al Gerente de la central o fuerce alguna acción.
- **CU-21 / Reuso:** el insumo virtual receptor (`pan_viejo`, etc.) lo define el Administrador en CU-01. Decidir si el sistema debe sugerir/vincular automáticamente un insumo virtual por defecto según la categoría del producto o si el receptor de la central lo elige libremente cada vez.
- **CU-08 / Retenido → central:** cuando se configura la central después de un cierre en contingencia, definir el flujo explícito para el inventario retenido en cada sucursal: ¿se transfiere automáticamente por sucursal, el Gerente debe ejecutar una acción manual, o hay un nuevo CU para gestionar retiros de retenido?
- **CU-01.E / Turnos con cierres:** al archivar un turno que ya tiene cierres y órdenes vinculadas, decidir cómo se comportan las consultas históricas (mantener FK pero mostrar turno archivado, o reemplazar por turno "sustituto").
- **CU-17:** definir si el conteo físico genera un movimiento `ajuste` independiente o se modela como merma positiva/negativa. Impacta semántica de reportes.
- **CU-03, CU-05, CU-18:** detallar flujos cuando se prioricen (compra a proveedor, validación de disponibilidad, reportes consolidados).
