# Frontend (Angular 20): se compila con Node y se sirve con nginx.
#   docker build -t gestion-academica-web TestAngular

# ---------- 1) Compilar ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Build de producción: usa src/environments/environment.ts (apiUrl = "/api").
RUN npx ng build --configuration production --output-path dist/app

# ---------- 2) Servir ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/app/browser /usr/share/nginx/html
EXPOSE 80
