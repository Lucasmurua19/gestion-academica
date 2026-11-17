#!/bin/sh
# Carga datos de ejemplo por la API:  docker compose run --rm seed
#
#   - Usuarios de acceso: el Administrador (lo crea la API al arrancar) y varios usuarios de solo lectura (rol Consulta).
#   - Materias, alumnos e inscripciones (activas y de baja) para probar listados, filtros, paginado y el resumen.
#
# Es seguro repetirlo: los usuarios que ya existen se saltean y, si ya hay materias cargadas, no se agregan datos.
set -eu

API="${API_URL:-http://api:8080/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@demo.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin_Demo_2026}"
JSON='Content-Type: application/json'

echo "Esperando a la API y a la cuenta de administrador..."
TOKEN=""
INTENTO=0
while [ -z "$TOKEN" ]; do
  TOKEN=$(curl -s -X POST "$API/Auth/login" -H "$JSON" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p' || true)
  if [ -z "$TOKEN" ]; then
    INTENTO=$((INTENTO + 1))
    if [ "$INTENTO" -ge 60 ]; then
      echo "No pude iniciar sesion como administrador en $API. Revisa ADMIN_EMAIL / ADMIN_PASSWORD y que la API este arriba."
      exit 1
    fi
    sleep 2
  fi
done

AUTH="Authorization: Bearer $TOKEN"

# ---------------------------------------------------------------- usuarios
# El registro publico de la API siempre crea usuarios con rol Consulta (solo lectura).
# El rol Admin no se puede pedir por la API: lo crea la API al arrancar con AdminSeed__Email / AdminSeed__Password.
registrar() { # nombre email password
  CODIGO=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/Auth/registro" -H "$JSON" \
    -d "{\"nombre\":\"$1\",\"email\":\"$2\",\"password\":\"$3\"}")
  case "$CODIGO" in
    200) echo "  + $2  (creado)" ;;
    409) echo "  = $2  (ya existia)" ;;
    *)   echo "  ! $2  (error HTTP $CODIGO)" ;;
  esac
}

echo "Usuarios de acceso (rol Consulta)..."
registrar "Profesor García"       "profesor@demo.local"   "Profesor_2026"
registrar "Secretaría Académica"  "secretaria@demo.local" "Secretaria_2026"
registrar "Consulta Uno"          "consulta1@demo.local"  "Consulta_2026"
registrar "Consulta Dos"          "consulta2@demo.local"  "Consulta_2026"

# ---------------------------------------------------------------- datos
HAY=$(curl -s "$API/Materia?pageSize=1" -H "$AUTH" | sed -n 's/.*"totalCount":\([0-9]*\).*/\1/p')

# crear <ruta> <json> -> imprime el id del recurso creado
crear() {
  curl -s -X POST "$API/$1" -H "$AUTH" -H "$JSON" -d "$2" | sed -n 's/.*"id":\([0-9]*\).*/\1/p'
}

inscribir() { # alumnoId materiaId -> imprime el id de la inscripcion
  crear inscripciones "{\"alumnoId\":$1,\"materiaId\":$2}"
}

dar_de_baja() { # inscripcionId
  curl -s -X PATCH "$API/inscripciones/$1/baja" -H "$AUTH" -o /dev/null
}

total() { # ruta con filtros -> imprime el totalCount
  curl -s "$API/$1" -H "$AUTH" | sed -n 's/.*"totalCount":\([0-9]*\).*/\1/p'
}

if [ "${HAY:-0}" != "0" ]; then
  echo "Ya hay materias cargadas: no se agregan materias, alumnos ni inscripciones."
