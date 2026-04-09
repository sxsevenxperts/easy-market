FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# nginx.conf is copied from build context root (project root)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static frontend files
COPY frontend/ /usr/share/nginx/html

# Remove markdown docs from web root
RUN find /usr/share/nginx/html -name "*.md" -delete

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
