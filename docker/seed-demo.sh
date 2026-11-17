#!/bin/sh
# Carga datos de ejemplo por la API:  docker compose run --rm seed
# Es seguro repetirlo: si ya hay materias cargadas no agrega nada.
set -eu

API="${API_URL:-http://api:8080/api}"
EMAIL="${ADMIN_EMAIL:-admin@demo.local}"
PASSWORD="${ADMIN_PASSWORD:-Admin_Demo_2026}"
JSON='Content-Type: application/json'

echo "Esperando a la API y a la cuenta de administrador..."
TOKEN=""
INTENTO=0
while [ -z "$TOKEN" ]; do
  TOKEN=$(curl -s -X POST "$API/Auth/login" -H "$JSON" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p' || true)
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

HAY=$(curl -s "$API/Materia?pageSize=1" -H "$AUTH" | sed -n 's/.*"totalCount":\([0-9]*\).*/\1/p')
if [ "${HAY:-0}" != "0" ]; then
  echo "Ya hay datos cargados: no se agrega nada."
  exit 0
fi

# crear <ruta> <json> -> imprime el id del recurso creado
crear() {
  curl -s -X POST "$API/$1" -H "$AUTH" -H "$JSON" -d "$2" | sed -n 's/.*"id":\([0-9]*\).*/\1/p'
}

inscribir() {
  crear inscripciones "{\"alumnoId\":$1,\"materiaId\":$2}"
}

echo "Cargando materias..."
MAT=$(crear Materia '{"nombre":"Matemática"}')
PROG=$(crear Materia '{"nombre":"Programación"}')
BD=$(crear Materia '{"nombre":"Base de Datos"}')
crear Materia '{"nombre":"Física"}' > /dev/null   # queda sin inscripciones: en el dashboard aparece con 0

echo "Cargando alumnos..."
ANA=$(crear Alumno '{"nombre":"Ana Pérez","email":"ana.perez@mail.com"}')
BETO=$(crear Alumno '{"nombre":"Beto Gómez","email":"beto.gomez@mail.com"}')
CARLA=$(crear Alumno '{"nombre":"Carla Ruiz","email":"carla.ruiz@mail.com"}')
DIEGO=$(crear Alumno '{"nombre":"Diego Sosa","email":"diego.sosa@mail.com"}')
EVA=$(crear Alumno '{"nombre":"Eva Luna","email":"eva.luna@mail.com"}')
crear Alumno '{"nombre":"Franco Díaz","email":"franco.diaz@mail.com"}' > /dev/null   # sin inscripciones

echo "Cargando inscripciones..."
inscribir "$ANA" "$MAT" > /dev/null
inscribir "$ANA" "$PROG" > /dev/null      # Ana cursa dos materias
inscribir "$BETO" "$PROG" > /dev/null
inscribir "$CARLA" "$PROG" > /dev/null
inscribir "$CARLA" "$BD" > /dev/null
inscribir "$EVA" "$MAT" > /dev/null
inscribir "$DIEGO" "$BD" > /dev/null
DIEGO_PROG=$(inscribir "$DIEGO" "$PROG")
curl -s -X PATCH "$API/inscripciones/$DIEGO_PROG/baja" -H "$AUTH" -o /dev/null   # una baja, para mostrar el historial

echo "Listo: 4 materias, 6 alumnos y 8 inscripciones (7 activas y 1 de baja)."
