FROM node:22
WORKDIR /app
COPY . .
EXPOSE 5889
EXPOSE 5890
CMD ["compactrun.bash"]