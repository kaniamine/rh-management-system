FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# Upgrade npm to match project requirement and install deps.
# npm respects the "os" field in packages, so the Windows-only
# @rollup/rollup-win32-x64-msvc is skipped automatically on Linux.
RUN npm install -g npm@11 && npm install --legacy-peer-deps
COPY . .
# Build for production. Angular with outputMode:"server" puts browser
# files under dist/.../browser/ and names the HTML entry index.csr.html.
# Rename it so nginx can serve it as index.html for SPA routing.
RUN npm run build -- --configuration production && \
    mv dist/rh-management-frontend/browser/index.csr.html \
       dist/rh-management-frontend/browser/index.html 2>/dev/null || true

FROM nginx:alpine
COPY --from=build /app/dist/rh-management-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
