# Supabase · migraciones

Las migraciones SQL viven aquí versionadas en orden numérico.

## Aplicar manualmente (Fase B.1)

Por ahora no usamos Supabase CLI. Para aplicar una migración:

1. Abre el panel del proyecto Supabase.
2. Sidebar → **SQL Editor**.
3. Click en **+ New query**.
4. Copia y pega el contenido íntegro del archivo `.sql` correspondiente.
5. Click en **Run** (o `Ctrl + Enter`).
6. Verifica que aparece "Success" sin errores.

## Convención

Cada archivo se nombra:

```
NNNN_descripcion_corta.sql
```

Donde `NNNN` es un número de 4 dígitos secuencial (`0001`, `0002`...).

## Migraciones actuales

| # | Archivo | Descripción |
| --- | --- | --- |
| 0001 | `0001_initial_profiles.sql` | Tabla `profiles`, trigger auto-creación, RLS básico |

## Próximas (Fase B.2)

- `0002_exercises.sql` — biblioteca de ejercicios.
- `0003_workouts.sql` — workouts + workout_items + set_logs.
- `0004_sessions.sql` — citas + availability_slots.
- `0005_workout_templates.sql` — plantillas (v1.5).

## Adoptar Supabase CLI más adelante

Cuando crezcamos, vale la pena adoptar [supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm install -D supabase
npx supabase init
npx supabase link --project-ref zprxsctdngmiugomhkhb
npx supabase db push
```

Permite migraciones automáticas, generar tipos TypeScript desde el schema, y
trabajar contra una DB local de desarrollo.
