FROM nginx:alpine

# React 빌드 산출물만 복사
COPY dist/ /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

#문서화 + 도구 참고용
EXPOSE 80 

CMD ["nginx", "-g", "daemon off;"]
