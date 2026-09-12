# 微信云托管部署镜像（参考 ysdx 项目方案）
# 打包：mvnw package -DskipTests 后，将生成的 jar 与 Dockerfile 一起上传到微信云托管
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY yhjs-spring-server-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 80 8080 49996
# 云托管会自动注入 PORT 环境变量；本地默认 49996
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-49996} -jar /app/app.jar"]
