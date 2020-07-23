FROM node:14
EXPOSE 8080
COPY ./ /app
RUN /app/dockerBuild.sh
ENV PORT 8080
ENV MONGO mongodb://localhost:27017/results2020
ENV discordLogin xxx.xxx
ENV discordChannelId xxx.xxx
ENV TZ America/Chicago
ENV enableWeb true
CMD node /app/build/start.js