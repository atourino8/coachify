-- =============================================================================
-- Migración 0022 · Clases grupales con aforo y lista de espera
-- =============================================================================
-- Decisiones y motivos: ADR-004-CLASES-GRUPALES.md. Lo importante en una línea:
-- las plazas se cuentan CON LA FILA DE LA CLASE BLOQUEADA, porque una clase se
-- llena cuando doce personas pulsan a la vez.
--
-- Tabla nueva y no un campo más en `sessions`: allí client_id es not null y de
-- eso cuelgan sus dos políticas, sus índices, la agenda y las citas del
-- cliente. Hacerlo nullable convierte cada consulta de citas en dos casos.
-- =============================================================================

-- =============================================================================
-- LA CLASE
-- =============================================================================
create table if not exists public.group_classes (
  id          uuid primary key default uuid_generate_v4(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,

  -- NULL = la ven todos sus clientes. Con valor = solo los de ese grupo.
  --
  -- ON DELETE RESTRICT, no SET NULL: si borrar el grupo dejara group_id en
  -- nulo, una clase pensada para «Empresa X» pasaría a estar publicada para
  -- TODA la cartera sin que nadie haya decidido eso. Que falle y lo resuelva
  -- el entrenador es más barato que enterarse por quien no debía verla.
  group_id    uuid references public.client_groups(id) on delete restrict,

  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,

  -- El aforo. Se puede subir y bajar después; bajarlo NO echa a nadie que ya
  -- tenga plaza —lo que hace es que no entre nadie más hasta que se vacíe.
  capacity    int not null check (capacity between 1 and 200),

  location    text,
  notes       text,

  -- Cancelada = el entrenador la anula. No se borra: quien se había apuntado
  -- tiene derecho a ver que existió y que se cayó.
  status      text not null default 'published' check (status in ('published', 'cancelled')),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint group_classes_orden_horas check (ends_at > starts_at)
);

create index if not exists group_classes_coach_starts_idx
  on public.group_classes(coach_id, starts_at);

drop trigger if exists group_classes_set_updated_at on public.group_classes;
create trigger group_classes_set_updated_at
  before update on public.group_classes
  for each row execute function public.handle_updated_at();

comment on table public.group_classes is
  'Clase con aforo a la que los clientes se apuntan solos. No confundir con client_groups, que es una capa de gestión sobre clientes.';

-- =============================================================================
-- LA INSCRIPCIÓN
-- =============================================================================
create table if not exists public.class_bookings (
  id            uuid primary key default uuid_generate_v4(),
  class_id      uuid not null references public.group_classes(id) on delete cascade,
  client_id     uuid not null references public.profiles(id) on delete cascade,

  -- seat = tiene plaza. waitlist = espera a que alguien caiga.
  status        text not null check (status in ('seat', 'waitlist', 'cancelled')),

  -- La cola se ordena por aquí: el primero que lo pidió es el primero que sube.
  created_at    timestamptz not null default now(),

  cancelled_at  timestamptz,
  cancelled_by  uuid references public.profiles(id) on delete set null,

  -- ¿Ocupaba plaza cuando canceló, o solo esperaba?
  --
  -- Es un HECHO, no una interpretación, y por eso se guarda: en cuanto status
  -- pasa a 'cancelled' se pierde para siempre si no. Y hace falta porque
  -- soltar una plaza a última hora deja a alguien sin clase, mientras que
  -- salirse de la lista de espera no le quita nada a nadie. Solo lo primero
  -- cuenta como falta.
  had_seat      boolean not null default false
);

-- Una sola inscripción VIVA por persona y clase, pero tantas canceladas como
-- haga falta: quien cancela y vuelve a apuntarse crea una fila nueva, y la
-- cancelación anterior sigue ahí. Si se reutilizara la fila, volver a
-- apuntarse borraría la falta.
create unique index if not exists class_bookings_una_viva_idx
  on public.class_bookings(class_id, client_id)
  where status in ('seat', 'waitlist');

create index if not exists class_bookings_class_idx on public.class_bookings(class_id, status);
create index if not exists class_bookings_client_idx on public.class_bookings(client_id, status);

comment on table public.class_bookings is
  'Inscripciones. NO se inserta directamente: el aforo solo se respeta a través de public.book_class(), que bloquea la fila de la clase. Por eso authenticated no tiene permiso de INSERT sobre esta tabla.';

-- =============================================================================
-- APUNTARSE
-- =============================================================================
-- Aquí está todo el motivo de que esto sea una función y no un insert.
--
-- `for update` sobre la fila de la clase serializa a todo el que llegue
-- después: espera a que el primero termine y entonces lee el número ya
-- actualizado. Sin eso, dos personas leen «11 de 12» y las dos entran.
--
-- SECURITY DEFINER porque tiene que contar inscripciones de otros, que RLS no
-- le deja ver al cliente. Mismo patrón que current_user_coach_id (migr. 0002).
-- =============================================================================
create or replace function public.book_class(p_class_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client   uuid := auth.uid();
  v_class    public.group_classes;
  v_taken    int;
  v_status   text;
begin
  if v_client is null then
    raise exception 'SIN_SESION';
  end if;

  select * into v_class
    from public.group_classes
   where id = p_class_id
     for update;

  if not found then raise exception 'CLASE_NO_EXISTE'; end if;
  if v_class.status <> 'published' then raise exception 'CLASE_CANCELADA'; end if;
  if v_class.starts_at <= now() then raise exception 'CLASE_PASADA'; end if;

  -- Que sea cliente de ESE entrenador. La función se salta RLS, así que esta
  -- comprobación es la única que hay: sin ella, cualquiera con el id de una
  -- clase se apunta a la de otro.
  if not exists (
    select 1 from public.profiles
     where id = v_client and coach_id = v_class.coach_id
  ) then
    raise exception 'NO_ES_TU_ENTRENADOR';
  end if;

  -- Clase restringida a un grupo.
  if v_class.group_id is not null and not exists (
    select 1 from public.client_group_members
     where group_id = v_class.group_id and client_id = v_client
  ) then
    raise exception 'CLASE_DE_OTRO_GRUPO';
  end if;

  if exists (
    select 1 from public.class_bookings
     where class_id = p_class_id and client_id = v_client
       and status in ('seat', 'waitlist')
  ) then
    raise exception 'YA_APUNTADO';
  end if;

  select count(*) into v_taken
    from public.class_bookings
   where class_id = p_class_id and status = 'seat';

  v_status := case when v_taken < v_class.capacity then 'seat' else 'waitlist' end;

  insert into public.class_bookings (class_id, client_id, status)
  values (p_class_id, v_client, v_status);

  return v_status;
end;
$$;

-- =============================================================================
-- CANCELAR (uno mismo, o el entrenador sacando a alguien)
-- =============================================================================
-- El ascenso desde la lista de espera ocurre AQUÍ, en la misma transacción, y
-- no en un trabajo aparte: así no existe el instante en que hay hueco y nadie
-- lo ha ocupado. Lo paga quien cancela, y son milisegundos.
-- =============================================================================
create or replace function public.cancel_class_booking(
  p_class_id uuid,
  p_client_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor   uuid := auth.uid();
  v_target  uuid := coalesce(p_client_id, auth.uid());
  v_class   public.group_classes;
  v_booking public.class_bookings;
  v_late    boolean;
begin
  if v_actor is null then raise exception 'SIN_SESION'; end if;

  select * into v_class
    from public.group_classes
   where id = p_class_id
     for update;
  if not found then raise exception 'CLASE_NO_EXISTE'; end if;

  -- O te sacas tú, o te saca tu entrenador. Nadie más.
  if v_target <> v_actor and v_class.coach_id <> v_actor then
    raise exception 'NO_AUTORIZADO';
  end if;

  select * into v_booking
    from public.class_bookings
   where class_id = p_class_id and client_id = v_target
     and status in ('seat', 'waitlist')
   limit 1;
  if not found then raise exception 'NO_ESTABA_APUNTADO'; end if;

  -- Falta = soltar una PLAZA con menos de dos días. Salirse de la lista de
  -- espera no deja a nadie fuera, así que no cuenta. Y si le saca el
  -- entrenador tampoco: la decisión no fue suya.
  v_late := v_booking.status = 'seat'
        and v_target = v_actor
        and now() > v_class.starts_at - interval '2 days';

  update public.class_bookings
     set status       = 'cancelled',
         cancelled_at = now(),
         cancelled_by = v_actor,
         had_seat     = (v_booking.status = 'seat')
   where id = v_booking.id;

  -- Sube el primero de la cola, si quedaba plaza libre de verdad.
  if v_booking.status = 'seat' then
    update public.class_bookings
       set status = 'seat'
     where id = (
       select id from public.class_bookings
        where class_id = p_class_id and status = 'waitlist'
        order by created_at
        limit 1
     );
  end if;

  return case when v_late then 'cancelled_late' else 'cancelled' end;
end;
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.group_classes enable row level security;
alter table public.class_bookings enable row level security;

-- El entrenador, con las suyas, todo.
create policy "coach manages own classes"
  on public.group_classes for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- El cliente ve las de su entrenador para las que es elegible. También las
-- canceladas: si se cae una clase a la que iba, tiene que poder verlo.
create policy "client reads eligible classes"
  on public.group_classes for select
  using (
    coach_id = public.current_user_coach_id()
    and (
      group_id is null
      or exists (
        select 1 from public.client_group_members m
         where m.group_id = group_classes.group_id
           and m.client_id = auth.uid()
      )
    )
  );

-- El entrenador ve y gestiona las inscripciones de sus clases.
create policy "coach reads bookings of own classes"
  on public.class_bookings for select
  using (
    exists (
      select 1 from public.group_classes c
       where c.id = class_id and c.coach_id = auth.uid()
    )
  );

create policy "coach updates bookings of own classes"
  on public.class_bookings for update
  using (
    exists (
      select 1 from public.group_classes c
       where c.id = class_id and c.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.group_classes c
       where c.id = class_id and c.coach_id = auth.uid()
    )
  );

-- El cliente ve LAS SUYAS y solo las suyas: quién más va a la clase no es
-- asunto suyo, y el aforo restante se cuenta aparte con una función.
create policy "client reads own bookings"
  on public.class_bookings for select
  using (client_id = auth.uid());

-- =============================================================================
-- Cuántas plazas quedan, sin enseñar quién las ocupa
-- =============================================================================
-- El cliente no puede contar las inscripciones de una clase: su política solo
-- le deja ver las suyas. Necesita el número, no los nombres.
create or replace function public.class_seats_taken(p_class_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
    from public.class_bookings
   where class_id = p_class_id and status = 'seat';
$$;

-- =============================================================================
-- PERMISOS
-- =============================================================================
grant select, insert, update, delete on public.group_classes to authenticated;

-- Sin INSERT a propósito: la única forma de crear una inscripción es
-- book_class(), que es la que respeta el aforo. Esto no es una precaución
-- teórica, es lo que impide que un insert directo escrito más adelante se
-- salte el bloqueo sin que nadie se dé cuenta.
grant select, update, delete on public.class_bookings to authenticated;

grant execute on function public.book_class(uuid) to authenticated;
grant execute on function public.cancel_class_booking(uuid, uuid) to authenticated;
grant execute on function public.class_seats_taken(uuid) to authenticated;
