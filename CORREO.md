# El correo saliente

Qué manda Treno, por dónde sale hoy, y qué hay que montar.

---

## Lo que pasó

Supabase nos avisó de una **tasa alta de rebotes** en el proyecto y amenazó con
restringirnos el envío.

Un **rebote** es un correo devuelto porque el buzón de destino no existe. Es
distinto de un correo que no sale por límite de tasa, y se paga más caro:
Supabase manda desde un **servidor compartido con todos sus proyectos
gratuitos**, así que nuestras devoluciones gastan reputación de todos. Por eso
avisan y por eso cortan.

**La causa era nuestra**, en dos sitios que ya están arreglados:

1. El guion de sembrado construía los correos de los clientes de prueba con el
   **dominio real del entrenador**: si sembrabas con `algo@gmail.com`, creaba
   `demo.lucia@gmail.com`. Ese buzón no existe y Gmail lo rechaza en seco. En
   cuanto alguien pulsaba «Reenviar invitación» sobre un cliente de demo, salía
   un correo que rebotaba. Ahora usa `example.com`, reservado por la IANA.
2. El guion de prueba de concepto **mandaba invitar a dos clientes seguidos** y
   normalizaba el síntoma con un «alguno rebotará y no será culpa del código».
   Ahora dice que se usen direcciones propias con el truco del `+`.

Y la aplicación **rechaza al invitar** los dominios reservados, que rebotan
siempre (`src/lib/correo.ts`).

---

## Qué manda Treno hoy

Solo correos de **autenticación**, y todos los emite Supabase Auth:

| Cuándo | Qué |
| --- | --- |
| El entrenador invita a un cliente | Invitación con enlace para poner contraseña |
| «Reenviar invitación» | La misma, otra vez |
| Registro de un entrenador | Confirmación de la dirección |
| «He olvidado la contraseña» | Enlace de recuperación |

**Los avisos de la aplicación NO se envían por correo.** La campana, los pagos
que vencen, la lista de espera que asciende a alguien: todo eso se deriva al
cargar la pantalla. Es una decisión, no un olvido — pero conviene saberla,
porque si algún día se manda un aviso por correo, el volumen se multiplica y el
SMTP propio pasa de conveniente a imprescindible.

---

## Lo que hay que montar: SMTP propio

**No es solo para quitarnos el aviso.** El envío por defecto de Supabase está
limitado a unos pocos correos por hora y ellos mismos dicen que no es para
producción: con un solo entrenador invitando a sus quince clientes de golpe, la
mitad no sale. Ya estaba previsto en la spec (§9, «Resend»); esto solo lo
adelanta.

### Pasos

1. **Crear cuenta en Resend** (`resend.com`). El plan gratuito son 3.000 correos
   al mes y 100 al día, de sobra para empezar.

2. **Verificar el dominio.** Hace falta el dominio de Treno comprado. Resend da
   unos registros DNS —SPF, DKIM y DMARC— que se pegan en el registrador.

   > Se puede empezar sin dominio propio usando el remitente de pruebas de
   > Resend, pero **solo llega a tu propia dirección**. Para invitar a clientes
   > de verdad hace falta el dominio verificado.

3. **Crear una API key** en Resend. Es la contraseña del SMTP.

4. **Pegarlo en Supabase**: *Project Settings → Authentication → SMTP Settings*,
   activar «Enable Custom SMTP» y rellenar:

   | Campo | Valor |
   | --- | --- |
   | Host | `smtp.resend.com` |
   | Puerto | `465` |
   | Usuario | `resend` |
   | Contraseña | la API key |
   | Sender email | `hola@tudominio` (del dominio verificado) |
   | Sender name | `Treno` |

5. **Subir el límite de envíos** en *Authentication → Rate Limits*, que sigue
   bajo aunque el SMTP sea propio.

6. **Probar**: invitar a una dirección tuya y comprobar que llega. Y mirar el
   panel de Resend, que ahí sí se ven los rebotes uno a uno — que es la otra
   ventaja de tener SMTP propio: **dejas de enterarte por un correo de
   Supabase**.

### Lo que NO hay que hacer

- **No mandar la API key al repositorio.** Va en el panel de Supabase, no en
  `.env`.
- **No verificar el dominio del correo personal de nadie.** El remitente es de
  Treno.

---

## Reglas para no repetirlo

1. **Al probar, direcciones tuyas de verdad.** `tuyo+prueba1@gmail.com` llega a
   tu buzón y no rebota. Vale para cualquier proveedor moderno.
2. **Nada de direcciones inventadas con dominios reales.** `asdf@gmail.com` es
   un rebote garantizado, y la aplicación no lo puede distinguir de un cliente
   nuevo: solo bloquea los dominios reservados.
3. **Los datos de prueba llevan `example.com`.** Reservado por la IANA (RFC
   2606) justo para esto.
4. **Si `--limpiar` avisa de usuarios con correos del esquema antiguo**, bórralos
   antes de seguir: son direcciones que no existen esperando a que alguien les
   dé a «Reenviar».
