# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción SIN base-href
RUN npm run build -- --configuration=production --base-href=/

# Stage 2: Serve con Nginx
FROM nginx:alpine

# Copiar build de Angular
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 