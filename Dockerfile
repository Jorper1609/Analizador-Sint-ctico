# --- ETAPA 1: Construcción (Build Stage) ---
# Usamos una imagen de Node.js con la etiqueta 'alpine' por ser ligera.
# La nombramos 'builder' para poder referenciarla luego.
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copiamos primero el package.json y package-lock.json (o yarn.lock, etc.)
# Esto aprovecha el caché de capas de Docker. Si estos archivos no cambian,
# no se volverá a ejecutar 'npm install' en futuras construcciones.
COPY package*.json ./

# Instalamos todas las dependencias del proyecto.
RUN npm install

# Copiamos el resto de los archivos del proyecto al contenedor.
COPY . .

# Ejecutamos el script de 'build' definido en tu package.json.
# Esto creará una carpeta 'dist' con los archivos estáticos.
RUN npm run build

# --- ETAPA 2: Producción (Production Stage) ---
# Usamos una imagen oficial de Nginx, que es un servidor web muy eficiente y ligero.
FROM nginx:1.25-alpine

# Copiamos los archivos estáticos generados en la etapa de 'build' 
# desde la carpeta '/app/dist' del 'builder' a la carpeta por defecto
# que Nginx utiliza para servir contenido web.
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opcional pero recomendado) Si tu app es una SPA (Single Page Application)
# y usa rutas como /pagina1, /pagina2, necesitas configurar Nginx
# para que siempre devuelva index.html. Creamos un archivo de configuración.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80, que es el puerto por defecto de Nginx.
EXPOSE 80

# El comando por defecto de la imagen de Nginx ya se encarga de iniciar el servidor,
# por lo que no es necesario añadir un CMD.
