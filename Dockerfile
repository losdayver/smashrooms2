FROM node:22
WORKDIR /app
COPY . .
RUN chmod +x chmoder.bash
RUN ./chmoder.bash
EXPOSE 5889
EXPOSE 5890
CMD ["bash", "compactrun.bash"]