else
  echo "Cargando materias..."
  MAT=$(crear Materia '{"nombre":"Matemática"}')
  PROG=$(crear Materia '{"nombre":"Programación"}')
  BD=$(crear Materia '{"nombre":"Base de Datos"}')
  FIS=$(crear Materia '{"nombre":"Física"}')          # queda sin inscripciones: en el resumen aparece con 0
  ING=$(crear Materia '{"nombre":"Inglés Técnico"}')
  EST=$(crear Materia '{"nombre":"Estadística"}')
  SO=$(crear Materia '{"nombre":"Sistemas Operativos"}')
  RED=$(crear Materia '{"nombre":"Redes de Datos"}')

  echo "Cargando alumnos..."
  ANA=$(crear Alumno '{"nombre":"Ana Pérez","email":"ana.perez@mail.com"}')
  BETO=$(crear Alumno '{"nombre":"Beto Gómez","email":"beto.gomez@mail.com"}')
  CARLA=$(crear Alumno '{"nombre":"Carla Ruiz","email":"carla.ruiz@mail.com"}')
  DIEGO=$(crear Alumno '{"nombre":"Diego Sosa","email":"diego.sosa@mail.com"}')
  EVA=$(crear Alumno '{"nombre":"Eva Luna","email":"eva.luna@mail.com"}')
  crear Alumno '{"nombre":"Franco Díaz","email":"franco.diaz@mail.com"}' > /dev/null   # sin inscripciones
  GABI=$(crear Alumno '{"nombre":"Gabriela Torres","email":"gabriela.torres@mail.com"}')
  HUGO=$(crear Alumno '{"nombre":"Hugo Vega","email":"hugo.vega@mail.com"}')
  INES=$(crear Alumno '{"nombre":"Inés Molina","email":"ines.molina@mail.com"}')
  JULIAN=$(crear Alumno '{"nombre":"Julián Castro","email":"julian.castro@mail.com"}')
  crear Alumno '{"nombre":"Karina Ríos","email":"karina.rios@mail.com"}' > /dev/null    # sin inscripciones
  LUCAS=$(crear Alumno '{"nombre":"Lucas Navarro","email":"lucas.navarro@mail.com"}')

  echo "Cargando inscripciones..."
  # Alumnos que cursan varias materias
  inscribir "$ANA" "$MAT" > /dev/null
  inscribir "$ANA" "$PROG" > /dev/null
  inscribir "$ANA" "$BD" > /dev/null
  inscribir "$BETO" "$PROG" > /dev/null
  inscribir "$BETO" "$RED" > /dev/null
  inscribir "$CARLA" "$PROG" > /dev/null
  inscribir "$CARLA" "$BD" > /dev/null
  inscribir "$CARLA" "$EST" > /dev/null
  inscribir "$DIEGO" "$BD" > /dev/null
  inscribir "$DIEGO" "$SO" > /dev/null
  inscribir "$EVA" "$MAT" > /dev/null
  inscribir "$EVA" "$ING" > /dev/null
  inscribir "$GABI" "$MAT" > /dev/null
  inscribir "$HUGO" "$RED" > /dev/null
  inscribir "$HUGO" "$SO" > /dev/null
  inscribir "$INES" "$EST" > /dev/null
  inscribir "$JULIAN" "$PROG" > /dev/null
  inscribir "$LUCAS" "$BD" > /dev/null

  # Historial: bajas, y una baja seguida de una reinscripcion (las dos filas quedan en el listado)
  DIEGO_PROG=$(inscribir "$DIEGO" "$PROG")
  dar_de_baja "$DIEGO_PROG"
  HUGO_MAT=$(inscribir "$HUGO" "$MAT")
  dar_de_baja "$HUGO_MAT"
  GABI_BD=$(inscribir "$GABI" "$BD")
  dar_de_baja "$GABI_BD"
  inscribir "$GABI" "$BD" > /dev/null

  echo "Datos cargados: $(total 'Materia?pageSize=1') materias, $(total 'Alumno?pageSize=1') alumnos y $(total 'inscripciones?pageSize=1') inscripciones" \
       "($(total 'inscripciones?estado=Activa&pageSize=1') activas y $(total 'inscripciones?estado=Baja&pageSize=1') de baja)."
fi

echo ""
echo "================ USUARIOS PARA ENTRAR ================"
echo " Administrador (puede crear, editar y borrar):"
echo "   $ADMIN_EMAIL  /  $ADMIN_PASSWORD"
echo " Solo lectura (rol Consulta):"
echo "   profesor@demo.local    /  Profesor_2026"
echo "   secretaria@demo.local  /  Secretaria_2026"
echo "   consulta1@demo.local   /  Consulta_2026"
echo "   consulta2@demo.local   /  Consulta_2026"
echo "======================================================"
