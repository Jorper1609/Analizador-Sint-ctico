# --- Etapa 1: Construcción (si es necesario) ---
# Usar una imagen oficial de Node.js como base. La versión 18-alpine es ligera.
FROM node:18-alpine AS build

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código de la aplicación
COPY . .

# (Opcional) Si tu app necesita un paso de "build" (ej. TypeScript), añádelo aquí
# RUN npm run build

# --- Etapa 2: Producción ---
# Usar una imagen más pequeña para la ejecución final
FROM node:18-alpine

WORKDIR /app

# Copiar solo los archivos necesarios de la etapa de construcción
COPY --from=build /app .

# Exponer el puerto en el que tu aplicación escucha (ej. 3000)
EXPOSE 3000

# El comando para iniciar tu aplicación cuando el contenedor arranque
CMD [ "node", "tu_archivo_principal.js" ]
